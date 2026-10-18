"""Export existing fault/RGT research checkpoints without optimizer or base encoder."""

import argparse
from pathlib import Path
import torch
from seisdfe.data import file_sha256


def convert_config(old):
    if old.get("model", {}).get("type") != "dinov3_dpt":
        raise ValueError("Only the existing dinov3_dpt fault/RGT heads are supported")
    if old.get("backbone", {}).get("full_finetune", False):
        raise ValueError("Cannot export a fully fine-tuned encoder as an adapter")
    for key in ("well_prompt", "encoder_prompt"):
        if old.get(key, {}).get("enabled", False):
            raise ValueError(f"Unsupported model extension: {key}")
    dpt = old["dpt_seg"]
    for key in ("coord_features", "hires_stem"):
        if dpt.get(key, {}).get("enabled", False):
            raise ValueError(f"Unsupported DPT extension: {key}")
    task = old["task"]
    enc = old["backbone"]
    if task["name"] not in {"fault", "rgt"}:
        raise ValueError("Expected fault or rgt checkpoint")
    norm = {
        key: old.get("norm", {}).get(key, default)
        for key, default in (("clip_sigma", 3.0), ("zscore", True), ("minmax_01", True))
    }
    return {
        "encoder": {
            "config": "configs/encoder/vit7b.yaml",
            "weights": "checkpoints/seisdfe_stage3.pth",
            "branch": "teacher",
            "layers": enc["out_layer_indices"],
            "normalize": enc.get("use_backbone_norm", False),
        },
        "task": {
            "name": task["name"],
            "type": task["task_type"],
            "num_classes": task["num_classes"],
        },
        "decoder": {
            "type": "dpt",
            "hidden_dim": dpt.get("channels", 256),
            "post_process_channels": dpt.get(
                "post_process_channels", [128, 256, 512, 1024]
            ),
            "use_batchnorm": dpt.get("use_batchnorm", True),
            "n_bins": dpt.get("n_bins", 0),
            "min_value": dpt.get("min_value", 0.0),
            "max_value": dpt.get("max_value", 1.0),
            "norm_strategy": dpt.get("norm_strategy", "linear"),
        },
        "lora": old.get("lora", {"enabled": False}),
        "normalization": norm,
        "data": {"image_size": [512, 512]},
        "inference": {
            "mode": "fault-tiles" if task["name"] == "fault" else "rgt-lateral",
            "precision": "bf16",
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    output = Path(args.output)
    if output.exists():
        raise FileExistsError(output)
    source = torch.load(args.input, map_location="cpu", weights_only=True)
    config = convert_config(source["cfg"])
    state = source["model"]
    if any(k.startswith("backbone.") and ".lora_" not in k for k in state):
        raise ValueError("Legacy checkpoint unexpectedly contains base encoder weights")
    payload = {
        "format": "seisdfe-adapter-v1",
        "model": state,
        "config": config,
        "source_sha256": file_sha256(args.input),
        "epoch": source.get("epoch"),
        "best_metric": source.get("best_metric"),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    torch.save(payload, output)
    print(f"Exported {len(state)} tensors to {output}; sha256={file_sha256(output)}")


if __name__ == "__main__":
    main()
