"""Train a decoder with an optional LoRA adapter on a fixed few-shot subset."""

import argparse
from seisdfe.config import load_config
from seisdfe.training import train


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True)
    parser.add_argument("--device", default="cuda")
    parser.add_argument("--resume", help="Use last.pth from the same run, not best.pth")
    parser.add_argument(
        "overrides", nargs="*", help="Dotted KEY=VALUE configuration overrides"
    )
    args = parser.parse_args()
    train(load_config(args.config, args.overrides), args.device, args.resume)


if __name__ == "__main__":
    main()
