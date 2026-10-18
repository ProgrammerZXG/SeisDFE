"""Convert an explicit CSV split manifest into portable paired NPY sections."""

import argparse
import csv
import json
from pathlib import Path
import numpy as np
from seisdfe.data import read_array, file_sha256


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--manifest",
        required=True,
        help="CSV columns: split,id,image,label; paths relative to CSV",
    )
    parser.add_argument("--output", required=True)
    parser.add_argument("--image-key", default="seis", help="For NPZ images")
    parser.add_argument(
        "--label-key", default="fault_label", help="For NPZ labels; use rgt for RGT"
    )
    parser.add_argument(
        "--shape",
        type=int,
        nargs=2,
        help="Required for raw DAT/BIN; stored row/column dimensions",
    )
    parser.add_argument(
        "--image-dtype", default="<f4", help="Explicit raw endian/type, e.g. <f4 or >f4"
    )
    parser.add_argument("--label-dtype", default="<f4")
    parser.add_argument(
        "--transpose",
        action="store_true",
        help="Transpose BOTH images and labels after loading",
    )
    parser.add_argument(
        "--label-offset",
        type=float,
        default=0.0,
        help="E.g. -1 to convert 1..C labels to 0..C-1",
    )
    args = parser.parse_args()
    manifest = Path(args.manifest).resolve()
    output = Path(args.output)
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(output)
    with manifest.open(newline="") as stream:
        rows = list(csv.DictReader(stream))
    if not rows or not {"split", "id", "image", "label"}.issubset(rows[0]):
        raise ValueError(
            "Manifest needs split,id,image,label columns and at least one row"
        )
    seen = set()
    for row in rows:
        if (
            row["split"] not in {"train", "val", "test"}
            or Path(row["id"]).name != row["id"]
            or row["id"] in {".", "..", ""}
        ):
            raise ValueError(f"Invalid split/id: {row}")
        identity = row["split"], row["id"]
        if identity in seen:
            raise ValueError(f"Duplicate sample: {identity}")
        seen.add(identity)

    def load(path, key, dtype):
        if path.suffix in {".dat", ".bin"}:
            if not args.shape or min(args.shape) < 1:
                raise ValueError("Raw files require a positive --shape H W")
            expected_bytes = int(np.prod(args.shape)) * np.dtype(dtype).itemsize
            if path.stat().st_size != expected_bytes:
                raise ValueError(f"{path}: byte size does not match --shape/--dtype")
            values = np.fromfile(path, dtype=np.dtype(dtype))
            if values.size != np.prod(args.shape):
                raise ValueError(f"{path}: raw element count does not match --shape")
            values = values.reshape(args.shape).astype(np.float32)
            if not np.isfinite(values).all():
                raise ValueError(f"Non-finite raw data: {path}")
            return values
        return read_array(path, key)

    records = []
    for row in rows:
        image_path = manifest.parent / row["image"]
        label_path = manifest.parent / row["label"]
        image = load(image_path, args.image_key, args.image_dtype).astype(np.float32)
        label = load(label_path, args.label_key, args.label_dtype).astype(np.float64)
        label[label != 255] += args.label_offset
        if args.transpose:
            image, label = image.T, label.T
        if image.shape != label.shape:
            raise ValueError(f"Mismatched image/label shape: {row['id']}")
        for folder, value in (("images", image), ("labels", label)):
            path = output / row["split"] / folder / (row["id"] + ".npy")
            path.parent.mkdir(parents=True, exist_ok=True)
            np.save(path, value)
        records.append(
            {
                "id": row["id"],
                "split": row["split"],
                "image_sha256": file_sha256(image_path),
                "label_sha256": file_sha256(label_path),
            }
        )
    (output / "conversion.json").write_text(
        json.dumps({"options": vars(args), "samples": records}, indent=2) + "\n"
    )
    print(f"Converted {len(records)} paired sections to {output}")


if __name__ == "__main__":
    main()
