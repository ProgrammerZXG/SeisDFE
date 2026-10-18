"""CUDA smoke test: two optimizer steps per stage using ViT-S and synthetic data.

Run from the repository root. Writes .smoke/ and refuses to overwrite old runs.
"""

from pathlib import Path
import subprocess, sys, os
import numpy as np
from omegaconf import OmegaConf

root = Path.cwd()
data = root / ".smoke/images"
data.mkdir(parents=True, exist_ok=True)
for i in range(4):
    np.save(
        data / f"{i}.npy",
        np.random.default_rng(i).normal(size=(64, 64)).astype("float32"),
    )
index = root / ".smoke/index"
index.mkdir(exist_ok=True)
np.save(index / "seismic-npy-entries.npy", np.array([f"{i}.npy" for i in range(4)]))
common = {
    "student.arch": "vit_small",
    "student.ffn_layer": "mlp",
    "student.norm_layer": "layernorm",
    "student.resume_from_teacher_chkpt": "",
    "student.drop_path_rate": 0.0,
    "train.dataset_path": f"SeismicNPY:root={data}:extra={index}",
    "train.batch_size_per_gpu": 2,
    "train.num_workers": 0,
    "train.OFFICIAL_EPOCH_LENGTH": 2,
    "optim.epochs": 1,
    "train.compile": False,
    "train.checkpointing": False,
    "dino.head_n_prototypes": 16,
    "dino.head_bottleneck_dim": 8,
    "dino.head_hidden_dim": 32,
    "ibot.head_n_prototypes": 16,
    "ibot.head_bottleneck_dim": 8,
    "ibot.head_hidden_dim": 32,
    "dino.koleo_loss_distributed": False,
    "crops.global_crops_size": 32,
    "crops.local_crops_size": 16,
    "crops.local_crops_number": 2,
    "crops.global_local_crop_pairs_ratios": 1.0,
    "schedules.lr.warmup_epochs": 0,
    "schedules.lr.freeze_last_layer_epochs": 0,
    "schedules.lr.cosine_epochs": 1,
    "schedules.teacher_temp.warmup_epochs": 0,
    "dino.local_loss_weight_schedule.warmup_epochs": 0,
    "dino.local_loss_weight_schedule.cosine_epochs": 0,
    "checkpointing.period": 2,
    "checkpointing.max_to_keep": 1,
    "evaluation.eval_period_iterations": 2,
}
nproc = int(os.environ.get("SMOKE_NPROC", "1"))
for stage in (1, 2, 3):
    cfg = OmegaConf.load(f"configs/pretrain/stage{stage}.yaml")
    for k, v in common.items():
        OmegaConf.update(cfg, k, v, force_add=True)
    if stage > 1:
        previous = str(
            root / f".smoke/stage{stage - 1}/eval/training_1/sharded_teacher_checkpoint"
        )
        cfg.student.resume_from_teacher_chkpt = previous
        cfg.gram.ckpt = previous
        cfg.crops.gram_teacher_crops_size = 32
    if stage == 3:
        cfg.crops.global_crops_size = [32, 48, 64]
        cfg.crops.local_crops_size = [16, 16, 32]
        cfg.crops.gram_teacher_crops_size = [64, 64, 64]
        cfg.crops.global_local_crop_pairs_ratios = [0.35, 0.4, 0.25]
    path = root / f".smoke/stage{stage}.yaml"
    OmegaConf.save(cfg, path)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "torch.distributed.run",
            "--standalone",
            f"--nproc_per_node={nproc}",
            "-m",
            "seisdfe.cli.pretrain",
            "--config",
            str(path),
            "--output",
            str(root / f".smoke/stage{stage}"),
        ],
        check=True,
    )
print("THREE_STAGE_SMOKE_OK")
