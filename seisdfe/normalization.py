# Migrated from the SeisDFE research normalization pipeline.
import numpy as np


def normalize_seismic(
    arr: np.ndarray,
    clip_sigma: float = 3.0,
    zscore: bool = True,
    minmax_01: bool = True,
    mode: str = "seismic",
) -> np.ndarray:
    """Normalize seismic amplitudes using the recorded field or few-shot policy."""
    arr = np.asarray(arr, dtype=np.float32)
    if mode == "mean_std_minmax":
        mean, std = float(arr.mean()), float(arr.std())
        arr = (arr - mean) / (std + 1e-8) if std > 1e-6 else np.zeros_like(arr)
        low, high = float(arr.min()), float(arr.max())
        return (arr - low) / (high - low + 1e-8) if high > low else np.zeros_like(arr)
    if mode != "seismic":
        raise ValueError(f"Unknown normalization mode: {mode}")
    if clip_sigma and clip_sigma > 0:
        mean = float(arr.mean())
        std = float(arr.std())
        if std > 1e-6:
            arr = np.clip(arr, mean - clip_sigma * std, mean + clip_sigma * std)
    if zscore:
        mean = float(arr.mean())
        std = float(arr.std())
        arr = (
            (arr - mean) / (std + 1e-6)
            if std > 1e-6
            else np.zeros_like(arr, dtype=np.float32)
        )
    if minmax_01:
        vmin = float(arr.min())
        vmax = float(arr.max())
        arr = (
            (arr - vmin) / (vmax - vmin + 1e-6)
            if vmax > vmin
            else np.zeros_like(arr, dtype=np.float32)
        )
    return arr.astype(np.float32)
