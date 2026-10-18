from __future__ import annotations

from collections.abc import Sequence

import loralib as lora
import torch
from torch import nn


LoRAModule = lora.Linear | lora.MergedLinear


def _copy_linear(base: nn.Linear, replacement: nn.Linear) -> nn.Linear:
    replacement = replacement.to(device=base.weight.device, dtype=base.weight.dtype)
    with torch.no_grad():
        replacement.weight.copy_(base.weight)
        if base.bias is not None and replacement.bias is not None:
            replacement.bias.copy_(base.bias)
    replacement.weight.requires_grad_(False)
    if replacement.bias is not None:
        replacement.bias.requires_grad_(False)
    return replacement


def _standard_lora_linear(
    base: nn.Linear,
    rank: int,
    alpha: float,
    dropout: float,
) -> lora.Linear:
    module = lora.Linear(
        base.in_features,
        base.out_features,
        r=rank,
        lora_alpha=int(alpha),
        lora_dropout=dropout,
        bias=base.bias is not None,
        # Keeping LoRA unmerged makes checkpoints encoder-free and lets the
        # frozen backbone remain in eval mode while LoRA dropout is trained.
        merge_weights=False,
    )
    return _copy_linear(base, module)


def _standard_qv_lora(
    base: nn.Linear,
    rank: int,
    alpha: float,
    dropout: float,
) -> lora.MergedLinear:
    if base.out_features != 3 * base.in_features:
        raise ValueError(
            "QKV LoRA expects a merged projection with out_features == 3 * in_features, "
            f"got {base.in_features} -> {base.out_features}"
        )
    module = lora.MergedLinear(
        base.in_features,
        base.out_features,
        r=rank,
        lora_alpha=int(alpha),
        lora_dropout=dropout,
        enable_lora=[True, False, True],
        bias=base.bias is not None,
        merge_weights=False,
    )
    module = _copy_linear(base, module)
    # DINOv3 optionally represents QKV with LinearKMaskedBias: Q/V biases are
    # learned while the K slice is multiplied by a persistent zero mask.  A
    # loralib MergedLinear has no bias-mask hook, so materialise the effective
    # masked bias once.  K LoRA is disabled above and every base parameter is
    # frozen, making this exactly equivalent to the source projection at LoRA
    # initialisation and throughout adapter training.
    bias_mask = getattr(base, "bias_mask", None)
    if module.bias is not None and bias_mask is not None:
        with torch.no_grad():
            module.bias.copy_(base.bias * bias_mask.to(base.bias.dtype))
    return module


def inject_lora(
    backbone: nn.Module,
    last_n_blocks: int = 8,
    rank: int = 8,
    alpha: float = 16.0,
    dropout: float = 0.05,
    targets: Sequence[str] = ("qkv", "proj"),
) -> tuple[int, list[str]]:
    """Inject the reference ``loralib`` implementation into final ViT blocks.

    The merged QKV projection receives LoRA on Q and V, matching the standard
    LoRA setup. All pretrained weights remain frozen and are not saved in the
    downstream checkpoint.
    """

    blocks = getattr(backbone, "blocks", None)
    if blocks is None:
        raise AttributeError("backbone has no .blocks; cannot inject LoRA")
    n_blocks = len(blocks)
    last_n_blocks = int(last_n_blocks)
    if not 1 <= last_n_blocks <= n_blocks:
        raise ValueError(
            f"last_n_blocks must be in [1, {n_blocks}], got {last_n_blocks}"
        )
    rank = int(rank)
    if rank <= 0:
        raise ValueError(f"LoRA rank must be positive, got {rank}")
    start = n_blocks - last_n_blocks
    replaced: list[str] = []
    for i in range(start, n_blocks):
        block = blocks[i]
        for name in targets:
            if name in ("qkv", "proj"):
                parent, parent_name = block.attn, "attn"
            elif name in ("w1", "w2", "w3"):
                parent, parent_name = block.mlp, "mlp"
            else:
                raise ValueError(
                    f"Unsupported LoRA target {name!r}; expected qkv/proj/w1/w2/w3"
                )
            base = getattr(parent, name, None)
            if base is None:
                raise AttributeError(
                    f"blocks[{i}].{parent_name} has no submodule {name!r}"
                )
            if isinstance(base, (lora.Linear, lora.MergedLinear)):
                continue
            if not isinstance(base, nn.Linear):
                raise TypeError(
                    f"blocks[{i}].{parent_name}.{name} must be nn.Linear, got {type(base).__name__}"
                )
            replacement = (
                _standard_qv_lora(base, rank, alpha, dropout)
                if name == "qkv"
                else _standard_lora_linear(base, rank, alpha, dropout)
            )
            setattr(parent, name, replacement)
            replaced.append(f"blocks.{i}.{parent_name}.{name}")
    return start, replaced


def set_lora_train_mode(module: nn.Module, mode: bool) -> None:
    """Toggle LoRA dropout without putting the frozen backbone in train mode."""

    for child in module.modules():
        if isinstance(child, (lora.Linear, lora.MergedLinear)):
            child.train(mode)


def is_lora_parameter(name: str) -> bool:
    return ".lora_A" in name or ".lora_B" in name
