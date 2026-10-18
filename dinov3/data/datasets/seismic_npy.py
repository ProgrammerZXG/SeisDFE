# Copyright (c) Meta Platforms, Inc. and affiliates.
#
# This software may be used and distributed in accordance with
# the terms of the DINOv3 License Agreement.

import logging
import os
from argparse import ArgumentParser
import time
from typing import Callable, Optional

import numpy as np
from PIL import Image
from torchvision.datasets import VisionDataset

logger = logging.getLogger("dinov3")


class SeismicNPY(VisionDataset):
    def __init__(
        self,
        *,
        root: str,
        extra: str = "",
        transforms: Optional[Callable] = None,
        transform: Optional[Callable] = None,
        target_transform: Optional[Callable] = None,
    ) -> None:
        super().__init__(
            root=root,
            transforms=transforms,
            transform=transform,
            target_transform=target_transform,
        )
        self._extra_root = extra if extra else root
        self._entries = None

    @property
    def _entries_path(self) -> str:
        return "seismic-npy-entries.npy"

    def _get_extra_full_path(self, extra_path: str) -> str:
        return os.path.join(self._extra_root, extra_path)

    def _save_extra(self, extra_array: np.ndarray, extra_path: str) -> None:
        extra_full_path = self._get_extra_full_path(extra_path)
        os.makedirs(self._extra_root, exist_ok=True)
        np.save(extra_full_path, extra_array)

    def _load_extra(self, extra_path: str) -> np.ndarray:
        extra_full_path = self._get_extra_full_path(extra_path)
        return np.load(extra_full_path, mmap_mode="r")

    def _dump_entries(self) -> None:
        logger.info(f'building SeismicNPY metadata from "{self.root}"')
        entries = []
        max_len = 1

        for dirpath, dirnames, filenames in os.walk(self.root):
            dirnames.sort()
            filenames.sort()
            for filename in filenames:
                if not filename.endswith(".npy"):
                    continue
                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, self.root)
                entries.append(rel_path)
                max_len = max(max_len, len(rel_path))

        if len(entries) == 0:
            raise RuntimeError(f'no .npy files found under "{self.root}"')

        entries_array = np.array(sorted(entries), dtype=f"U{max_len}")
        logger.info(f"found {len(entries_array):,d} seismic samples")
        self._save_extra(entries_array, self._entries_path)

    def _get_entries(self) -> np.ndarray:
        if self._entries is None:
            entries_full_path = self._get_extra_full_path(self._entries_path)
            if not os.path.isfile(entries_full_path):
                os.makedirs(self._extra_root, exist_ok=True)
                lock_path = entries_full_path + ".lock"
                lock_acquired = False
                try:
                    fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
                    os.close(fd)
                    lock_acquired = True
                    logger.info("metadata lock acquired, building seismic index...")
                    self._dump_entries()
                except FileExistsError:
                    logger.info("waiting for another process to finish seismic index generation...")
                    wait_seconds = 0
                    while not os.path.isfile(entries_full_path):
                        time.sleep(2)
                        wait_seconds += 2
                        if wait_seconds % 30 == 0:
                            logger.info(f"still waiting for seismic index... {wait_seconds}s")
                finally:
                    if lock_acquired and os.path.exists(lock_path):
                        os.remove(lock_path)
            self._entries = self._load_extra(self._entries_path)
        return self._entries

    @staticmethod
    def _to_2d_float32(sample: np.ndarray) -> np.ndarray:
        sample = np.asarray(sample, dtype=np.float32)
        if sample.ndim == 2:
            return sample
        if sample.ndim == 3:
            if sample.shape[0] == 1:
                return sample[0]
            if sample.shape[-1] == 1:
                return sample[..., 0]
            return sample.mean(axis=-1)
        raise ValueError(f"Unsupported seismic sample shape: {sample.shape}")

    @staticmethod
    def _preprocess(sample: np.ndarray) -> np.ndarray:
        x = SeismicNPY._to_2d_float32(sample)

        finite_mask = np.isfinite(x)
        if not finite_mask.any():
            return np.zeros_like(x, dtype=np.float32)

        mean = float(x[finite_mask].mean())
        std = float(x[finite_mask].std())
        if std > 1e-6:
            lower = mean - 3.0 * std
            upper = mean + 3.0 * std
            x = np.clip(x, lower, upper)

        finite_mask = np.isfinite(x)
        mean = float(x[finite_mask].mean())
        std = float(x[finite_mask].std())
        if std > 1e-6:
            x = (x - mean) / std
        else:
            x = x - mean

        finite_mask = np.isfinite(x)
        vmin = float(x[finite_mask].min())
        vmax = float(x[finite_mask].max())
        if vmax > vmin:
            x = (x - vmin) / (vmax - vmin)
        else:
            x = np.zeros_like(x, dtype=np.float32)

        x = np.nan_to_num(x, nan=0.0, posinf=1.0, neginf=0.0)
        return np.clip(x, 0.0, 1.0).astype(np.float32)

    def __getitem__(self, index):
        entries = self._get_entries()
        rel_path = str(entries[index])
        full_path = os.path.join(self.root, rel_path)

        sample = np.load(full_path)
        sample = self._preprocess(sample)
        image = Image.fromarray((sample * 255.0).astype(np.uint8), mode="L")

        target = 0
        if self.transforms is not None:
            image, target = self.transforms(image, target)

        return image, target

    def __len__(self) -> int:
        return len(self._get_entries())

    @staticmethod
    def _normalize_for_display(sample: np.ndarray) -> np.ndarray:
        x = SeismicNPY._to_2d_float32(sample)
        finite_mask = np.isfinite(x)
        if not finite_mask.any():
            return np.zeros_like(x, dtype=np.float32)

        vmin = float(x[finite_mask].min())
        vmax = float(x[finite_mask].max())
        if vmax > vmin:
            x = (x - vmin) / (vmax - vmin)
        else:
            x = np.zeros_like(x, dtype=np.float32)

        x = np.nan_to_num(x, nan=0.0, posinf=1.0, neginf=0.0)
        return np.clip(x, 0.0, 1.0).astype(np.float32)

    @staticmethod
    def visualize_sample(
        sample_path: str,
        output_path: Optional[str] = None,
        panel_title_height: int = 28,
    ) -> str:
        sample = np.load(sample_path)
        raw_norm = SeismicNPY._normalize_for_display(sample)
        proc_norm = SeismicNPY._preprocess(sample)

        raw_img = Image.fromarray((raw_norm * 255.0).astype(np.uint8), mode="L").convert("RGB")
        proc_img = Image.fromarray((proc_norm * 255.0).astype(np.uint8), mode="L").convert("RGB")

        width = raw_img.width + proc_img.width
        height = raw_img.height + panel_title_height
        canvas = Image.new("RGB", (width, height), color=(18, 18, 18))
        canvas.paste(raw_img, (0, panel_title_height))
        canvas.paste(proc_img, (raw_img.width, panel_title_height))

        try:
            from PIL import ImageDraw

            draw = ImageDraw.Draw(canvas)
            draw.text((12, 7), "Raw (min-max for display)", fill=(230, 230, 230))
            draw.text((raw_img.width + 12, 7), "Processed (3sigma + zscore + min-max)", fill=(230, 230, 230))
        except Exception:
            # If drawing fails (e.g. missing font resources), keep the image panels only.
            pass

        if output_path is None:
            base = os.path.splitext(os.path.basename(sample_path))[0]
            output_path = os.path.join(os.getcwd(), f"{base}_seismic_preview.png")

        canvas.save(output_path)
        return output_path


def _build_arg_parser() -> ArgumentParser:
    parser = ArgumentParser(description="Visualize a seismic .npy sample before/after preprocessing")
    parser.add_argument("--sample", required=True, help="Path to a single .npy sample")
    parser.add_argument(
        "--output",
        default="",
        help="Output image path (.png). Defaults to <sample>_seismic_preview.png in current directory.",
    )
    return parser


if __name__ == "__main__":
    args = _build_arg_parser().parse_args()
    out = SeismicNPY.visualize_sample(sample_path=args.sample, output_path=args.output or None)
    print(f"saved preview image to: {out}")
