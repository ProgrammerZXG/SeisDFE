<div align="center">

# SeisDFE: A Seismic Foundation Model for Dense Feature Extraction

🏢 [Computational Interpretation Group (CIG)](https://cig.ustc.edu.cn/main.htm)

[Zhixiang Guo](https://cig.ustc.edu.cn/guo/list.htm)<sup>1,2,3</sup>,
[Xinming Wu](https://cig.ustc.edu.cn/xinming/list.htm)<sup>1,2,3,*</sup>,
[Yimin Dou](https://cig.ustc.edu.cn/yimin/list.htm)<sup>1,2,3</sup>,
[Hui Gao](https://cig.ustc.edu.cn/hui/list.htm)<sup>4</sup>,
Siyao Zhao<sup>1,2,3</sup>,
He Huang<sup>1,2,3</sup>,
Wei Liu<sup>1,2,3</sup>

[![Paper](https://img.shields.io/badge/Paper-Under%20Review-b31b1b?style=flat-square)](#seisdfe-citation)
[![Code](https://img.shields.io/badge/Code-Released-2ea44f?style=flat-square)](#seisdfe-quick-start)
[![Weights](https://img.shields.io/badge/Weights-Coming%20Soon-9e9e9e?style=flat-square)](#seisdfe-models)
[![License](https://img.shields.io/badge/License-MIT-1f6feb?style=flat-square)](LICENSE)

**English** | [简体中文](README.zh-CN.md)

</div>

<b>🏛 Affiliations</b>

<sup>1</sup> Laboratory of Seismology and Physics of the Earth's Interior, School of Earth and Space Sciences, University of Science and Technology of China, Hefei, 230026, China

<sup>2</sup> State Key Laboratory of Precision Geodesy, University of Science and Technology of China, Hefei, 230026, China

<sup>3</sup> Mengcheng National Geophysical Observatory, University of Science and Technology of China, Hefei, 230026, China

<sup>4</sup> Anhui University of Science and Technology, Huainan, Anhui, 232001, China

<sup>*</sup> Corresponding author: xinmwu@ustc.edu.cn

## 📰 News

- **2026.10.18:** Released the code for three-stage pretraining, few-shot training, field inference, and PCA feature visualization.
- **2026.10:** The manuscript is under review.
- **Coming soon:** SeisDFE encoder weights and the fault / RGT field heads.

## ✨ Introduction

<p align="justify">
High-quality annotations are scarce in seismic interpretation, and most deep-learning workflows still train a separate model for each task. <b>SeisDFE</b> is a 7B-parameter seismic foundation model for <b>dense feature extraction</b>. It is pretrained on <b>5.34 million</b> 2D seismic images derived from <b>more than 500</b> public 3D seismic volumes (over 200,000 km²), starting from DINOv3 ViT-7B. Three successive stages, discriminative self-supervised learning, Gram feature anchoring, and multi-resolution adaptation, make the patch-level features both discriminative and spatially coherent. With the encoder <b>frozen</b>, the same features support seismic facies classification, salt detection, fault detection, and relative geologic time (RGT) estimation, and extend to synthetic-to-field transfer and sparse 3D geobody detection.
</p>

<p align="center">
  <img src="assets/workflow.jpg" width="100%" alt="SeisDFE framework">
</p>
<p align="center"><sub><b>Figure 1.</b> Three-stage pretraining (left), the frozen ViT-7B encoder and its patch-level dense features (middle), and task-specific decoders for downstream interpretation (right).</sub></p>

**Highlights**

- 🧱 **Scale:** ViT-7B encoder with 40 Transformer blocks; single-channel patch embedding initialized from the channel mean of the RGB weights.
- 🔗 **Coherent dense features:** Gram anchoring restores the spatial coherence that degrades during prolonged self-supervised training.
- 🎯 **Label efficiency:** with only **2 annotated sections** on F3, whole-volume mIoU improves by about **12–19 percentage points** over the baselines.
- 🧊 **Frozen and reusable:** one frozen encoder serves facies, salt, faults, and RGT with lightweight heads, and extends to field data and sparse 3D interpretation.

## 🔍 Dense Features

<p align="center">
  <img src="assets/pca_layers.gif" width="460" alt="Seismic input versus PCA of SeisDFE features at layers 10, 20, 30 and 40">
</p>
<p align="center"><sub>Seismic input versus the PCA of SeisDFE dense features at layers 10 → 20 → 30 → 40 (panels from Fig. 2d). PCA colors show feature organization, not class labels.</sub></p>

<p align="justify">
Shallow layers emphasize local amplitude variations, reflection textures, and structural edges; intermediate layers organize features along reflection systems and stratigraphic variations; deep layers form larger, coherent regions while retaining major structural boundaries. Under an identical frozen linear-probing protocol on SEAM facies classification, each stage improves the accessibility of task-relevant information:
</p>

<div align="center">

| Checkpoint | mIoU | mPA |
|:--|:--:|:--:|
| Stage I · large-scale SSL | 0.6332 | 0.8143 |
| Stage II · Gram anchoring | 0.6431 <sub>(+0.0099)</sub> | 0.8247 <sub>(+0.0104)</sub> |
| Stage III · multi-resolution | **0.6530** <sub>(+0.0198)</sub> | **0.8297** <sub>(+0.0154)</sub> |

</div>

<!-- Figure 2 temporarily hidden; remove this wrapper to restore.

<details>
<summary><b>Figure 2 · Evolution and organization of dense seismic representations</b></summary>
<br>
<p align="center"><img src="assets/dense_features.jpg" width="100%" alt="Figure 2"></p>
<p align="center"><sub>(a) Patch-feature similarity during Stage I at 50k, 80k, and 100k steps. (b) PCA of features after each stage. (c) Frozen linear probing on SEAM. (d) PCA of features from different encoder depths.</sub></p>
</details>

-->

<!-- Results temporarily hidden; remove this wrapper to restore.

## :stars: Results

### Extreme few-shot linear probing

<p align="justify">
All encoders stay frozen and only a linear head is trained, using identical samples and splits. Values are means over four random draws at the smallest annotation budget.
</p>

<div align="center">

| Task (budget) | Metric | **SeisDFE** | DINOv3-7B | NCS-2D | SFM-Large |
|:--|:--:|:--:|:--:|:--:|:--:|
| TGS salt (5 images) | mIoU | **0.72** | 0.60 | 0.58 | 0.57 |
| F3 facies (2 sections) | whole-volume mIoU | **0.82** | 0.70 | 0.66 | 0.63 |

</div>

<p align="center">
  <img src="assets/fewshot.png" width="90%" alt="Extreme few-shot linear probing">
</p>
<p align="center"><sub><b>Figure 3.</b> Few-shot linear probing for (a) salt, (b) F3 facies, (c) RGT (SSIM), and (d) faults, including the distilled SeisDFE-Large.</sub></p>

### Task-specific decoders

<p align="justify">
With larger training sets, SeisDFE, SeisDFE-Large, and DINOv3-7B remain frozen; SFM-Large and NCS-2D report the better of frozen or LoRA adaptation on validation.
</p>

<div align="center">

<table>
  <thead>
    <tr><th align="left">Encoder</th><th colspan="2">SEAM facies · PUP</th><th colspan="2">TGS salt · Linear</th><th colspan="2">Fault · MLA</th></tr>
    <tr><th></th><th>mIoU</th><th>mPA</th><th>mIoU</th><th>mPA</th><th>mIoU</th><th>mPA</th></tr>
  </thead>
  <tbody>
    <tr><td>DINOv3-7B <sub>frozen</sub></td><td align="center">0.8374</td><td align="center">0.9221</td><td align="center">0.8116</td><td align="center">0.8815</td><td align="center"><b>0.7564</b></td><td align="center"><b>0.8023</b></td></tr>
    <tr><td>SFM-Large <sub>LoRA</sub></td><td align="center">0.8243</td><td align="center">0.8994</td><td align="center">0.8044</td><td align="center">0.8773</td><td align="center">0.6361</td><td align="center">0.7062</td></tr>
    <tr><td>NCS-2D <sub>frozen / LoRA</sub></td><td align="center">0.8415</td><td align="center">0.9121</td><td align="center">0.8046</td><td align="center">0.8767</td><td align="center">0.6468</td><td align="center">0.7165</td></tr>
    <tr><td>SeisDFE-Large <sub>frozen</sub></td><td align="center">0.8768</td><td align="center">0.9289</td><td align="center">0.8565</td><td align="center">0.9149</td><td align="center">0.7090</td><td align="center">0.7691</td></tr>
    <tr><td><b>SeisDFE</b> <sub>frozen</sub></td><td align="center"><b>0.8845</b></td><td align="center"><b>0.9324</b></td><td align="center"><b>0.8819</b></td><td align="center"><b>0.9297</b></td><td align="center">0.7374</td><td align="center">0.7867</td></tr>
  </tbody>
</table>

</div>

<p align="justify"><sub>NCS-2D is frozen for facies and LoRA-adapted for salt and faults. Faults are narrow discontinuities that depend more on multi-level fusion and decoder capacity, where DINOv3-7B stays slightly ahead.</sub></p>

<details>
<summary><b>Representative predictions</b></summary>
<br>
<p align="center"><img src="assets/downstream.jpg" width="100%" alt="Downstream predictions"></p>
<p align="center"><sub>Rows: SEAM facies, TGS salt, faults. Columns: seismic, DINOv3-7B, SFM-Large, NCS-2D, SeisDFE, label.</sub></p>
</details>

### Synthetic-to-field transfer

<p align="justify">
Fault, karst-cave, and RGT models are trained only on synthetic data and applied directly to unseen field surveys, compared with a U-Net baseline trained on the same data. Fault and karst use the frozen encoder with a DPT decoder; RGT adds LoRA to the last 30 blocks. Field labels are unavailable, so this comparison is qualitative.
</p>

<p align="center"><img src="assets/field_transfer.jpg" width="100%" alt="Synthetic-to-field transfer"></p>
<p align="center"><sub><b>Figure 4.</b> Fault detection (top left), karst detection (top right), and RGT estimation (bottom): SeisDFE versus U-Net on field data.</sub></p>

### Sparse 3D geobody detection

<p align="justify">
Features of neighboring sections from the frozen 2D encoder are fused and decoded by a lightweight 3D convolutional decoder, trained only on sparsely annotated slices. Examples cover channels (Parihaka, Romney), a salt dome (F3), and karst caves in a field survey.
</p>

<p align="center"><img src="assets/sparse_3d.jpg" width="100%" alt="Sparse 3D geobody detection"></p>
<p align="center"><sub><b>Figure 5.</b> (a) Pseudo-3D decoding framework, (b) sparse labels, (c) 2D PUP predictions, (d) 3D convolutional decoder predictions.</sub></p>

-->

<a id="seisdfe-models"></a>

## 🧠 Models

| Model | Architecture | Trained on | Status |
|:--|:--|:--|:--:|
| SeisDFE encoder (Stage III) | ViT-7B/16, 40 blocks, 1 channel | 5.34M + 600K unlabeled seismic images | Coming soon |
| Fault head `fault_dpt.pth` | Frozen SeisDFE + DPT | Synthetic faults | Coming soon |
| RGT head `rgt_dpt_lora.pth` | SeisDFE + DPT + LoRA (last 30 blocks) | Synthetic RGT | Coming soon |

Weights are not bundled and no command downloads them implicitly. Pretraining starts from the original DINOv3-7B weights, which must be obtained from the [DINOv3 authors](https://github.com/facebookresearch/dinov3) under their terms.

<a id="seisdfe-quick-start"></a>

## :rocket: Quick Start

### 1. Install

Tested on Linux with Python 3.11, PyTorch 2.5.0, torchvision 0.20.0, and CUDA 12.4.

```bash
git clone https://github.com/ProgrammerZXG/SeisDFE.git
cd SeisDFE
python -m venv .venv && source .venv/bin/activate
pip install torch==2.5.0 torchvision==0.20.0 --index-url https://download.pytorch.org/whl/cu124
pip install -e .
```

A pinned [environment.yml](environment.yml) is also provided. Run all commands from the repository root.

### 2. Prepare data

Sections are `float32` NumPy arrays indexed as **[depth/time, trace]**. Segmentation labels are integers `0..C-1` (`255` = ignore); RGT labels are floating point. Split by survey **before** extracting slices or crops.

```text
data/
├── pretrain/
│   ├── 256/images/<survey>/<section>.npy   # [256, 256]
│   └── 512/images/<survey>/<section>.npy   # [512, 512]
└── downstream/<task>/                     # salt | facies | fault | rgt
    ├── train/{images,labels}/<id>.npy
    └── val/{images,labels}/<id>.npy
```

### 3. Three-stage pretraining

Place the DINOv3-7B initialization at `checkpoints/dinov3_vit7b16.pth`. The configs keep the recorded 100k / 10k / 30k step schedules.

```bash
seisdfe-index --root data/pretrain/256/images --output data/pretrain/256/index --validate
seisdfe-index --root data/pretrain/512/images --output data/pretrain/512/index --validate

for s in 1 2 3; do
  torchrun --standalone --nproc_per_node=8 -m seisdfe.cli.pretrain \
    --config configs/pretrain/stage${s}.yaml --output outputs/stage${s}
done
```

<details>
<summary>Pretraining notes</summary>

- Stage 1 averages the RGB patch-embedding weights for single-channel input.
- Stage 2 loads Stage 1's final EMA teacher; Stage 3 loads Stage 2's and trains on 256 / 384 / 512 crops.
- GPU count changes the effective batch size and LR scaling.
- Use `--resume` to continue the same run, `--dry-run` to validate paths, and dotted overrides such as `train.batch_size_per_gpu=2`.
- A Stage-3 DCP directory (e.g. `outputs/stage3/ckpt/29999`) or a consolidated `.pth` can be used directly as encoder weights.

</details>

### 4. Few-shot training

```bash
seisdfe-train --config configs/downstream/salt_fewshot.yaml \
  encoder.weights=checkpoints/seisdfe_stage3.pth \
  data.root=data/downstream/salt train.shots=5 train.seed=3407 \
  train.output=outputs/salt_5shot
```

<details>
<summary>Decoders, LoRA, and run outputs</summary>

- `decoder.type=linear|conv|pup|mla|dpt`; MLA and DPT use four feature layers.
- LoRA example: `decoder.type=dpt lora.enabled=true lora.last_n_blocks=8 lora.rank=8 lora.alpha=16`.
- RGT defaults to the last layer; with DPT also set `encoder.layers=[9,19,29,39] decoder.n_bins=256`.
- Strictly affine linear probe: `decoder.type=linear decoder.use_batchnorm=false decoder.dropout=0 lora.enabled=false`.
- Each run saves `config.yaml`, `train_ids.txt`, `data_manifest.json`, `environment.json`, `metrics.jsonl`, `best.pth`, and `last.pth`. Resume with `--resume outputs/<run>/last.pth`; fix the subset with `train.subset_file=ids.txt`.

These portable presets keep the main decoder, normalization, and loss choices but do not rebuild every original data split or augmentation.

</details>

### 5. Inference

```bash
seisdfe-infer --checkpoint checkpoints/fault_dpt.pth \
  --encoder-config configs/encoder/vit7b.yaml \
  --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --output outputs/field_fault
```

Swap in `checkpoints/rgt_dpt_lora.pth` for RGT, or any few-shot `best.pth`. Inputs can be a single NPY/NPZ section or a directory of NPY sections.

<details>
<summary>Inference options</summary>

- `--mode native|resize|fault-tiles|rgt-lateral`, `--window 512 --overlap 256`.
- Faults use overlapping tiles with maximum-probability fusion; RGT uses full-depth lateral windows with cosine blending.
- Outputs keep the input H×W. The binned RGT head outputs relative time in [0, 1], not calibrated age.
- CPU: `--device cpu --precision fp32`. The 7B encoder and MLA decoders can require substantial memory.

</details>

### 6. PCA feature visualization

```bash
seisdfe-pca --encoder-config configs/encoder/vit7b.yaml \
  --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --layers 9 19 29 39 --output outputs/pca
```

Layer indices are **zero-based**. To compare sections with consistent colors, reuse one layer's basis with `--layers 39 --basis outputs/pca/layer_39_basis.npz` and choose a new `--output` directory.

<details>
<summary>Repository layout and tests</summary>

```text
seisdfe/             # data, models, training, inference, PCA, CLI
dinov3/              # required DINOv3 core, original names retained
configs/pretrain/    # three recorded stage configurations
configs/downstream/  # portable few-shot task configurations
configs/encoder/     # ViT-7B architecture
tests/               # CPU tests and a CUDA three-stage smoke test
```

```bash
CUDA_VISIBLE_DEVICES="" python -m unittest discover -s tests -v
CUDA_VISIBLE_DEVICES=0 python tests/pretrain_smoke.py   # optional, CUDA
```

</details>

<a id="seisdfe-citation"></a>

## :bookmark: Citation

Coming soon.

## :memo: Acknowledgment

This work was supported by the National Natural Science Foundation of China (NSFC) under Grant No. 42625404. The codebase builds on [DINOv3](https://github.com/facebookresearch/dinov3) and uses [LoRA](https://github.com/microsoft/LoRA). We thank the USGS, SEG, NZPAM, NLOG, and other public repositories for the seismic volumes used in pretraining, and [SEAM](https://www.aicrowd.com/challenges/seismic-facies-identification-challenge), [TGS](https://www.kaggle.com/competitions/tgs-salt-identification-challenge), and the [F3 facies benchmark](https://github.com/yalaudah/facies_classification_benchmark) for the downstream datasets.

## :postbox: Contact

If you have any questions about this work, please feel free to contact xinmwu@ustc.edu.cn or zxg3@mail.ustc.edu.cn.

## 📄 License

Original SeisDFE code is released under the [MIT License](LICENSE). 
