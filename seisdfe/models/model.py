"""SeisDFE downstream models; original decoder tensor names are retained."""

import torch.nn.functional as F
from torch import nn
from .backbone import FeatureBackbone, load_backbone
from .decoders import MeanLinearHead, MultiLayerConvHead, PUPHead, MLAHead
from .linear_head import LinearHead
from .dpt_head import DPTHead
from .regression import FeaturesToDepth
from .lora import inject_lora, is_lora_parameter


class SeisDFE(nn.Module):
    """A frozen/LoRA DINOv3 encoder and one configurable dense prediction head."""

    def __init__(self, backbone, config):
        super().__init__()
        self.config = config
        backbone.requires_grad_(False)
        lora = config.get("lora", {})
        enabled = lora.get("enabled", False)
        if enabled:
            inject_lora(
                backbone,
                last_n_blocks=lora.get("last_n_blocks", 8),
                rank=lora.get("rank", 8),
                alpha=lora.get("alpha", 16),
                dropout=lora.get("dropout", 0.05),
                targets=lora.get("targets", ["qkv", "proj"]),
            )
        for name, parameter in backbone.named_parameters():
            parameter.requires_grad_(enabled and is_lora_parameter(name))
        enc = config["encoder"]
        self.backbone = FeatureBackbone(
            backbone, enc["layers"], enc.get("normalize", True), enabled
        )
        self.input_stem = nn.Identity()
        self.patch_size = int(backbone.patch_size)
        self.input_channels = backbone.patch_embed.proj.in_channels
        dec = config["decoder"]
        self.decoder_type = dec["type"]
        channels = [backbone.embed_dim] * len(enc["layers"])
        outputs = config["task"]["num_classes"]
        dropout = dec.get("dropout", 0.0)
        self.features_to_value = None
        if self.decoder_type == "linear":
            fusion = dec.get("fusion", "concat")
            if fusion not in {"mean", "concat"}:
                raise ValueError("linear fusion must be mean or concat")
            cls = MeanLinearHead if fusion == "mean" else LinearHead
            self.head = cls(
                channels,
                outputs,
                dropout=dropout,
                use_batchnorm=dec.get("use_batchnorm", False),
            )
        elif self.decoder_type == "conv":
            self.head = MultiLayerConvHead(channels, outputs, dropout)
        elif self.decoder_type == "pup":
            self.head = PUPHead(channels, outputs, dec.get("hidden_dim", 256), dropout)
        elif self.decoder_type == "mla":
            if len(channels) != 4:
                raise ValueError("MLA needs four feature layers")
            self.head = MLAHead(channels[0], outputs)
        elif self.decoder_type == "dpt":
            if len(channels) != 4:
                raise ValueError("DPT needs four feature layers")
            bins = dec.get("n_bins", 0)
            if bins and config["task"]["type"] != "regression":
                raise ValueError("n_bins is only valid for regression")
            self.head = DPTHead(
                in_channels=channels,
                channels=dec.get("hidden_dim", 256),
                post_process_channels=dec.get(
                    "post_process_channels", [128, 256, 512, 1024]
                ),
                readout_type="ignore",
                n_output_channels=bins or outputs,
                use_batchnorm=dec.get("use_batchnorm", True),
            )
            if bins:
                self.features_to_value = FeaturesToDepth(
                    min_depth=dec.get("min_value", 0.0),
                    max_depth=dec.get("max_value", 1.0),
                    bins_strategy="linear",
                    norm_strategy=dec.get("norm_strategy", "linear"),
                )
        else:
            raise ValueError(f"Unknown decoder: {self.decoder_type}")

    def forward(self, image):
        height, width = image.shape[-2:]
        multiple = 32 if self.decoder_type == "dpt" else self.patch_size
        pad_h, pad_w = (-height) % multiple, (-width) % multiple
        # Reflect matches the existing DPT path; replicate handles tiny inputs.
        mode = "reflect" if height > pad_h and width > pad_w else "replicate"
        image = F.pad(image, (0, pad_w, 0, pad_h), mode=mode)
        if image.shape[1] != self.input_channels:
            if image.shape[1] == 1 and self.input_channels == 3:
                image = image.repeat(1, 3, 1, 1)
            else:
                raise ValueError("Input channel count does not match encoder")
        features = self.backbone(image)
        if self.decoder_type == "dpt":
            features = [(f, f.new_zeros((f.shape[0], f.shape[1]))) for f in features]
        logits = self.head(features)
        if logits.shape[-2:] != image.shape[-2:]:
            logits = F.interpolate(
                logits, size=image.shape[-2:], mode="bilinear", align_corners=False
            )
        logits = logits[..., :height, :width]
        return (
            self.features_to_value(logits)
            if self.features_to_value is not None
            else logits
        )

    def adapter_state_dict(self):
        """Save the decoder, all its buffers, and LoRA, excluding base weights."""
        return {
            k: v
            for k, v in self.state_dict().items()
            if not k.startswith("backbone.") or is_lora_parameter(k)
        }

    def load_adapter(self, state):
        """Reject missing/unexpected adapter tensors instead of silently skipping them."""
        expected = set(self.adapter_state_dict())
        if set(state) != expected:
            raise ValueError(
                f"Adapter mismatch: missing={sorted(expected - set(state))[:8]}, "
                f"unexpected={sorted(set(state) - expected)[:8]}"
            )
        self.load_state_dict(state, strict=False)


def build_model(config, device="cuda", backbone=None):
    enc = config["encoder"]
    if backbone is None:
        backbone = load_backbone(
            enc["config"], enc["weights"], device, enc.get("branch", "teacher")
        )
    return SeisDFE(backbone, config).to(device)
