# 数据目录与格式

[English](DATA.md) | **简体中文** · [返回首页](../README.zh-CN.md)

以下路径均相对于仓库根目录。应用默认配置不包含私人文件路径；数据需要自行准备，程序不会自动下载。

## 数组约定

| 用途 | 格式 | 形状 / 类型 | 含义 |
|---|---|---|---|
| 预训练 | 数值 `.npy` | H×W float32 | 无标签剖面，H 为时间/深度，W 为道 |
| 下游输入 | 数值 `.npy` | H×W float32 | 所有振幅必须是有限值 |
| 分割标签 | 数值 `.npy` | H×W 整数 | 类别为 0..C−1，255 表示忽略 |
| RGT 标签 | 数值 `.npy` | H×W 浮点数 | 相对时间，可选逐剖面 min–max 归一化 |
| 实际资料剖面 | 数值 `.npy` 或 `.npz` | H×W | NPZ 默认键为 `seis`，可用 `--input-key` 修改 |
| 预训练索引 | `.npy` Unicode 向量 | N 个字符串 | 相对于图像根目录的文件路径 |

应用加载器不接受额外的单通道维度、object 数组或 pickle 字典，也不会猜测轴顺序。
应先显式转换。NaN/Inf 或图像与标签形状不一致会报错。
三维工区数据需要先按明确的轴顺序提取二维剖面，保留剖面 ID，以便将推理结果重组为三维体。

## 文件布局

```text
data/pretrain/256/images/survey_a/000001.npy
data/pretrain/256/images/survey_b/000002.npy
data/pretrain/256/index/seismic-npy-entries.npy
data/pretrain/512/images/survey_a/000001.npy
data/pretrain/512/index/seismic-npy-entries.npy

data/downstream/fault/train/images/000001.npy
data/downstream/fault/train/labels/000001.npy
data/downstream/fault/val/images/000101.npy
data/downstream/fault/val/labels/000101.npy
```

`seisdfe-index` 按文件名排序，并将索引保存在样本目录之外。启动大规模训练前，建议使用
`--validate` 读取并检查全部预训练图像。请保留生成的索引，修改排序会改变训练样本顺序。
Stage 1 通常使用 256×256 剖面；Stage 2/3 使用 512×512 剖面，并在训练中裁剪。

## 转换 NPZ 或原始 DAT/BIN 数据对

先创建 `split.csv`。路径相对于 CSV 文件，不会根据数字 ID 自动推断：

```csv
split,id,image,label
train,sample_0001,original/sample_0001.npz,original/sample_0001.npz
val,sample_0101,original/sample_0101.npz,original/sample_0101.npz
```

```bash
# NPZ keys may be seis/fault_label, sx/fx, or seis/rgt; select explicitly.
seisdfe-convert --manifest split.csv --output data/downstream/fault \
  --image-key seis --label-key fault_label

# For raw 896×896 float32 files, CSV image/label columns point to their .dat files.
seisdfe-convert --manifest raw_split.csv --output data/downstream/fault_raw \
  --shape 896 896 --image-dtype '<f4' --label-dtype '<f4'
```

`<f4` 表示小端 float32；`>f4` 表示大端 float32。DAT 文件按 NumPy C 顺序重排。
仅在源数据格式需要时使用 `--transpose`，它会同时转置输入和标签。
`--label-offset -1` 将从 1 开始的类别编号转换为从 0 开始，并保留常用的 255 忽略标记。
不要在转换和训练时重复应用标签偏移。若源断层标签不是二值标签，请先按数据含义显式二值化。

转换工具记录源文件哈希和转换参数。训练/验证划分由 CSV 指定；工具不会自动生成划分、
插值标签或执行 pickle 数据。

## 划分与小样本预算

- 先将源工区/数据体分为训练、验证和测试，再提取切片或裁剪。同一数据体的相邻切片或不同版本不相互独立。
- 一个 shot 指 `train/images` 中一个带标签文件。全部验证文件参与验证和最佳检查点选择，其标签不计入训练 shots。
- 训练记录选中的文件名，以及所选训练数据对和全部验证数据对的 SHA256。训练与验证之间完全相同的图像文件会被拒绝，但字节级检查不能证明相邻切片的独立性。
- 复用论文特定子集时，设置 `train.subset_file=ids.txt`，文件中需要恰好 `train.shots` 个非空行。
- 地震相配置沿用原始 F3 探测实验的 256×704 模型输入，接受已经提取的二维数组，不直接读取原始三维二进制文件。

## 预处理

小样本配置使用原始 `mean_std_minmax` 归一化：逐剖面 z-score，再进行 min–max，
不执行 3σ 裁剪。图像使用双线性缩放，分割标签使用最近邻缩放。

导出的实际资料预测头保留其训练时的 3σ 裁剪 → z-score → [0,1] 映射。
断层推理逐图块归一化，RGT 推理逐水平窗口归一化；这些设置保存在预测头配置中。

预训练保留原始 `SeismicNPY` 流程：3σ 裁剪、z-score、min–max、8 位灰度转换，
再进行 DINO 数据增强。PCA 在 patch 填充前使用连续值归一化，不进行 8 位量化。
