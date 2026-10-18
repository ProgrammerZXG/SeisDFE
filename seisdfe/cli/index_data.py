"""Write a deterministic DINOv3 SeismicNPY index outside the image directory."""

import argparse
import os
from pathlib import Path
import numpy as np
from seisdfe.data import read_array


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--root", required=True)
    p.add_argument("--output", required=True)
    p.add_argument(
        "--validate",
        action="store_true",
        help="Read every sample to validate shape and finite values",
    )
    args = p.parse_args()
    root = Path(args.root).resolve()
    output = Path(args.output).resolve()
    if output == root or root in output.parents:
        raise ValueError("Index directory must be outside the sample tree")
    paths = sorted(root.rglob("*.npy"))
    if not paths:
        raise FileNotFoundError(f"No NPY samples in {root}")
    if args.validate:
        for path in paths:
            read_array(path)
    names = [str(path.relative_to(root)) for path in paths]
    output.mkdir(parents=True, exist_ok=True)
    target = output / "seismic-npy-entries.npy"
    with (output / "entries.tmp").open("wb") as stream:
        np.save(stream, np.array(names))
    os.replace(output / "entries.tmp", target)
    print(f"Indexed {len(names)} sections: {target}")


if __name__ == "__main__":
    main()
