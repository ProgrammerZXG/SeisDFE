"""Deterministic feature PCA, with reusable bases for comparable RGB panels."""

import numpy as np


def fit_pca(features, components=3):
    values = np.asarray(features, dtype=np.float64)
    if (
        values.ndim != 2
        or not np.isfinite(values).all()
        or min(values.shape) < components
    ):
        raise ValueError("PCA needs finite [tokens, channels] with enough rows/columns")
    mean = values.mean(0)
    _, singular, basis = np.linalg.svd(values - mean, full_matrices=False)
    basis = basis[:components]
    # Fix SVD sign ambiguity by making each largest-magnitude loading positive.
    signs = np.sign(basis[np.arange(components), np.abs(basis).argmax(1)])
    signs[signs == 0] = 1
    basis *= signs[:, None]
    scores = (values - mean) @ basis.T
    low = np.percentile(scores, 1, axis=0)
    high = np.percentile(scores, 99, axis=0)
    return {
        "mean": mean,
        "basis": basis,
        "low": low,
        "high": high,
        "singular_values": singular[:components],
    }


def apply_pca(features, state):
    scores = (np.asarray(features, dtype=np.float64) - state["mean"]) @ state["basis"].T
    return np.clip(
        (scores - state["low"]) / np.maximum(state["high"] - state["low"], 1e-12), 0, 1
    ).astype(np.float32)
