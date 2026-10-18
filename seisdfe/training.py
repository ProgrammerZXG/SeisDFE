"""Step-based few-shot training with adapter-only checkpoints and exact RNG resume."""

import json
import os
import random
from pathlib import Path
import platform
from contextlib import nullcontext
import numpy as np
import torch
import torch.nn.functional as F
from .config import save_config
from .data import SectionDataset, select_subset, dataset_manifest
from .models.model import build_model


def seed_everything(seed, deterministic=True, device="cpu"):
    os.environ.setdefault("CUBLAS_WORKSPACE_CONFIG", ":4096:8")
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.device(device).type == "cuda":
        torch.cuda.manual_seed(seed)
    torch.backends.cudnn.benchmark = False
    torch.backends.cudnn.deterministic = deterministic
    torch.use_deterministic_algorithms(deterministic)


def autocast(device, precision):
    if precision == "fp32":
        return nullcontext()
    if precision != "bf16" or torch.device(device).type != "cuda":
        raise ValueError("Mixed precision supports bf16 on CUDA; use fp32 on CPU")
    return torch.autocast("cuda", dtype=torch.bfloat16)


def ssim_loss(pred, target):
    """Local SSIM on a fixed [0,1] range; no prediction-dependent rescaling."""
    size = min(11, *pred.shape[-2:])
    size -= 1 - size % 2
    pool = lambda x: F.avg_pool2d(x, size, 1)
    mu_x, mu_y = pool(pred), pool(target)
    var_x = pool(pred.square()) - mu_x.square()
    var_y = pool(target.square()) - mu_y.square()
    cov = pool(pred * target) - mu_x * mu_y
    score = ((2 * mu_x * mu_y + 0.01**2) * (2 * cov + 0.03**2)) / (
        (mu_x.square() + mu_y.square() + 0.01**2) * (var_x + var_y + 0.03**2)
    )
    return 1 - score.mean()


def compute_loss(pred, target, task):
    pred = pred.float()
    target = target.float()
    if task["type"] == "regression":
        loss = task.get("loss", "mse")
        if loss == "mse":
            return F.mse_loss(pred, target)
        if loss == "l1":
            return F.l1_loss(pred, target)
        if loss == "l1_ssim":
            return 0.5 * F.l1_loss(pred, target) + 0.5 * ssim_loss(pred, target)
        raise ValueError(f"Unknown regression loss {loss}")
    valid = target[:, 0] != task.get("ignore_index", 255)
    if not valid.any():
        raise ValueError("Training sample contains no labeled pixels")
    if pred.shape[1] > 1:
        kind = task.get("loss", "cross_entropy")
        if kind == "cross_entropy":
            return F.cross_entropy(
                pred, target[:, 0].long(), ignore_index=task.get("ignore_index", 255)
            )
        if kind not in {"dice", "weighted_dice"}:
            raise ValueError(f"Unknown segmentation loss {kind}")
        labels = target[:, 0].long().masked_fill(~valid, 0)
        truth = (
            F.one_hot(labels, pred.shape[1]).permute(0, 3, 1, 2).float()
            * valid[:, None]
        )
        probability = pred.softmax(1) * valid[:, None]
        if kind == "weighted_dice":
            counts = torch.bincount(labels[valid], minlength=pred.shape[1]).float()
            weights = torch.where(counts > 0, 1 / counts, counts.new_tensor(1e-10))
            weights = weights / weights.sum()
        else:
            weights = pred.new_ones(pred.shape[1])
        intersection = (probability * truth).sum((0, 2, 3)) * weights
        union = (probability.sum((0, 2, 3)) + truth.sum((0, 2, 3))) * weights
        return (1 - (2 * intersection + 1) / (union + 1)).mean()
    logits, truth = pred[:, 0][valid], target[:, 0][valid]
    bce = F.binary_cross_entropy_with_logits(logits, truth)
    prob = logits.sigmoid()
    dice = 1 - (2 * (prob * truth).sum() + 1) / (prob.sum() + truth.sum() + 1)
    return task.get("bce_weight", 0.3) * bce + task.get("dice_weight", 0.7) * dice


@torch.no_grad()
def evaluate(model, dataset, config, device):
    model.eval()
    losses = []
    task = config["task"]
    classes = max(2, task["num_classes"])
    confusion = torch.zeros((classes, classes), dtype=torch.int64)
    count = 0
    squared = 0.0
    absolute = 0.0
    for i in range(len(dataset)):
        image, target = dataset.sample(i)
        target = target[None].to(device)
        with autocast(device, config["train"].get("precision", "fp32")):
            pred = model(image[None].to(device))
        losses.append(float(compute_loss(pred, target, task)))
        if task["type"] == "regression":
            diff = pred.float() - target
            count += diff.numel()
            absolute += diff.abs().sum().item()
            squared += diff.square().sum().item()
        else:
            label = (pred[:, 0] > 0).long() if pred.shape[1] == 1 else pred.argmax(1)
            truth = target[:, 0].long()
            valid = truth != task.get("ignore_index", 255)
            confusion += torch.bincount(
                (truth[valid] * classes + label[valid]).cpu(), minlength=classes**2
            ).reshape(classes, classes)
    result = {"loss": float(np.mean(losses))}
    if task["type"] == "regression":
        result.update(mae=absolute / count, rmse=(squared / count) ** 0.5)
    else:
        matrix = confusion.double()
        intersection = matrix.diag()
        union = matrix.sum(0) + matrix.sum(1) - intersection
        present = union > 0
        result.update(
            miou=float((intersection[present] / union[present]).mean()),
            confusion_matrix=confusion.tolist(),
        )
    return result


def _rng_state(device):
    return {
        "torch": torch.get_rng_state(),
        "cuda": torch.cuda.get_rng_state(device)
        if torch.device(device).type == "cuda"
        else None,
        "python": random.getstate(),
    }


def _restore_rng(state, device):
    torch.set_rng_state(state["torch"])
    random.setstate(state["python"])
    if state["cuda"] is not None and torch.device(device).type == "cuda":
        torch.cuda.set_rng_state(state["cuda"], device)


def train(config, device="cuda", resume=None, backbone=None):
    run = config["train"]
    seed = int(run.get("seed", 3407))
    seed_everything(seed, run.get("deterministic", True), device)
    output = Path(run["output"])
    if output.exists() and any(output.iterdir()) and resume is None:
        raise FileExistsError(
            f"Output is nonempty: {output}. Choose another directory or --resume."
        )
    output.mkdir(parents=True, exist_ok=True)
    train_set = SectionDataset(config["data"]["root"], "train", config)
    val_set = SectionDataset(config["data"]["root"], "val", config)
    indices = select_subset(train_set, int(run["shots"]), seed, run.get("subset_file"))
    manifest = dataset_manifest(train_set, val_set, indices)
    model = build_model(config, device, backbone)
    optimizer_type = {"adam": torch.optim.Adam, "adamw": torch.optim.AdamW}[
        run.get("optimizer", "adam")
    ]
    optimizer = optimizer_type(
        [p for p in model.parameters() if p.requires_grad],
        lr=float(run["lr"]),
        weight_decay=float(run.get("weight_decay", 0.0)),
    )
    start = 0
    best = float("inf")
    if resume:
        ckpt = torch.load(resume, map_location="cpu", weights_only=True)
        if ckpt["config"] != config or ckpt["data_manifest"] != manifest:
            raise ValueError("Resume requires identical config and data hashes")
        model.load_adapter(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start = ckpt["step"]
        best = ckpt["best_loss"]
        _restore_rng(ckpt["rng"], device)
    save_config(config, output / "config.yaml")
    (output / "data_manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (output / "train_ids.txt").write_text(
        "\n".join(train_set.images[i].name for i in indices) + "\n"
    )
    (output / "environment.json").write_text(
        json.dumps(
            {
                "python": platform.python_version(),
                "torch": str(torch.__version__),
                "numpy": np.__version__,
                "device": str(device),
                "cuda": torch.version.cuda,
            },
            indent=2,
        )
        + "\n"
    )
    steps = int(run["steps"])
    interval = int(run.get("eval_every", 100))
    if (
        steps < 1
        or interval < 1
        or int(run.get("batch_size", 1)) < 1
        or int(run.get("log_every", 10)) < 1
    ):
        raise ValueError("steps, eval_every, log_every and batch_size must be positive")
    for step in range(start, steps):
        model.train()
        optimizer.zero_grad(set_to_none=True)
        # Each step's subset sampling/augmentation is independent of worker order.
        rng = np.random.default_rng(np.random.SeedSequence([seed, step]))
        batch = rng.choice(
            indices,
            size=int(run.get("batch_size", 1)),
            replace=len(indices) < int(run.get("batch_size", 1)),
        )
        samples = [train_set.sample(int(i), rng) for i in batch]
        image = torch.stack([s[0] for s in samples]).to(device)
        target = torch.stack([s[1] for s in samples]).to(device)
        with autocast(device, run.get("precision", "fp32")):
            pred = model(image)
            loss = compute_loss(pred, target, config["task"])
        if not torch.isfinite(loss):
            raise FloatingPointError(f"Non-finite loss at step {step + 1}")
        loss.backward()
        torch.nn.utils.clip_grad_norm_(
            [p for p in model.parameters() if p.requires_grad],
            run.get("grad_clip", 1.0),
            error_if_nonfinite=True,
        )
        optimizer.step()
        if (step + 1) % int(run.get("log_every", 10)) == 0:
            print(f"step={step + 1}/{steps} loss={loss.item():.6f}", flush=True)
        if (step + 1) % interval == 0 or step + 1 == steps:
            metrics = evaluate(model, val_set, config, device)
            improved = metrics["loss"] < best
            best = min(best, metrics["loss"])
            record = {
                "step": step + 1,
                "train_loss": loss.item(),
                "validation": metrics,
            }
            with (output / "metrics.jsonl").open("a") as stream:
                stream.write(json.dumps(record) + "\n")
            payload = {
                "format": "seisdfe-adapter-v1",
                "model": model.adapter_state_dict(),
                "config": config,
                "step": step + 1,
                "best_loss": best,
                "optimizer": optimizer.state_dict(),
                "rng": _rng_state(device),
                "data_manifest": manifest,
            }
            torch.save(payload, output / "last.tmp")
            os.replace(output / "last.tmp", output / "last.pth")
            if improved:
                torch.save(
                    {
                        k: v
                        for k, v in payload.items()
                        if k not in {"optimizer", "rng", "data_manifest"}
                    },
                    output / "best.tmp",
                )
                os.replace(output / "best.tmp", output / "best.pth")
            print(json.dumps(record), flush=True)
    return model
