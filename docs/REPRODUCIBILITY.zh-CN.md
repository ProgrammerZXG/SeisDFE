# 可复现性与迁移记录

[English](REPRODUCIBILITY.md) | **简体中文** · [返回首页](../README.zh-CN.md)

验证日期：2026-10-18。本版本整理可运行实现并记录验证范围；短时验证不能代表论文指标复现。

## 保留的实现

- DINOv3 Transformer/层、损失、EMA、FSDP、掩码、多裁剪增强和三阶段训练保留在 `dinov3/`。
  未迁移无关基准、其他基础模型、Notebook、私人数据集和实验输出。
- 阶段配置来自原始 100k/10k/30k 实验的完整配置；数据、输出及初始化路径替换为可移植路径。
  Stage 3 原始学习率设置（批量缩放前 `peak=0`、`end=1.25e-5`）及其递增行为均有意保留。
- 必要的核心维护包括：确定性的 NPY 索引排序及目录创建、PyTorch 2.5 FSDP 导入兼容、
  正确的程序化参数解析，以及共享输出目录的安全分布式启动。
- DPT、SETR-PUP/MLA、Linear/Conv 头和 LoRA 张量命名与选定源模型保持兼容。
  应用入口统一为 `seisdfe-*`。
- [source_manifest.json](source_manifest.json) 记录原始源文件哈希和提取的符号。
  服务器快照没有 Git 元数据，因此无法推断精确的上游提交。

## 小样本协议

便携配置保留 Adam、恒定学习率、Decoder、特征层、输入尺寸，以及主要损失与归一化设置：

| 任务 | 默认 shots / 更新步数 | Decoder | 损失 |
|---|---|---|---|
| 盐体 | 5 / 2000 | 多层均值融合 Linear + BatchNorm | 原始加权 Dice |
| F3 风格地震相 | 2 / 2000 | 多层均值融合 Linear + BatchNorm | 原始加权 Dice |
| 断层 | 5 / 1000 | 拼接四层特征的 3×3 Conv | Dice |
| RGT | 5 / 1000 | 最后一层仿射 Linear | MSE |

与完整论文实验存在以下明确差异：

- 输入为已划分的数值 NPY 数据对。原始私人三维数据、划分清单及确切标注 ID 不随代码发布。
  可通过 `train.subset_file` 指定固定子集。
- 默认按种子随机选样，不根据文件名推断原始 F3 等间距/抖动选样协议；复用该协议需提供原始 ID 列表。
- 本训练器提供几何翻转，不启用原始 RGT 地球物理噪声、合成波形重生成及局部退化流程。
- 每步通过以 `(seed, optimizer step)` 为键的生成器从选定子集确定性采样。
  续训不依赖 worker 调度，但其批次序列与原始 DataLoader shuffle 不同。
- LoRA 使用实际资料模型的 `loralib` Q/V + 输出投影实现，与部分对比实验中的旧版全 QKV 包装不同。
- 可选 `l1_ssim` 使用固定 [0,1] 范围的局部均值窗口 SSIM。小样本训练器不包含原始实际资料
  RGT 头的层位约束训练；其权重与推理实现单独保留。

只有数据版本、样本 ID、增强、评价范围、编码器检查点和硬件等均匹配时，才能讨论论文指标复现。
验证标签属于训练 `shots` 之外的额外监督。

## 记录与续训

每次小样本实验保存解析后的配置、实际样本名、图像和标签 SHA256、环境版本、验证指标和适配器权重。
`last.pth` 还包含优化器状态、步数、Torch/Python RNG 状态。续训要求配置和数据清单一致。
测试通过恢复中途检查点，验证最终适配器张量完全相同。

训练默认使用 PyTorch 确定性运算并关闭 cuDNN benchmark。确定性针对相同的软件/设备环境；
PyTorch、CUDA、GPU 数量、精度或集合通信归约方式变化可能影响结果，不承诺跨平台逐位一致。
预训练保留原有分布式采样和检查点行为，改变 worker 或 GPU 数量后不承诺逐位一致续训。

验证使用提供的全部验证剖面。分割 mIoU 从整个验证集的混淆矩阵计算，排除并集为零的类别。
RGT MAE/RMSE 按实际目标尺度计算，不根据预测值重新归一化。

## 已完成的验证

- CPU 行为测试共 10 项，覆盖各 Decoder/LoRA 组合：五类 Decoder、冻结编码器不变性、LoRA 梯度与
  零初始化、严格适配器加载、配对数据检查、确定性子集、重复数据泄漏检查、PCA 基底复用、滑窗覆盖、
  RGT 分箱范围、合并权重/DCP 严格加载、训练、检查点加载，以及精确中途续训。
- 单 GPU 和双 GPU 三阶段 CUDA 验证：ViT-S、缩小的自监督头、合成数据、每阶段两步，检查有限损失、
  teacher 交接、Gram 损失、多分辨率加载器构建和 DCP 保存/加载。未重新执行 7B 预训练或验证科学收敛性。
- 安装后命令行工作流：使用小规模验证的 DCP，在 CPU 上完成训练 → 检查点推理 → PCA，以及数据转换和索引。
- 真实 7B Stage-3 DCP + 原始最佳断层/RGT 头：固定种子的 128×160 输入，BF16、eval 模式，
  与原研究模型比较，两者最大绝对误差均为 **0.0**。见
  [real_head_parity.json](validation/real_head_parity.json)。这验证模型兼容性，不代表实测精度或全部输入尺寸。

```bash
CUDA_VISIBLE_DEVICES="" python -m unittest discover -s tests -v
CUDA_VISIBLE_DEVICES=0 python tests/pretrain_smoke.py
# Fresh output directory required; archive/remove your previous .smoke/ first.
CUDA_VISIBLE_DEVICES=0,1 SMOKE_NPROC=2 python tests/pretrain_smoke.py
```

完整数据集、原始数据访问权限和公开权重托管不属于源代码包。
开始新实验前，请阅读[数据说明](DATA.zh-CN.md)及[权重说明](CHECKPOINTS.zh-CN.md)。
