"""Native, tiled fault, and lateral-window RGT inference on seismic sections."""

import numpy as np
import torch
import torch.nn.functional as F
from .normalization import normalize_seismic
from .training import autocast


def window_starts(length, window, overlap):
    if window < 1 or not 0 <= overlap < window:
        raise ValueError("Require window > 0 and 0 <= overlap < window")
    if length <= window:
        return [0]
    starts = list(range(0, length - window + 1, window - overlap))
    if starts[-1] != length - window:
        starts.append(length - window)
    return starts


def resize_array(array, shape):
    tensor = torch.from_numpy(np.ascontiguousarray(array)).float()
    return F.interpolate(
        tensor.reshape(1, 1, *tensor.shape),
        size=shape,
        mode="bilinear",
        align_corners=False,
    )[0, 0].numpy()


@torch.no_grad()
def predict_patch(model, section, config, device, normalized=False):
    image = (
        section
        if normalized
        else normalize_seismic(section, **config.get("normalization", {}))
    )
    with autocast(device, config.get("inference", {}).get("precision", "fp32")):
        pred = model(torch.from_numpy(image)[None, None].to(device)).float()
    if config["task"]["type"] == "segmentation":
        pred = pred.sigmoid() if pred.shape[1] == 1 else pred.softmax(dim=1)
    if not torch.isfinite(pred).all():
        raise FloatingPointError("Non-finite model prediction")
    return pred[0].cpu().numpy()


def predict_section(
    model, section, config, device, mode="native", window=512, overlap=256
):
    """Return [C,H,W] probabilities or [1,H,W] RGT, preserving original geometry.

    Fault patch mode reproduces the existing per-patch normalization and maximum
    overlap fusion. RGT lateral mode keeps full depth and cosine-blends windows;
    no independent depth tiles or per-window output normalization are introduced.
    """
    section = np.asarray(section, dtype=np.float32)
    if section.ndim != 2 or min(section.shape) < 1 or not np.isfinite(section).all():
        raise ValueError("Expected a finite nonempty [depth, trace] section")
    if not 0 <= overlap < window:
        raise ValueError("Require 0 <= overlap < window")
    height, width = section.shape
    if mode == "native":
        return predict_patch(model, section, config, device)
    if mode == "resize":
        size = config.get("data", {}).get("image_size") or [window, window]
        normalized = normalize_seismic(section, **config.get("normalization", {}))
        pred = predict_patch(
            model, resize_array(normalized, size), config, device, normalized=True
        )
        return np.stack([resize_array(p, (height, width)) for p in pred])
    if mode == "fault-tiles":
        if (
            config["task"]["type"] != "segmentation"
            or config["task"]["num_classes"] != 1
        ):
            raise ValueError(
                "fault-tiles max fusion requires a single-logit binary fault model"
            )
        scale = max(1.0, window / min(height, width))
        shape = (max(window, round(height * scale)), max(window, round(width * scale)))
        work = section if shape == section.shape else resize_array(section, shape)
        result = np.zeros(shape, dtype=np.float32)
        for top in window_starts(shape[0], window, overlap):
            for left in window_starts(shape[1], window, overlap):
                pred = predict_patch(
                    model,
                    work[top : top + window, left : left + window],
                    config,
                    device,
                )[0]
                region = result[top : top + window, left : left + window]
                np.maximum(region, pred, out=region)
        return (
            resize_array(result, (height, width))[None]
            if shape != section.shape
            else result[None]
        )
    if mode == "rgt-lateral":
        if config["task"]["type"] != "regression":
            raise ValueError("rgt-lateral requires regression")
        window = min(window, width)
        overlap = max(0, min(overlap, window - 16))
        starts = window_starts(width, window, overlap)
        result = np.zeros((height, width), dtype=np.float64)
        weights = np.zeros_like(result)
        taper = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, overlap)) if overlap else None
        # The original field predictor resizes to the nearest patch-grid multiple.
        shape = (max(16, round(height / 16) * 16), max(16, round(window / 16) * 16))
        for left in starts:
            piece = section[:, left : left + window]
            pred = predict_patch(model, resize_array(piece, shape), config, device)[0]
            pred = resize_array(pred, piece.shape)
            ramp = np.ones(window)
            if taper is not None:
                if left > 0:
                    ramp[:overlap] = taper
                if left + window < width:
                    ramp[-overlap:] = taper[::-1]
            result[:, left : left + window] += pred * ramp
            weights[:, left : left + window] += ramp
        if np.any(weights <= 0):
            raise RuntimeError("Uncovered lateral window pixels")
        return (result / weights).astype(np.float32)[None]
    raise ValueError(f"Unknown inference mode {mode}")
