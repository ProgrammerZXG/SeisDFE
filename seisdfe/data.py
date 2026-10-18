"""Portable 2-D datasets with explicit splits and reproducible few-shot subsets."""

from pathlib import Path
import hashlib
import numpy as np
import torch
import torch.nn.functional as F
from .normalization import normalize_seismic


def read_array(path, key=None):
    """Read numeric NPY or one named NPZ array; pickle input is never enabled."""
    path = Path(path)
    if path.suffix == ".npz":
        with np.load(path, allow_pickle=False) as archive:
            if key is None or key not in archive:
                raise KeyError(f"{path}: expected key {key!r}; found {archive.files}")
            array = archive[key]
    elif path.suffix == ".npy":
        array = np.load(path, allow_pickle=False)
    else:
        raise ValueError(f"Expected .npy or .npz, got {path}")
    array = np.asarray(array)
    if array.ndim != 2 or not np.issubdtype(array.dtype, np.number):
        raise ValueError(
            f"{path}: expected numeric [depth, trace], got {array.shape}/{array.dtype}"
        )
    if min(array.shape) < 1 or not np.isfinite(array).all():
        raise ValueError(f"{path}: empty or non-finite array")
    return array


def file_sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class SectionDataset:
    """Each split holds paired `images/id.npy` and `labels/id.npy` files."""

    def __init__(self, root, split, config):
        self.root = Path(root)
        self.config = config
        self.split = split
        self.images = sorted((self.root / split / "images").glob("*.npy"))
        if not self.images:
            raise FileNotFoundError(
                f"No NPY images under {self.root / split / 'images'}"
            )
        self.labels = [self.root / split / "labels" / p.name for p in self.images]
        missing = [str(p) for p in self.labels if not p.is_file()]
        if missing:
            raise FileNotFoundError(f"Missing paired labels: {missing[:5]}")

    def __len__(self):
        return len(self.images)

    def sample(self, index, rng=None):
        image = read_array(self.images[index]).astype(np.float32)
        label = read_array(self.labels[index])
        if label.shape != image.shape:
            raise ValueError(f"Image/label shape mismatch: {self.images[index]}")
        task = self.config["task"]
        if task["type"] == "segmentation":
            label = label.astype(np.float64)
            valid = label != task.get("ignore_index", 255)
            label[valid] += self.config["data"].get("label_offset", 0)
            classes = max(2, task["num_classes"])
            if not np.equal(label[valid], np.floor(label[valid])).all() or np.any(
                (label[valid] < 0) | (label[valid] >= classes)
            ):
                raise ValueError(
                    "Segmentation labels must be integer class IDs in [0,C), or ignore_index"
                )
        elif task["type"] == "regression":
            label = label.astype(np.float32)
            if self.config["data"].get("normalize_target", False):
                low, high = label.min(), label.max()
                label = (
                    (label - low) / (high - low + 1e-8)
                    if high > low
                    else np.zeros_like(label)
                )
        else:
            raise ValueError("task.type must be segmentation or regression")
        image = normalize_seismic(image, **self.config.get("normalization", {}))
        image = torch.from_numpy(image.copy())[None]
        label = torch.from_numpy(label.copy()).float()[None]
        size = self.config["data"].get("image_size")
        if size:
            image = F.interpolate(
                image[None], size=size, mode="bilinear", align_corners=False
            )[0]
            if task["type"] == "segmentation":
                label = F.interpolate(label[None], size=size, mode="nearest")[0]
            else:
                label = F.interpolate(
                    label[None], size=size, mode="bilinear", align_corners=False
                )[0]
        # Disabled in strict linear probing; labels follow the same transform.
        if (
            rng is not None
            and self.config["data"].get("horizontal_flip", False)
            and rng.random() < 0.5
        ):
            image, label = image.flip(-1), label.flip(-1)
        if (
            rng is not None
            and self.config["data"].get("vertical_flip", False)
            and rng.random() < 0.5
        ):
            image, label = image.flip(-2), label.flip(-2)
        return image, label


def select_subset(dataset, shots, seed, ids_file=None):
    """Select once, save filenames, and never silently replace an oversized budget."""
    if ids_file:
        names = [
            line.strip()
            for line in Path(ids_file).read_text().splitlines()
            if line.strip()
        ]
        lookup = {p.name: i for i, p in enumerate(dataset.images)}
        if len(names) != len(set(names)) or any(n not in lookup for n in names):
            raise ValueError("Subset list contains duplicates or unknown filenames")
        indices = [lookup[n] for n in names]
        if shots != len(indices):
            raise ValueError("shots must equal the explicit subset list length")
    else:
        if not 1 <= shots <= len(dataset):
            raise ValueError(f"shots must be in [1,{len(dataset)}], got {shots}")
        indices = (
            np.random.default_rng(seed)
            .choice(len(dataset), shots, replace=False)
            .tolist()
        )
    return sorted(indices)


def dataset_manifest(train, val, indices):
    """Record file hashes and reject identical seismic sections across splits."""
    result = {}
    seen = set()
    for name, dataset, selected in (
        ("train", train, indices),
        ("val", val, range(len(val))),
    ):
        rows = []
        for i in selected:
            image, label = dataset.images[i], dataset.labels[i]
            digest = file_sha256(image)
            if name == "val" and digest in seen:
                raise ValueError(f"Train/validation leakage: identical image {image}")
            rows.append(
                {
                    "image": str(image.relative_to(dataset.root)),
                    "label": str(label.relative_to(dataset.root)),
                    "image_sha256": digest,
                    "label_sha256": file_sha256(label),
                }
            )
        if name == "train":
            seen = {row["image_sha256"] for row in rows}
        result[name] = rows
    return result
