"""Strict DINOv3 backbone loading without implicit downloads or branch fallback."""

from pathlib import Path
import torch
from torch import nn
from omegaconf import OmegaConf
from dinov3.configs import get_default_config
from dinov3.models import build_model


def backbone_config(path):
    return OmegaConf.merge(get_default_config(), OmegaConf.load(path))


def select_backbone_state(checkpoint, branch="teacher"):
    """Extract exactly the requested branch from a consolidated checkpoint."""
    state = checkpoint
    for key in ("state_dict", "model"):
        if key in state and isinstance(state[key], dict):
            state = state[key]
            break
    if branch in state and isinstance(state[branch], dict):
        state = state[branch]
    elif any(k in state for k in ("teacher", "student")):
        raise ValueError(f"Checkpoint does not contain requested branch {branch!r}")
    state = {
        k.replace("._orig_mod.", ".").removeprefix("_orig_mod."): v
        for k, v in state.items()
    }
    for prefix in (f"{branch}.backbone.", "backbone.", ""):
        selected = {
            k[len(prefix) :]: v for k, v in state.items() if k.startswith(prefix)
        }
        if "patch_embed.proj.weight" in selected:
            return selected
    raise ValueError(f"No {branch} backbone found in checkpoint")


def load_backbone(config_file, checkpoint_path, device="cuda", branch="teacher"):
    """Load a .pth or DCP directory, requiring every backbone parameter/buffer."""
    path = Path(checkpoint_path)
    if not path.exists():
        raise FileNotFoundError(path)
    if branch not in {"teacher", "student"}:
        raise ValueError("branch must be teacher or student")
    cfg = backbone_config(config_file)
    # Meta construction avoids allocating a second complete 7B model.
    with torch.device("meta"):
        model, _ = build_model(cfg.student, only_teacher=True, device="meta")
    expected = set(model.state_dict())
    if path.is_dir():
        import torch.distributed.checkpoint as dcp

        keys = dcp.FileSystemReader(path).read_metadata().state_dict_metadata
        prefix = next(
            (
                p
                for p in (f"model.{branch}.backbone.", "model.backbone.")
                if p + "patch_embed.proj.weight" in keys
            ),
            None,
        )
        if prefix is None:
            raise ValueError(f"No {branch} backbone in DCP metadata: {path}")
        missing = [k for k in expected if prefix + k not in keys]
        if missing:
            raise ValueError(f"DCP backbone is incomplete: {missing[:8]}")
        model.to_empty(device=device)
        # Flat dictionary keys intentionally match DCP's fully qualified names.
        state = {prefix + k: v for k, v in model.state_dict().items()}
        dcp.load(state, checkpoint_id=path)
        model.load_state_dict({k: state[prefix + k] for k in expected}, strict=True)
    else:
        checkpoint = torch.load(path, map_location="cpu", weights_only=True, mmap=True)
        state = select_backbone_state(checkpoint, branch)
        # SSL projection heads are not part of the inference backbone.
        state = {
            k: v
            for k, v in state.items()
            if not k.startswith(("dino_head.", "ibot_head."))
        }
        model.load_state_dict(state, strict=True, assign=True)
        model.to(device)
    model.eval().requires_grad_(False)
    return model


class FeatureBackbone(nn.Module):
    """Retains `backbone.backbone.*` keys used by existing field checkpoints."""

    def __init__(self, backbone, layers, normalize=True, has_lora=False):
        super().__init__()
        self.backbone = backbone
        self.layers = tuple(int(i) for i in layers)
        if not self.layers or self.layers != tuple(sorted(set(self.layers))):
            raise ValueError(
                "layers must be nonempty, unique, ascending zero-based indices"
            )
        if self.layers[0] < 0 or self.layers[-1] >= len(backbone.blocks):
            raise ValueError("Feature layer is outside the backbone")
        self.normalize = bool(normalize)
        self.has_lora = has_lora

    def train(self, mode=True):
        super().train(mode)
        self.backbone.eval()
        if self.has_lora:
            from .lora import set_lora_train_mode

            set_lora_train_mode(self.backbone, mode)
        return self

    def forward(self, image):
        # LoRA requires gradients through the frozen operations after injection.
        with torch.set_grad_enabled(torch.is_grad_enabled() and self.has_lora):
            return list(
                self.backbone.get_intermediate_layers(
                    image,
                    n=self.layers,
                    reshape=True,
                    return_class_token=False,
                    norm=self.normalize,
                )
            )
