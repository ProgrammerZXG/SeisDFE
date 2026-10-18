"""Run a released or few-shot SeisDFE adapter on a section or directory."""

import argparse
import json
from pathlib import Path
import numpy as np
import torch
from seisdfe.config import save_config
from seisdfe.data import read_array, file_sha256
from seisdfe.models.model import build_model
from seisdfe.inference import predict_section


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--checkpoint", required=True, help="SeisDFE adapter .pth with embedded config"
    )
    parser.add_argument("--encoder-config", required=True)
    parser.add_argument("--encoder-weights", required=True)
    parser.add_argument(
        "--input",
        required=True,
        help="Numeric .npy/.npz section, or directory of .npy sections",
    )
    parser.add_argument("--input-key", default="seis")
    parser.add_argument("--output", required=True)
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--precision", choices=["fp32", "bf16"], default="bf16")
    parser.add_argument(
        "--mode", choices=["native", "resize", "fault-tiles", "rgt-lateral"]
    )
    parser.add_argument("--window", type=int, default=512)
    parser.add_argument("--overlap", type=int, default=256)
    args = parser.parse_args()
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    if checkpoint.get("format") != "seisdfe-adapter-v1":
        raise ValueError(
            "Convert legacy field checkpoints with seisdfe-export-head first"
        )
    config = checkpoint["config"]
    config["encoder"].update(config=args.encoder_config, weights=args.encoder_weights)
    config.setdefault("inference", {})["precision"] = args.precision
    mode = args.mode or config["inference"].get("mode", "resize")
    output = Path(args.output)
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(f"Nonempty output: {output}")
    path = Path(args.input)
    files = sorted(path.rglob("*.npy")) if path.is_dir() else [path]
    if not files:
        raise FileNotFoundError(f"No sections in {path}")
    model = build_model(config, args.device)
    model.load_adapter(checkpoint["model"])
    model.eval()
    output.mkdir(parents=True, exist_ok=True)
    save_config(config, output / "config.yaml")
    records = []
    for source in files:
        section = read_array(source, args.input_key)
        pred = predict_section(
            model, section, config, args.device, mode, args.window, args.overlap
        )
        relative = source.relative_to(path) if path.is_dir() else Path(source.name)
        destination = output / relative.with_suffix(".npy")
        destination.parent.mkdir(parents=True, exist_ok=True)
        # Binary/regression: HxW. Multiclass: CxHxW class probabilities.
        np.save(destination, pred[0] if pred.shape[0] == 1 else pred)
        if config["task"]["type"] == "segmentation":
            labels = (
                (pred[0] >= 0.5).astype(np.uint8)
                if pred.shape[0] == 1
                else pred.argmax(0).astype(np.int32)
            )
            label_path = output / "labels" / relative.with_suffix(".npy")
            label_path.parent.mkdir(parents=True, exist_ok=True)
            np.save(label_path, labels)
        records.append(
            {
                "input": str(source),
                "sha256": file_sha256(source),
                "shape": list(section.shape),
                "output": str(destination),
            }
        )
        print(destination, flush=True)
    (output / "metadata.json").write_text(
        json.dumps(
            {
                "mode": mode,
                "window": args.window,
                "overlap": args.overlap,
                "checkpoint": args.checkpoint,
                "checkpoint_sha256": file_sha256(args.checkpoint),
                "files": records,
            },
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
