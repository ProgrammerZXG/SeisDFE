"""Launch one original DINOv3 seismic pretraining stage under torchrun."""

import argparse
from pathlib import Path
from omegaconf import OmegaConf
from seisdfe.models.backbone import backbone_config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume the latest checkpoint in this output directory",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate paths and show resolved settings without allocating a model",
    )
    parser.add_argument("overrides", nargs="*")
    args = parser.parse_args()
    config = OmegaConf.merge(
        backbone_config(args.config), OmegaConf.from_dotlist(args.overrides)
    )
    for field in ("student.resume_from_teacher_chkpt", "gram.ckpt"):
        value = OmegaConf.select(config, field)
        if value and not Path(value).exists():
            raise FileNotFoundError(f"{field}: {value}")
    spec = config.train.dataset_path
    if not spec.startswith("SeismicNPY:"):
        raise ValueError("This release expects SeismicNPY data")
    parts = dict(item.split("=", 1) for item in spec.split(":")[1:])
    root = Path(parts["root"])
    index = Path(parts.get("extra", str(root))) / "seismic-npy-entries.npy"
    if not root.is_dir() or not index.is_file():
        raise FileNotFoundError(f"Prepare data and index first: {root}, {index}")
    import numpy as np

    entries = np.load(index, allow_pickle=False)
    if entries.ndim != 1 or len(entries) == 0:
        raise ValueError("Empty/invalid pretraining index")
    if args.dry_run:
        print(OmegaConf.to_yaml(config))
        print(
            f"samples={len(entries)}; steps={config.optim.epochs * config.train.OFFICIAL_EPOCH_LENGTH}"
        )
        return
    import torch.distributed as torch_dist
    import dinov3.distributed as distributed
    from dinov3.train.train import main as dino_main

    # Synchronize the output check before any rank creates logs/config files.
    distributed.enable(overwrite=True, restrict_print_to_main_process=False)
    try:
        output = Path(args.output)
        error = [None]
        if distributed.get_rank() == 0:
            if output.exists() and any(output.iterdir()) and not args.resume:
                error[0] = f"Nonempty output {output}; pass --resume intentionally"
            elif args.resume and not (output / "ckpt").is_dir():
                error[0] = f"No checkpoint directory in {output}"
        torch_dist.broadcast_object_list(error, src=0)
        if error[0]:
            raise ValueError(error[0])
        cli = [
            "--config-file",
            args.config,
            "--output-dir",
            str(output),
            "--seed",
            str(config.train.seed),
        ]
        if not args.resume:
            cli.append("--no-resume")
        dino_main(cli + args.overrides)
    finally:
        distributed.disable()


if __name__ == "__main__":
    main()
