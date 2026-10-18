# SeisDFE

**English** | [简体中文](README.zh-CN.md)

**A seismic foundation model for dense feature extraction.**
[Data format](docs/DATA.md) · [Checkpoints](docs/CHECKPOINTS.md) · [Reproducibility](docs/REPRODUCIBILITY.md)

**Zhixiang Guo**<sup>1,2,3</sup> · **Xinming Wu**<sup>1,2,3,*</sup> · **Yimin Dou**<sup>1,2,3</sup> · **Hui Gao**<sup>4</sup><br>
**Siyao Zhao**<sup>1,2,3</sup> · **He Huang**<sup>1,2,3</sup> · **Wei Liu**<sup>1,2,3</sup>

This repository contains three-stage seismic pretraining, PCA feature visualization,
few-shot training, and fault/RGT inference. The application package is `seisdfe`;
the required DINOv3 core keeps its original `dinov3` names.

| Component | Included |
|---|---|
| Pretraining | Stage 1: DINO/iBOT/KoLeo; Stage 2: Gram anchoring; Stage 3: multiple resolutions |
| Few-shot tasks | Facies, salt, faults, RGT; explicit annotation budget and saved sample IDs |
| Decoders | Linear, 3×3 Conv, PUP, MLA, DPT |
| Encoder adaptation | Frozen encoder or LoRA |
| Visualization | Per-layer PCA RGB, overlays, reusable PCA bases |
| Field heads | Fault DPT; RGT DPT + LoRA in the last 30 blocks |

**Data and encoder weights are not bundled.** Exported fault/RGT heads are separate
release assets, not Git blobs. Public download URLs have not yet been assigned;
see [checkpoint availability and checksums](docs/CHECKPOINTS.md).

## Install

Tested on Linux, Python 3.11, PyTorch 2.5.0, torchvision 0.20.0 and CUDA 12.4.
Pretraining requires NVIDIA GPUs. CPU tests use a tiny DINOv3 model.

```bash
git clone https://github.com/ProgrammerZXG/SeisDFE.git
cd SeisDFE
python -m venv .venv
source .venv/bin/activate
pip install torch==2.5.0 torchvision==0.20.0 --index-url https://download.pytorch.org/whl/cu124
pip install -e .
```

An [environment file](environment.yml) records the dependency versions. Run all
examples from the repository root. Paths in YAML and command overrides are relative
to the current directory. No command downloads model weights implicitly.

## Data

Arrays are numeric NumPy files, indexed as **[depth/time, trace]**. Images are finite
`float32`; segmentation labels contain integers `0..C-1` (255 means ignored), and
RGT labels are floating point. See [DATA.md](docs/DATA.md) for conversion and split rules.

```text
data/
├── pretrain/
│   ├── 256/
│   │   ├── images/<survey>/<section>.npy       # [256,256]
│   │   └── index/seismic-npy-entries.npy       # generated index
│   └── 512/
│       ├── images/<survey>/<section>.npy       # [512,512]
│       └── index/seismic-npy-entries.npy
└── downstream/<task>/                         # salt, facies, fault, rgt
    ├── train/images/<id>.npy
    ├── train/labels/<id>.npy                   # same name and shape
    ├── val/images/<id>.npy
    └── val/labels/<id>.npy
```

Split by survey/source volume **before** extracting adjacent slices or crops.
Validation labels are additional supervision used for checkpoint selection;
`shots` counts training sections only.

## Three-stage pretraining

Place the original DINOv3-7B initialization at `checkpoints/dinov3_vit7b16.pth`.
The provided configurations retain the recorded training schedules: 100k, 10k,
and 30k optimizer steps. GPU count changes the effective batch size and LR scaling.

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

Stage 2 loads Stage 1's final EMA teacher; Stage 3 loads Stage 2's final EMA teacher
and uses 256/384/512 global crops. Stage 1 averages RGB patch-embedding weights for
single-channel seismic input. Add `--resume` only to continue the same output run.
Override paths/settings with dotted values, e.g. `train.batch_size_per_gpu=2`.
Use `--dry-run` to validate paths without starting distributed training.

A Stage-3 DCP directory such as `outputs/stage3/ckpt/29999` can be used directly
as encoder weights; a consolidated `.pth` backbone is also supported.

## Few-shot training

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

Choose `decoder.type=linear|conv|pup|mla|dpt`. MLA/DPT require four feature layers.
RGT defaults to the final layer; when using DPT, also set
`encoder.layers=[9,19,29,39] decoder.n_bins=256`.
For a strictly affine linear probe, set
`decoder.type=linear decoder.use_batchnorm=false decoder.dropout=0 lora.enabled=false`.
The salt/facies presets retain the original mean fusion and BatchNorm setting.

A run saves `config.yaml`, `train_ids.txt`, `data_manifest.json`, `environment.json`,
`metrics.jsonl`, `best.pth` and `last.pth`. `best.pth` minimizes validation loss;
`last.pth` also stores optimizer/RNG state for resume. To resume, repeat the same
command with `--resume outputs/salt_5shot/last.pth` and identical overrides.
To fix the exact subset, use `train.subset_file=path/to/ids.txt`; one image filename
per line, with exactly `train.shots` entries.

These portable presets preserve the main decoder, normalization and loss choices;
they do not reproduce every original paper data split or augmentation. Details are
listed in [REPRODUCIBILITY.md](docs/REPRODUCIBILITY.md).

## Inference

The checkpoint embeds its architecture and preprocessing. Supply the matching
Stage-3 encoder separately. Inputs can be one numeric NPY/NPZ section or a directory
of NPY sections; nested relative filenames are preserved.

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

Outputs preserve the input H×W geometry. Binary faults produce probabilities and
thresholded labels; multiclass tasks produce C×H×W probabilities and H×W labels;
RGT produces a continuous H×W array. The released binned RGT head is bounded to
[0,1]; a linear regression head is unconstrained. RGT is relative, not calibrated age.
Options: `--mode native|resize|fault-tiles|rgt-lateral`, `--window 512 --overlap 256`.
Use `--device cpu --precision fp32` for CPU execution. Native 7B inference and large
MLA decoders can require substantial memory; no universal GPU minimum is claimed.

## PCA visualization

```bash
seisdfe-pca --encoder-config configs/encoder/vit7b.yaml \
  --encoder-weights checkpoints/seisdfe_stage3.pth \
  --input data/field/section.npy --layers 9 19 29 39 --output outputs/pca
```

Layer indices are **zero-based**. Outputs include seismic/PCA/overlay PNGs, saved
PCA bases and metadata. Independent PCA colors are not semantic classes. For
cross-section comparison, reuse one layer's basis with `--basis .../layer_39_basis.npz`.

## Layout and validation

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
# Optional CUDA smoke test; synthetic data, ViT-S, two updates per stage.
CUDA_VISIBLE_DEVICES=0 python tests/pretrain_smoke.py
```

See [validation scope](docs/REPRODUCIBILITY.md). Original SeisDFE code uses the
[MIT license](LICENSE); DINOv3-derived components and weights retain their own
[terms](THIRD_PARTY_NOTICES.md).

For research questions, contact [Xinming Wu](mailto:xinmwu@ustc.edu.cn), the corresponding author.
Manuscript figures and third-party datasets retain their applicable rights and source terms.
