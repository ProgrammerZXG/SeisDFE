# 模型权重

[English](CHECKPOINTS.md) | **简体中文** · [返回首页](../README.zh-CN.md)

## 可用状态

| 文件 | 用途 | 状态 |
|---|---|---|
| `dinov3_vit7b16.pth` | Stage 1 使用的原始 RGB DINOv3 初始化 | 按 DINOv3 作者的条款获取 |
| `seisdfe_stage3.pth` 或 Stage-3 DCP 目录 | 地震 EMA teacher 编码器 | 作者侧已有，公开链接待提供 |
| `fault_dpt.pth` | 冻结 Stage-3 + DPT 断层头，输出一个 logit | 已导出，127,067,802 字节，公开链接待提供 |
| `rgt_dpt_lora.pth` | Stage-3 + DPT，256 个 RGT 分箱及 LoRA | 已导出，221,513,082 字节，公开链接待提供 |

将权重放入 `checkpoints/`。Git 仓库不包含权重。公开发布时，将预测头上传至 GitHub Releases
或模型托管服务，再填写 [checkpoints.json](checkpoints.json) 的 `download_url`。
尚未提供的下载链接保持为空。

两个导出的预测头已保存在作者本地交付目录的 `checkpoints/` 中，不包含约 6.7B 参数的编码器。
预测头内嵌推理配置，包括特征层和归一化设置。

## 精确模型配置

| 设置 | 断层 | RGT |
|---|---|---|
| 编码器 | Stage-3 EMA teacher，ViT-7B/16，单通道 | 相同 |
| 特征层（从 0 开始） | 9、19、29、39，归一化特征 | 相同 |
| Decoder | DPT，宽度 256 | DPT，宽度 256，在 [0,1] 内设置 256 个线性分箱 |
| 后处理通道 | 128、256、512、1024 | 相同 |
| LoRA | 关闭 | 最后 30 层，r=32，α=64，dropout=0.05 |
| LoRA 目标 | — | 合并 QKV 中的 Q/V，以及输出投影 |
| 归一化 | 3σ 裁剪、z-score、min–max | 相同 |
| 默认推理 | 512 像素图块，重叠 256，概率取最大值 | 水平窗口 512，重叠 256，余弦加权融合 |

断层头来自记录中的 Stage-3 冻结 DPT 200k 步实验；RGT 头来自 Stage-3 最后 30 层 LoRA
200k 步实验。两者均导出原始 `model_best.pth` 的选定张量，移除了优化器、调度器状态和私人路径。
它们来自原有的较大数据量训练方案，不属于新训练的小样本预测头。

## 文件完整性

```text
3f7df1cd326bbac0db088b15c8f3501b45616501577232ebffcddf9cbb439c78  fault_dpt.pth
cef9c8a2eb519c8e5da3d9d76bb8d217216c4e9bbaf46657eee26928494769be  rgt_dpt_lora.pth
```

```bash
sha256sum checkpoints/fault_dpt.pth checkpoints/rgt_dpt_lora.pth
# macOS equivalent: shasum -a 256 checkpoints/*.pth
```

每个适配器文件包含 `format`、`model`、`config`。推理时严格检查预测头/LoRA 张量的键和形状，
并加载指定的编码器分支，不会自动回退到 student。请使用对应的 EMA teacher 和结构配置。
替换为其他编码器时，即使张量形状兼容且可以加载，也可能改变预测结果。

## 导出已有研究预测头

```bash
seisdfe-export-head --input /path/to/original/model_best.pth \
  --output checkpoints/fault_dpt.pth
```

导出器支持上述两种 `dinov3_dpt` 实际资料模型结构。全编码器微调、prompt/坐标/高分辨率扩展、
意外包含的基础权重会被拒绝；它不会猜测其他历史检查点的转换方式。
新训练的小样本 `best.pth` 已经采用发布格式。

## 许可

原始及衍生 DINOv3 权重继续适用相应的 DINOv3 模型条款，仓库的 MIT 许可证不替代这些条款。
参见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。
