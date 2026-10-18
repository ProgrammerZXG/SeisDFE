# Copyright (c) Meta Platforms, Inc. and affiliates.
# Derived from the research implementation; see THIRD_PARTY_NOTICES.md.
import torch
from torch import nn
import torch.nn.functional as F


class MeanLinearHead(nn.Module):
    """Linear probe over the spatially aligned mean of equal-width feature maps."""

    def __init__(
        self,
        in_channels: list[int],
        n_output_channels: int,
        dropout: float = 0.1,
        use_batchnorm: bool = True,
    ):
        super().__init__()
        if not in_channels or len(set(in_channels)) != 1:
            raise ValueError(
                f"MeanLinearHead requires equal, non-empty feature dimensions, got {in_channels}"
            )
        self.in_channels = list(in_channels)
        self.channels = int(in_channels[0])
        self.batchnorm_layer = (
            nn.SyncBatchNorm(self.channels) if use_batchnorm else nn.Identity()
        )
        self.conv = nn.Conv2d(
            self.channels, int(n_output_channels), kernel_size=1, padding=0, stride=1
        )
        self.dropout = nn.Dropout2d(float(dropout))
        nn.init.normal_(self.conv.weight, mean=0.0, std=0.01)
        nn.init.constant_(self.conv.bias, 0.0)

    @staticmethod
    def _mean_features(inputs):
        features = list(inputs)
        if not features:
            raise ValueError("MeanLinearHead received no backbone features")
        for index, feature in enumerate(features):
            if feature.ndim == 2:
                feature = feature[:, :, None, None]
            features[index] = feature
        target_size = features[0].shape[2:]
        features = [
            F.interpolate(
                feature, size=target_size, mode="bilinear", align_corners=False
            )
            for feature in features
        ]
        return torch.stack(features, dim=0).mean(dim=0)

    def forward(self, inputs):
        x = self._mean_features(inputs)
        x = self.dropout(x)
        x = self.batchnorm_layer(x)
        return self.conv(x)


class MultiLayerConvHead(nn.Module):
    """A minimal spatial decoder: concatenate feature levels, then one 3x3 conv.

    This head deliberately has no normalization, bottleneck, or hidden decoder
    stages. It provides only a local 3x3 receptive field beyond the frozen
    multi-layer encoder features, making it suitable for controlled probes of
    thin structures such as faults.
    """

    def __init__(
        self, in_channels: list[int], n_output_channels: int, dropout: float = 0.0
    ):
        super().__init__()
        if not in_channels:
            raise ValueError("MultiLayerConvHead requires at least one feature level")
        self.in_channels = list(in_channels)
        self.dropout = nn.Dropout2d(float(dropout))
        self.conv = nn.Conv2d(
            sum(self.in_channels), int(n_output_channels), kernel_size=3, padding=1
        )
        nn.init.normal_(self.conv.weight, mean=0.0, std=0.01)
        nn.init.zeros_(self.conv.bias)

    def forward(self, inputs):
        features = list(inputs)
        target_size = features[0].shape[-2:]
        features = [
            F.interpolate(
                feature, size=target_size, mode="bilinear", align_corners=False
            )
            for feature in features
        ]
        return self.conv(self.dropout(torch.cat(features, dim=1)))


class ConvBNReLU(nn.Sequential):
    def __init__(self, in_ch: int, out_ch: int):
        super().__init__(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, stride=1, padding=1, bias=False),
            nn.SyncBatchNorm(out_ch),
            nn.ReLU(inplace=True),
        )


class PUPHead(nn.Module):
    """SETR-PUP style decoder for DINO features."""

    def __init__(
        self,
        in_channels: list[int],
        num_classes: int,
        hidden_dim: int = 512,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.in_channels = in_channels
        self.channels = int(sum(in_channels))

        hidden_dim = int(max(64, hidden_dim))
        mid_dim = int(max(32, hidden_dim // 2))

        self.proj = nn.Conv2d(
            self.channels, hidden_dim, kernel_size=1, stride=1, padding=0
        )
        self.block1 = nn.Sequential(
            ConvBNReLU(hidden_dim, hidden_dim), ConvBNReLU(hidden_dim, hidden_dim)
        )
        self.block2 = nn.Sequential(
            ConvBNReLU(hidden_dim, mid_dim), ConvBNReLU(mid_dim, mid_dim)
        )
        self.block3 = nn.Sequential(
            ConvBNReLU(mid_dim, mid_dim), ConvBNReLU(mid_dim, mid_dim)
        )
        self.dropout = nn.Dropout2d(float(dropout))
        self.classifier = nn.Conv2d(
            mid_dim, int(num_classes), kernel_size=1, stride=1, padding=0
        )

        nn.init.normal_(self.proj.weight, mean=0.0, std=0.01)
        nn.init.constant_(self.proj.bias, 0.0)
        nn.init.normal_(self.classifier.weight, mean=0.0, std=0.01)
        nn.init.constant_(self.classifier.bias, 0.0)

    def _transform_inputs(self, inputs):
        inputs = list(inputs)
        for i, x in enumerate(inputs):
            if len(x.shape) == 2:
                x = x[:, :, None, None]
            inputs[i] = x
        inputs = [
            F.interpolate(
                input=x, size=inputs[0].shape[2:], mode="bilinear", align_corners=False
            )
            for x in inputs
        ]
        return torch.cat(inputs, dim=1)

    def forward(self, inputs):
        x = self._transform_inputs(inputs)
        x = self.proj(x)
        x = self.block1(x)
        x = F.interpolate(x, scale_factor=2.0, mode="bilinear", align_corners=False)
        x = self.block2(x)
        x = F.interpolate(x, scale_factor=2.0, mode="bilinear", align_corners=False)
        x = self.block3(x)
        x = self.dropout(x)
        return self.classifier(x)


class MLAHead(nn.Module):
    """SETR-MLA decoder retained from the seismic research implementation."""

    def __init__(self, embedding_dim: int, num_classes: int):
        super().__init__()
        self.embedding_dim = int(embedding_dim)
        self.num_classes = int(num_classes)

        self.net1_in, self.net1_intmd, self.net1_out = self._define_agg_net()
        self.net2_in, self.net2_intmd, self.net2_out = self._define_agg_net()
        self.net3_in, self.net3_intmd, self.net3_out = self._define_agg_net()
        self.net4_in, self.net4_intmd, self.net4_out = self._define_agg_net()

        self.output_net = nn.Sequential(
            nn.Conv2d(
                self.embedding_dim, self.num_classes, kernel_size=1, stride=1, padding=0
            ),
        )

    def conv_block(self, in_channels: int, out_channels: int) -> nn.Sequential:
        return nn.Sequential(
            nn.Conv2d(int(in_channels), int(out_channels), 3, 1, padding=1),
            nn.BatchNorm2d(int(out_channels)),
            nn.ReLU(inplace=True),
            nn.Conv2d(int(out_channels), int(out_channels), 3, 1, padding=1),
            nn.BatchNorm2d(int(out_channels)),
            nn.ReLU(inplace=True),
        )

    def _define_agg_net(self) -> tuple[nn.Module, nn.Module, nn.Module]:
        model_in = nn.Sequential(
            self.conv_block(self.embedding_dim, self.embedding_dim // 2)
        )
        model_intmd = nn.Sequential(
            self.conv_block(self.embedding_dim // 2, self.embedding_dim // 2)
        )
        model_out = nn.Sequential(
            self.conv_block(self.embedding_dim // 2, self.embedding_dim // 2),
            self.conv_block(self.embedding_dim // 2, self.embedding_dim // 4),
            nn.Upsample(scale_factor=4, mode="bilinear", align_corners=False),
            self.conv_block(self.embedding_dim // 4, self.embedding_dim // 4),
        )
        return model_in, model_intmd, model_out

    def forward(self, inputs):
        features = list(inputs)
        if len(features) != 4:
            raise ValueError(
                f"MLA decoder requires exactly 4 feature levels, got {len(features)}"
            )
        x3, x6, x9, x12 = features

        x12_intmd_in = self.net1_in(x12)
        x12_out = self.net1_out(x12_intmd_in)

        x9_in = self.net2_in(x9)
        x9_intmd_in = x9_in + x12_intmd_in
        x9_intmd_out = self.net2_intmd(x9_intmd_in)
        x9_out = self.net2_out(x9_intmd_out)

        x6_in = self.net3_in(x6)
        x6_intmd_in = x6_in + x9_intmd_in
        x6_intmd_out = self.net3_intmd(x6_intmd_in)
        x6_out = self.net3_out(x6_intmd_out)

        x3_in = self.net4_in(x3)
        x3_intmd_in = x3_in + x6_intmd_in
        x3_intmd_out = self.net4_intmd(x3_intmd_in)
        x3_out = self.net4_out(x3_intmd_out)

        out = torch.cat((x12_out, x9_out, x6_out, x3_out), dim=1)
        return self.output_net(out)
