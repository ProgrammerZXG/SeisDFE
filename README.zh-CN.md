# SeisDFE

[English](README.md) | **简体中文**

**用于密集特征提取的地震基础模型。**
[数据格式](docs/DATA.zh-CN.md) · [模型权重](docs/CHECKPOINTS.zh-CN.md) · [复现说明](docs/REPRODUCIBILITY.zh-CN.md)

**Zhixiang Guo**<sup>1,2,3</sup> · **Xinming Wu**<sup>1,2,3,*</sup> · **Yimin Dou**<sup>1,2,3</sup> · **Hui Gao**<sup>4</sup><br>
**Siyao Zhao**<sup>1,2,3</sup> · **He Huang**<sup>1,2,3</sup> · **Wei Liu**<sup>1,2,3</sup>

包含三阶段预训练、特征 PCA 可视化、小样本训练，以及断层与 RGT 推理。
应用层统一命名为 `seisdfe`，必要的 DINOv3 核心实现保留 `dinov3` 原名。

- 预训练：DINO/iBOT/KoLeo → Gram 特征锚定 → 多分辨率适配。
- 下游任务：地震相、盐体、断层、RGT；支持固定样本数量和明确的训练子集。
- Decoder：Linear、3×3 Conv、PUP、MLA、DPT；编码器可冻结或启用 LoRA。
- 现成推理头：断层 DPT；RGT DPT + 编码器后 30 层 LoRA。

**数据和编码器权重不随代码分发。** 断层/RGT 推理头已单独导出，适合作为
GitHub Release 附件；公开下载链接尚未设置。文件名、校验值及状态见
[模型权重说明](docs/CHECKPOINTS.zh-CN.md)。

## 安装

验证环境：Linux、Python 3.11、PyTorch 2.5.0、torchvision 0.20.0、CUDA 12.4。
预训练需要 NVIDIA GPU；CPU 测试使用小型 DINOv3 模型。

```bash
git clone https://github.com/ProgrammerZXG/SeisDFE.git
cd SeisDFE
python -m venv .venv
source .venv/bin/activate
pip install torch==2.5.0 torchvision==0.20.0 --index-url https://download.pytorch.org/whl/cu124
pip install -e .
```

也可使用 [environment.yml](environment.yml)。以下命令均在仓库根目录执行；
配置中的相对路径以当前工作目录为基准。程序不会自动下载权重。

## 数据目录与格式

二维数组统一为 **[深度/时间, 道]**。地震数据使用有限值 `float32`；
分割标签使用 `0..C-1` 的整数类别，255 表示忽略；RGT 使用浮点数。
每个标签与对应输入具有相同文件名、形状及方向。

```text
data/
├── pretrain/
│   ├── 256/
│   │   ├── images/<survey>/<section>.npy       # [256,256]
│   │   └── index/seismic-npy-entries.npy       # generated index
│   └── 512/
│       ├── images/<survey>/<section>.npy       # [512,512]
│       └── index/seismic-npy-entries.npy
└── downstream/<task>/                         # salt / facies / fault / rgt
    ├── train/images/<id>.npy
    ├── train/labels/<id>.npy
    ├── val/images/<id>.npy
    └── val/labels/<id>.npy
```

先按源体或工区划分训练/验证，再生成切片和裁剪，避免相邻切片泄漏。
`shots` 只计算训练剖面，验证集标签是额外监督。NPZ、原始 DAT/BIN 转换方法见
[数据格式说明](docs/DATA.zh-CN.md)。

## 三阶段预训练

将原始 DINOv3-7B 初始化权重放在 `checkpoints/dinov3_vit7b16.pth`。
配置保留原实验的 100k、10k、30k 步训练计划；GPU 数量会影响有效批量和学习率缩放。

```bash
seisdfe-index --root data/pretrain/256/images --output data/pretrain/256/index --validate
seisdfe-index --root data/pretrain/512/images --output data/pretrain/512/index --validate

# Choose the GPU count appropriate for your hardware; run stages in order.
torchrun --standalone --nproc_per_node=8 -m seisdfe.cli.pretrain \
  --config configs/pretrain/stage1.yaml --output outputs/stage1
torchrun --standalone --nproc_per_node=8 -m seisdfe.cli.pretrain \
  --config configs/pretrain/stage2.yaml --output outputs/stage2
torchrun --standalone --nproc_per_node=8 -m seisdfe.cli.pretrain \
  --config configs/pretrain/stage3.yaml --output outputs/stage3
```

Stage 1 将 RGB patch embedding 沿通道求均值，适配单通道输入。
Stage 2/3 分别加载上一阶段的最终 EMA teacher；Stage 3 使用 256/384/512 全局裁剪。
续训同一次实验时添加 `--resume`；检查路径时可使用 `--dry-run`。
支持 `train.batch_size_per_gpu=2` 等配置覆盖。

下游可以直接使用 Stage-3 DCP 目录 `outputs/stage3/ckpt/29999`，也可使用合并后的 `.pth`。

## 小样本训练

```bash
seisdfe-train --config configs/downstream/salt_fewshot.yaml \
  encoder.weights=checkpoints/seisdfe_stage3.pth \
  data.root=data/downstream/salt train.shots=5 train.seed=3407 \
  train.output=outputs/salt_5shot

# Example: DPT with LoRA for 2 annotated fault sections.
seisdfe-train --config configs/downstream/fault_fewshot.yaml \
  decoder.type=dpt lora.enabled=true lora.last_n_blocks=8 \
  lora.rank=8 lora.alpha=16 train.shots=2 train.output=outputs/fault_2shot_lora
```

`decoder.type` 可选 `linear/conv/pup/mla/dpt`。MLA/DPT 需要四层特征。
RGT 默认仅用最后一层；切换 DPT 时同时设置
`encoder.layers=[9,19,29,39] decoder.n_bins=256`。
严格仿射线性探测设置：
`decoder.type=linear decoder.use_batchnorm=false decoder.dropout=0 lora.enabled=false`。
盐体/地震相默认保留原实验的多层均值融合和 BatchNorm。

输出包括完整配置、实际样本名、数据 SHA256、环境版本、训练指标、最佳预测头和续训检查点。
`best.pth` 按验证损失选择；`last.pth` 包含优化器与 RNG 状态。
续训时使用原命令及相同覆盖参数，并添加 `--resume outputs/salt_5shot/last.pth`。
固定样本列表使用 `train.subset_file=ids.txt`，每行一个文件名，行数等于 `train.shots`。

这套便携配置保留主要结构、归一化和损失选择；原论文部分数据划分、增强与采样策略没有
自动重建，不能直接将重新训练结果称为论文指标复现，详见[复现说明](docs/REPRODUCIBILITY.zh-CN.md)。

## 推理

预测头内包含结构及预处理配置；仍需提供对应的 Stage-3 编码器权重。
输入支持单个数字 NPY/NPZ 剖面，或包含 NPY 剖面的目录。

```bash
# Existing trained fault head: overlapping tiles, maximum probability fusion.
seisdfe-infer --checkpoint checkpoints/fault_dpt.pth \
  --encoder-config configs/encoder/vit7b.yaml --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --output outputs/field_fault

# Existing trained RGT head: full-depth lateral windows with cosine blending.
seisdfe-infer --checkpoint checkpoints/rgt_dpt_lora.pth \
  --encoder-config configs/encoder/vit7b.yaml --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --output outputs/field_rgt

# A newly trained few-shot head.
seisdfe-infer --checkpoint outputs/salt_5shot/best.pth \
  --encoder-config configs/encoder/vit7b.yaml --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/downstream/salt/val/images --output outputs/salt_predictions
```

结果保持输入 H×W 尺寸：二分类输出概率及标签；多分类输出 C×H×W 概率及 H×W 标签；
RGT 输出连续数组。现成 RGT 分箱头输出范围为 [0,1]，线性回归头不限制范围。
RGT 表示相对地质年代，不能直接解释为绝对年龄。

可选 `--mode native|resize|fault-tiles|rgt-lateral`、`--window 512 --overlap 256`。
CPU 使用 `--device cpu --precision fp32`。7B 编码器和 MLA 的内存开销较大，
请按输入大小、Decoder 与设备实际容量选择配置。

## PCA 可视化

```bash
seisdfe-pca --encoder-config configs/encoder/vit7b.yaml \
  --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --layers 9 19 29 39 --output outputs/pca
```

层号从 **0** 开始。输出原图、PCA RGB、叠加图、PCA 基底及元数据。
不同图片独立拟合的颜色不能直接比较；对比剖面时，可对单层添加
`--basis .../layer_39_basis.npz` 复用相同基底。PCA 颜色不是类别标签。

## 代码结构与检查

```text
seisdfe/             # application: data, models, training, inference, PCA, CLI
dinov3/              # required original core, names retained
configs/pretrain/    # three recorded stage configurations
configs/downstream/  # portable few-shot task configurations
configs/encoder/     # 7B architecture
licenses/            # DINOv3 license
tests/               # CPU behavior tests and CUDA three-stage smoke test
```

```bash
CUDA_VISIBLE_DEVICES="" python -m unittest discover -s tests -v
CUDA_VISIBLE_DEVICES=0 python tests/pretrain_smoke.py
```

[MIT 许可证](LICENSE)适用于原创应用代码；DINOv3 及其衍生实现保留
[原许可与署名](THIRD_PARTY_NOTICES.md)。

研究问题请联系通讯作者 [Xinming Wu](mailto:xinmwu@ustc.edu.cn)。
论文图件与第三方数据集保留各自适用的权利与来源条款。
