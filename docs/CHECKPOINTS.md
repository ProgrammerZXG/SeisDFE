# Checkpoints

**English** | [简体中文](CHECKPOINTS.zh-CN.md) · [Home](../README.md)

## Availability

| File | Purpose | Status |
|---|---|---|
| `dinov3_vit7b16.pth` | Original RGB DINOv3 initialization for Stage 1 | Obtain from the DINOv3 authors under their terms |
| `seisdfe_stage3.pth` or a Stage-3 DCP directory | Frozen seismic EMA teacher backbone | Author-side checkpoint exists; public URL pending |
| `fault_dpt.pth` | Frozen Stage-3 + DPT fault head, one output logit | Exported; 127,067,802 bytes; public URL pending |
| `rgt_dpt_lora.pth` | Stage-3 + DPT, 256 RGT bins + LoRA | Exported; 221,513,082 bytes; public URL pending |

Place files in `checkpoints/`. Large weights are excluded from Git. For a public
release, attach the exported heads to GitHub Releases or a model host and update
`download_url` in [checkpoints.json](checkpoints.json). No placeholder download URL
is presented as a working asset.

The two exported heads are included in the author's local delivery under
`checkpoints/`. They do not include the approximately 6.7B-parameter backbone.
Their inference configuration is embedded, including feature layers and normalization.

## Exact model settings

| Setting | Fault | RGT |
|---|---|---|
| Encoder | Stage-3 EMA teacher, ViT-7B/16, single channel | Same |
| Zero-based features | 9, 19, 29, 39, normalized | Same |
| Decoder | DPT, width 256 | DPT, width 256, 256 linear bins in [0,1] |
| Post-process channels | 128, 256, 512, 1024 | Same |
| LoRA | Disabled | Last 30 blocks, r=32, α=64, dropout=0.05 |
| LoRA targets | — | Q/V in merged QKV and output projection |
| Normalization | 3σ clip, z-score, min–max | Same |
| Default inference | 512-pixel tiles, overlap 256, max probabilities | Lateral windows 512, overlap 256, cosine blending |

The fault head came from the recorded Stage-3 frozen DPT 200k-step run; the RGT
head came from the recorded Stage-3 last-30-block LoRA 200k-step run. Both exports
use `model_best.pth`, preserving the original selected tensors. Optimizer/scheduler
state and personal paths are removed. These are field heads trained with their
original larger-data recipes; they are not claimed to be newly trained few-shot heads.

## Integrity

```text
3f7df1cd326bbac0db088b15c8f3501b45616501577232ebffcddf9cbb439c78  fault_dpt.pth
cef9c8a2eb519c8e5da3d9d76bb8d217216c4e9bbaf46657eee26928494769be  rgt_dpt_lora.pth
```

```bash
sha256sum checkpoints/fault_dpt.pth checkpoints/rgt_dpt_lora.pth
# macOS equivalent: shasum -a 256 checkpoints/*.pth
```

Each adapter payload contains `format`, `model`, and `config`. Inference strictly
checks all head/LoRA tensor keys and shapes, and loads the requested backbone branch
without silently falling back to the student. Use the matching EMA teacher and
architecture. An arbitrary replacement encoder can load successfully yet change
predictions; tensor-shape compatibility is not model identity.

## Export an existing research head

```bash
seisdfe-export-head --input /path/to/original/model_best.pth \
  --output checkpoints/fault_dpt.pth
```

The exporter supports the two `dinov3_dpt` field architectures described above.
It rejects full-encoder tuning, prompt/coordinate/high-resolution extensions and
unexpected base weights. It does not guess how to convert unrelated historical
checkpoint layouts. New few-shot `best.pth` files already use the release format.

## Licenses

Original and derived DINOv3 model weights retain the applicable DINOv3 model terms.
The repository's MIT license is not a replacement for those terms. See
[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md).
