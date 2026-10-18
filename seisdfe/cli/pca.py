"""Visualize one or more zero-based DINOv3 feature layers using PCA."""

import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
from seisdfe.data import read_array, file_sha256
from seisdfe.models.backbone import load_backbone
from seisdfe.pca import fit_pca, apply_pca
from seisdfe.training import autocast, seed_everything


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--encoder-config", required=True)
    parser.add_argument("--encoder-weights", required=True)
    parser.add_argument("--input", required=True)
    parser.add_argument("--input-key", default="seis")
    parser.add_argument("--output", required=True)
    parser.add_argument("--layers", type=int, nargs="+", default=[39])
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--precision", choices=["fp32", "bf16"], default="bf16")
    parser.add_argument("--basis", help="Reuse an existing basis .npz (one layer only)")
    args = parser.parse_args()
    seed_everything(0, device=args.device)
    if args.basis and len(args.layers) != 1:
        raise ValueError("--basis requires exactly one layer")
    output = Path(args.output)
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(output)
    output.mkdir(parents=True, exist_ok=True)
    raw = read_array(args.input, args.input_key)
    # PCA uses the original pretraining normalization without 8-bit quantization.
    from dinov3.data.datasets.seismic_npy import SeismicNPY

    section = SeismicNPY._preprocess(raw)
    model = load_backbone(args.encoder_config, args.encoder_weights, args.device)
    if (
        args.layers != sorted(set(args.layers))
        or min(args.layers) < 0
        or max(args.layers) >= len(model.blocks)
    ):
        raise ValueError("layers must be unique ascending zero-based block indices")
    ps = int(model.patch_size)
    h, w = section.shape
    x = torch.from_numpy(section)[None, None].to(args.device)
    x = F.pad(x, (0, (-w) % ps, 0, (-h) % ps), mode="replicate")
    if model.patch_embed.proj.in_channels == 3:
        x = x.repeat(1, 3, 1, 1)
    with torch.inference_mode(), autocast(args.device, args.precision):
        features = model.get_intermediate_layers(
            x, n=args.layers, reshape=True, norm=True
        )
    Image.fromarray((section * 255).astype(np.uint8)).save(output / "seismic.png")
    for layer, feature in zip(args.layers, features):
        feature = feature[0].float().cpu().numpy()
        channels, gh, gw = feature.shape
        values = feature.reshape(channels, -1).T
        if args.basis:
            with np.load(args.basis, allow_pickle=False) as archive:
                state = dict(archive)
        else:
            state = fit_pca(values)
        rgb = apply_pca(values, state).reshape(gh, gw, 3)
        rgb = (
            F.interpolate(
                torch.from_numpy(rgb).permute(2, 0, 1)[None],
                size=x.shape[-2:],
                mode="bilinear",
                align_corners=False,
            )[0]
            .permute(1, 2, 0)
            .numpy()[:h, :w]
        )
        Image.fromarray((rgb * 255).astype(np.uint8)).save(
            output / f"layer_{layer:02d}_pca.png"
        )
        Image.fromarray(
            ((0.55 * section[..., None] + 0.45 * rgb) * 255).astype(np.uint8)
        ).save(output / f"layer_{layer:02d}_overlay.png")
        np.savez(output / f"layer_{layer:02d}_basis.npz", **state)
    (output / "metadata.json").write_text(
        json.dumps(
            {
                **vars(args),
                "input_sha256": file_sha256(args.input),
                "branch": "teacher",
                "input_shape": [h, w],
                "padded_shape": list(x.shape[-2:]),
                "note": "Independent PCA colors are not class labels; reuse a basis for cross-section comparison.",
            },
            indent=2,
        )
        + "\n"
    )


if __name__ == "__main__":
    main()
