"""CPU regression tests using an actual tiny DINOv3 transformer, no downloads."""

import copy
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
import numpy as np
import torch
from dinov3.models.vision_transformer import DinoVisionTransformer
from seisdfe.models.model import build_model
from seisdfe.models.backbone import select_backbone_state
from seisdfe.data import SectionDataset, select_subset, dataset_manifest, read_array
from seisdfe.pca import fit_pca, apply_pca
from seisdfe.inference import predict_section, window_starts
from seisdfe.training import train, seed_everything, compute_loss


def tiny_backbone():
    model = DinoVisionTransformer(
        img_size=32,
        patch_size=8,
        in_chans=1,
        embed_dim=32,
        depth=4,
        num_heads=4,
        n_storage_tokens=2,
        ffn_ratio=2,
        pos_embed_rope_dtype="fp32",
        mask_k_bias=True,
    )
    model.init_weights()
    return model


def config(root="."):
    return {
        "encoder": {"layers": [0, 1, 2, 3], "normalize": True},
        "decoder": {
            "type": "linear",
            "fusion": "mean",
            "hidden_dim": 32,
            "post_process_channels": [8, 16, 24, 32],
            "use_batchnorm": False,
        },
        "lora": {
            "enabled": False,
            "last_n_blocks": 2,
            "rank": 2,
            "alpha": 4,
            "dropout": 0.0,
        },
        "task": {
            "name": "fault",
            "type": "segmentation",
            "num_classes": 2,
            "ignore_index": 255,
        },
        "data": {"root": str(root), "image_size": [32, 32]},
        "normalization": {},
        "train": {
            "seed": 3407,
            "output": str(Path(root) / "run"),
            "shots": 2,
            "steps": 2,
            "batch_size": 1,
            "lr": 1e-3,
            "precision": "fp32",
            "eval_every": 1,
            "deterministic": True,
        },
        "inference": {"precision": "fp32"},
    }


def make_data(root):
    rng = np.random.default_rng(4)
    for split in ("train", "val"):
        for folder in ("images", "labels"):
            (Path(root) / split / folder).mkdir(parents=True)
        for i in range(3):
            image = rng.normal(size=(32, 32)).astype(np.float32)
            np.save(Path(root) / split / "images" / f"{i}.npy", image)
            np.save(
                Path(root) / split / "labels" / f"{i}.npy", (image > 0).astype(np.int64)
            )


class ReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(1)

    def test_decoders_and_lora_gradients(self):
        for decoder in ("linear", "conv", "pup", "mla", "dpt"):
            for enabled in (False, True):
                with self.subTest(decoder=decoder, lora=enabled):
                    seed_everything(42)
                    cfg = config()
                    cfg["decoder"]["type"] = decoder
                    cfg["lora"]["enabled"] = enabled
                    model = build_model(cfg, "cpu", tiny_backbone())
                    model.train()
                    before = {
                        k: v.clone()
                        for k, v in model.backbone.backbone.state_dict().items()
                        if ".lora_" not in k
                    }
                    pred = model(torch.randn(2, 1, 35, 41))
                    self.assertEqual(pred.shape, (2, 2, 35, 41))
                    pred.square().mean().backward()
                    names = [
                        k for k, p in model.named_parameters() if p.grad is not None
                    ]
                    self.assertTrue(any(n.startswith("head.") for n in names))
                    self.assertTrue(
                        all(
                            not n.startswith("backbone.") or ".lora_" in n
                            for n in names
                        )
                    )
                    if enabled:
                        self.assertTrue(any(".lora_B" in n for n in names))
                    opt = torch.optim.AdamW(
                        [p for p in model.parameters() if p.requires_grad], lr=1e-3
                    )
                    opt.step()
                    for k, v in before.items():
                        self.assertTrue(
                            torch.equal(v, model.backbone.backbone.state_dict()[k])
                        )
                    state = model.adapter_state_dict()
                    model.load_adapter(state)
                    with self.assertRaises(ValueError):
                        model.load_adapter(
                            {k: v for j, (k, v) in enumerate(state.items()) if j}
                        )

    def test_lora_zero_initialization(self):
        seed_everything(3)
        backbone = tiny_backbone()
        cfg = config()
        plain = build_model(cfg, "cpu", copy.deepcopy(backbone)).eval()
        cfg["lora"]["enabled"] = True
        tuned = build_model(cfg, "cpu", copy.deepcopy(backbone)).eval()
        tuned.head.load_state_dict(plain.head.state_dict())
        x = torch.randn(1, 1, 32, 32)
        torch.testing.assert_close(plain(x), tuned(x), rtol=1e-5, atol=1e-6)

    def test_data_manifest_and_leakage(self):
        with tempfile.TemporaryDirectory() as root:
            make_data(root)
            cfg = config(root)
            train_set = SectionDataset(root, "train", cfg)
            val = SectionDataset(root, "val", cfg)
            indices = select_subset(train_set, 2, 12)
            self.assertEqual(indices, select_subset(train_set, 2, 12))
            self.assertEqual(len(dataset_manifest(train_set, val, indices)["train"]), 2)
            with self.assertRaises(ValueError):
                select_subset(train_set, 4, 0)
            (Path(root) / "val/images/0.npy").write_bytes(
                train_set.images[indices[0]].read_bytes()
            )
            with self.assertRaises(ValueError):
                dataset_manifest(train_set, val, indices)
            np.save(Path(root) / "bad.npy", np.array([[float("nan")]]))
            with self.assertRaises(ValueError):
                read_array(Path(root) / "bad.npy")

    def test_normalization_and_weighted_dice(self):
        from seisdfe.normalization import normalize_seismic

        values = np.random.default_rng(7).normal(size=(8, 10)).astype(np.float32)
        z = (values - values.mean()) / (values.std() + 1e-8)
        expected = (z - z.min()) / (z.max() - z.min() + 1e-8)
        np.testing.assert_array_equal(
            normalize_seismic(values, mode="mean_std_minmax"), expected
        )
        logits = torch.randn(2, 3, 8, 10)
        labels = torch.randint(0, 3, (2, 8, 10))
        counts = torch.bincount(labels.flatten(), minlength=3).float()
        weight = 1 / counts
        weight /= weight.sum()
        probability = logits.softmax(1)
        truth = torch.nn.functional.one_hot(labels, 3).permute(0, 3, 1, 2).float()
        expected_loss = (
            sum(
                1
                - (2 * (weight[c] * truth[:, c] * probability[:, c]).sum() + 1)
                / (
                    (weight[c] * truth[:, c]).sum()
                    + (weight[c] * probability[:, c]).sum()
                    + 1
                )
                for c in range(3)
            )
            / 3
        )
        actual = compute_loss(
            logits, labels[:, None], {"type": "segmentation", "loss": "weighted_dice"}
        )
        torch.testing.assert_close(expected_loss, actual)
        with tempfile.TemporaryDirectory() as root:
            make_data(root)
            labels = np.ones((32, 32), dtype=np.int64)
            labels[0, 0] = 255
            np.save(Path(root) / "train/labels/0.npy", labels)
            cfg = config(root)
            cfg["data"]["label_offset"] = -1
            _, target = SectionDataset(root, "train", cfg).sample(0)
            self.assertEqual(target[0, 0, 0].item(), 255)
            self.assertEqual(target[0, 1, 1].item(), 0)

    def test_pca_reusable_basis(self):
        values = np.random.default_rng(2).normal(size=(40, 8))
        basis = fit_pca(values)
        rgb = apply_pca(values, basis)
        np.testing.assert_array_equal(rgb, apply_pca(values, fit_pca(values)))
        self.assertEqual(rgb.shape, (40, 3))
        self.assertTrue(np.isfinite(rgb).all())
        constant = apply_pca(np.ones((5, 4)), fit_pca(np.ones((5, 4))))
        self.assertTrue(np.isfinite(constant).all())

    def test_window_geometry(self):
        for length in (1, 13, 32, 79):
            coverage = np.zeros(length)
            for start in window_starts(length, 32, 16):
                coverage[start : start + 32] += 1
            self.assertTrue((coverage > 0).all())

        class Constant(torch.nn.Module):
            def forward(self, x):
                return x.new_ones((x.shape[0], 1, *x.shape[-2:]))

        cfg = config()
        cfg["task"]["num_classes"] = 1
        section = np.ones((37, 83), dtype=np.float32)
        pred = predict_section(Constant(), section, cfg, "cpu", "fault-tiles", 32, 16)
        np.testing.assert_allclose(pred, 1 / (1 + np.exp(-1)), rtol=1e-6)
        cfg["task"]["type"] = "regression"
        pred = predict_section(Constant(), section, cfg, "cpu", "rgt-lateral", 32, 16)
        np.testing.assert_allclose(pred, 1, rtol=1e-6)
        with self.assertRaises(ValueError):
            predict_section(Constant(), section, cfg, "cpu", "fault-tiles", 32, 32)

    def test_train_checkpoint_roundtrip(self):
        with tempfile.TemporaryDirectory() as root:
            make_data(root)
            cfg = config(root)
            seed_everything(7)
            backbone = tiny_backbone()
            captured = {}
            real_save = torch.save

            def capture_save(payload, path):
                if (
                    isinstance(payload, dict)
                    and payload.get("step") == 1
                    and "rng" in payload
                ):
                    captured.update(copy.deepcopy(payload))
                real_save(payload, path)

            with patch("torch.save", side_effect=capture_save):
                model = train(cfg, "cpu", backbone=copy.deepcopy(backbone))
            midpoint = Path(root) / "midpoint.pth"
            real_save(captured, midpoint)
            checkpoint = torch.load(Path(root) / "run/best.pth", weights_only=True)
            restored = build_model(cfg, "cpu", copy.deepcopy(backbone))
            restored.load_adapter(checkpoint["model"])
            restored.eval()
            self.assertTrue(torch.isfinite(restored(torch.ones(1, 1, 32, 32))).all())
            last = torch.load(Path(root) / "run/last.pth", weights_only=True)
            resumed = train(
                cfg,
                "cpu",
                resume=midpoint,
                backbone=copy.deepcopy(backbone),
            )
            for k, v in model.adapter_state_dict().items():
                torch.testing.assert_close(
                    v, resumed.adapter_state_dict()[k], rtol=0, atol=0
                )
            self.assertEqual(last["step"], 2)

    def test_regression_bins_and_ignore(self):
        cfg = config()
        cfg["decoder"].update(type="dpt", n_bins=16)
        cfg["task"].update(type="regression", num_classes=1)
        model = build_model(cfg, "cpu", tiny_backbone()).eval()
        result = model(torch.randn(1, 1, 31, 39))
        self.assertEqual(result.shape, (1, 1, 31, 39))
        self.assertTrue(((result >= 0) & (result <= 1)).all())
        with self.assertRaises(ValueError):
            compute_loss(
                torch.ones(1, 2, 2, 2), torch.full((1, 1, 2, 2), 255), config()["task"]
            )

    def test_strict_backbone_loaders(self):
        from seisdfe.models.backbone import load_backbone
        import torch.distributed.checkpoint as dcp

        with tempfile.TemporaryDirectory() as root:
            root = Path(root)
            (root / "config.yaml").write_text("{}\n")
            seed_everything(4)
            original = tiny_backbone()
            state = original.state_dict()
            torch.save(
                {"teacher": {"backbone." + k: v for k, v in state.items()}},
                root / "encoder.pth",
            )
            factory = lambda *args, **kwargs: (tiny_backbone(), 32)
            with patch("seisdfe.models.backbone.build_model", side_effect=factory):
                loaded = load_backbone(
                    root / "config.yaml", root / "encoder.pth", "cpu"
                )
                for k, v in state.items():
                    torch.testing.assert_close(
                        v, loaded.state_dict()[k], rtol=0, atol=0
                    )
                dcp.save(
                    {"model": {"teacher": {"backbone": state}}},
                    checkpoint_id=root / "dcp",
                )
                loaded = load_backbone(root / "config.yaml", root / "dcp", "cpu")
                for k, v in state.items():
                    torch.testing.assert_close(
                        v, loaded.state_dict()[k], rtol=0, atol=0
                    )

    def test_checkpoint_branch_selection(self):
        state = {"patch_embed.proj.weight": torch.ones(1)}
        self.assertEqual(
            set(
                select_backbone_state(
                    {"teacher": {"backbone." + k: v for k, v in state.items()}}
                )
            ),
            set(state),
        )
        with self.assertRaises(ValueError):
            select_backbone_state({"student": state}, "teacher")


if __name__ == "__main__":
    unittest.main()
