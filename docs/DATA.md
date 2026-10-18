# Data contract

**English** | [简体中文](DATA.zh-CN.md) · [Home](../README.md)

All paths below refer to the repository root. No private filesystem paths are
embedded in application defaults. Data are not included or downloaded automatically.

## Arrays

| Use | Format | Shape / dtype | Meaning |
|---|---|---|---|
| Pretraining | numeric `.npy` | H×W float32 | Unlabeled section; H is time/depth, W is trace |
| Downstream image | numeric `.npy` | H×W float32 | Finite seismic amplitudes |
| Segmentation label | numeric `.npy` | H×W integer | 0..C−1; 255 ignored |
| RGT label | numeric `.npy` | H×W floating point | Relative time; optional per-section min–max normalization |
| Field section | numeric `.npy`, or `.npz` | H×W | NPZ defaults to `seis`; override `--input-key` |
| Pretraining index | `.npy` Unicode vector | N strings | Paths relative to the image root |

Singleton channels, object arrays, pickled dictionaries and implicit axis guesses
are not accepted by the application loaders. Convert them explicitly first.
NaN/Inf and shape mismatches raise errors rather than silently producing predictions.
A three-dimensional survey must be sliced into 2-D sections with a documented axis
order before inference. Preserve section IDs to reassemble the volume afterward.

## Layout

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

`seisdfe-index` sorts filenames and stores the index outside the sample tree. Use
`--validate` to read and validate every pretraining image before starting a large job.
Preserve the generated index: changing ordering changes training sample order.
Stage 1 normally uses 256×256 sections; Stages 2/3 use 512×512 sections with online crops.

## Convert existing NPZ or raw DAT/BIN pairs

Create `split.csv`. Paths are relative to the CSV, not inferred from numeric IDs:

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

`<f4` is little-endian float32; `>f4` is big-endian float32. DAT files are reshaped
in NumPy C order. Use `--transpose` only when required by the source format; it
transposes both arrays. `--label-offset -1` converts 1-based class IDs to 0-based IDs.
The label offset preserves the conventional 255 ignore sentinel.
Do not apply an offset twice in both conversion and training. Threshold nonbinary
fault labels explicitly before conversion if required by the source dataset.

The converter records source hashes and conversion options. It does not invent a
train/validation split, automatically interpolate labels, or execute pickled data.

## Splits and few-shot budgets

- Assign source surveys/volumes to train/validation/test before slicing or cropping.
  Repeated versions or neighboring sections from the same volume are not independent.
- A shot means one labeled file in `train/images`. Every validation file is used for
  validation and best-checkpoint selection; its labels are outside the training budget.
- The run records the selected filenames and SHA256 of selected training and all
  validation pairs. Exact duplicate image files across those sets are rejected.
  This byte-level check does not establish independence of neighboring sections.
- For paper-specific subsets, provide the original filenames through
  `train.subset_file=ids.txt`, with exactly `train.shots` nonempty lines.
- The supplied facies recipe uses 256×704 model inputs as the original F3 probe did.
  It accepts already extracted 2-D arrays, not the original whole-volume binary file.

## Preprocessing

The few-shot presets use the original `mean_std_minmax` normalization: per-section
z-score, then min–max normalization, without 3σ clipping. They resize images
bilinearly and segmentation labels with nearest-neighbor interpolation.

The exported field heads use their recorded 3σ clipping → z-score → [0,1] mapping.
Fault normalization happens per inference patch; RGT normalization happens per
lateral window. These policies are embedded in the exported head configuration.

Pretraining retains the original `SeismicNPY` path: 3σ clipping, z-score, min–max,
8-bit grayscale conversion, then DINO augmentations. PCA uses its continuous
normalization before patch padding, without 8-bit quantization.
