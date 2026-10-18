# Reproducibility and migration record

**English** | [简体中文](REPRODUCIBILITY.zh-CN.md) · [Home](../README.md)

Validated on 2026-10-18. This release packages working implementations and records
what was checked; it does not claim that a short smoke test reproduces paper scores.

## Preserved implementation

- DINOv3 transformer/layers, losses, EMA, FSDP, masking, multi-crop augmentation and
  three-stage training remain under `dinov3/`. Unrelated benchmarks, alternative
  foundation models, notebooks, private datasets and experiment outputs are omitted.
- Stage configurations come from the resolved original 100k/10k/30k runs. Dataset,
  output and initialization paths are replaced with portable paths. The original
  Stage-3 LR schedule (`peak=0`, `end=1.25e-5` before batch scaling) is preserved
  intentionally, including its increasing schedule; it was not silently corrected.
- Necessary core maintenance: deterministic NPY index ordering and directory
  creation; PyTorch 2.5 FSDP import compatibility; correct programmatic argument
  parsing; safe distributed startup for a shared output directory.
- DPT, SETR-PUP/MLA, linear/Conv heads and LoRA tensor names remain compatible with
  the selected source models. Application entry points are renamed `seisdfe-*`.
- Original-source hashes and extracted symbols are in
  [source_manifest.json](source_manifest.json). The server snapshot had no Git
  metadata, so a precise upstream commit cannot be inferred.

## Few-shot protocol

The portable recipes retain Adam, constant learning rates, decoder choices,
feature levels, input geometry and the main original loss/normalization settings:

| Task | Default budget / updates | Decoder | Loss |
|---|---|---|---|
| Salt | 5 / 2000 | mean-fused linear + BatchNorm | Original weighted Dice |
| F3-style facies | 2 / 2000 | mean-fused linear + BatchNorm | Original weighted Dice |
| Fault | 5 / 1000 | concatenated four-level 3×3 Conv | Dice |
| RGT | 5 / 1000 | last-layer affine linear | MSE |

Differences from the complete paper experiments are explicit:

- Portable inputs are already split numeric NPY pairs. The original private
  whole-volume files, split manifests and exact annotation identities are not
  distributed. Fixed subsets can be supplied with `train.subset_file`.
- The default selection is seeded random sampling. The original F3
  evenly-spaced/jitter protocol is not inferred from filenames. Supply its original
  ID list to reproduce that selection.
- These recipes provide geometric flips. The original RGT geophysical noise,
  synthetic waveform regeneration and local degradation pipeline is not enabled.
- Batches are sampled deterministically from the selected subset using a generator
  keyed by `(seed, optimizer step)`. This is stable across resume and independent of
  worker scheduling, but differs from the original DataLoader shuffle sequence.
- LoRA uses the field model's reference `loralib` Q/V + projection implementation.
  It is not the older unrestricted QKV wrapper used in some comparison experiments.
- Optional `l1_ssim` uses local average-window SSIM on a fixed [0,1] scale. The
  released field head's original horizon-regularized training is not included in
  the few-shot trainer. Field-head weights and inference are preserved separately.

Never report new results as identical paper reproductions without matching dataset
versions, ID lists, augmentation, evaluation scope, backbone checkpoint and hardware.
Validation labels are additional supervision beyond the reported training `shots`.

## Recorded information

Each few-shot run saves the resolved configuration, exact chosen filenames, image
and label SHA256, environment versions, validation metrics and adapter weights.
`last.pth` also contains optimizer state, step number and Torch/Python RNG state.
Resume requires the same configuration and data manifest. A test restores a
mid-run checkpoint and verifies the final adapter tensors exactly.

Training defaults to deterministic PyTorch operations and disabled cuDNN benchmark
selection. Determinism is scoped to the same software/device environment. PyTorch,
CUDA, GPU count, numerical precision and collective-reduction changes can alter
results; cross-platform bitwise reproducibility is not promised. Pretraining keeps
its original distributed sampler/checkpointer behavior and does not promise exact
bitwise continuation after changing worker or GPU counts.

Validation uses all provided validation sections. Segmentation mIoU is computed
from a dataset-wide confusion matrix, excluding classes with zero union. RGT MAE
and RMSE use the actual target scale, without prediction-dependent normalization.

## Completed checks

- CPU behavior suite (10 tests, with decoder/LoRA combinations): all five decoder families, frozen-base invariance, LoRA
  gradients and zero initialization, strict adapter loading, paired data checks,
  deterministic subsets, duplicate leakage detection, PCA basis reuse, tiled
  coverage, RGT bin range, strict consolidated/DCP backbone loading, training,
  checkpoint loading, and exact mid-run resume.
- Three-stage CUDA smoke tests on one GPU and two GPUs: ViT-S, reduced SSL heads,
  synthetic data, two optimizer steps per stage, finite losses, teacher handoff,
  Gram loss, multiple-resolution loader construction, and DCP save/load. The test
  does not rerun 7B pretraining or validate scientific convergence.
- Installed-package CLI workflow: training → checkpoint inference → PCA, plus
  dataset conversion and indexing, using the smoke-test DCP and CPU execution.
- Real 7B Stage-3 DCP + original best fault/RGT heads: forward parity against the
  original research model on a seeded 128×160 input, BF16, eval mode. Both heads
  have maximum absolute difference **0.0**. See
  [real_head_parity.json](validation/real_head_parity.json). This verifies model
  compatibility, not field accuracy or all possible input sizes.

```bash
CUDA_VISIBLE_DEVICES="" python -m unittest discover -s tests -v
CUDA_VISIBLE_DEVICES=0 python tests/pretrain_smoke.py
# Fresh output directory required; archive/remove your previous .smoke/ first.
CUDA_VISIBLE_DEVICES=0,1 SMOKE_NPROC=2 python tests/pretrain_smoke.py
```

The full dataset, original data access rights and public checkpoint hosting remain
external to the source code. Consult [DATA.md](DATA.md) and
[CHECKPOINTS.md](CHECKPOINTS.md) before a new experiment.
