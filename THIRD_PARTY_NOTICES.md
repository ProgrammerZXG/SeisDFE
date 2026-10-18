# Third-party notices

The MIT license at the repository root covers original SeisDFE application code.
It does not relicense third-party code or model weights.

- `dinov3/` is a selected dependency set from the research DINOv3 checkout,
  retaining DINOv3 names, copyright notices and the
  [DINOv3 License Agreement](licenses/DINOv3-LICENSE.md).
  Upstream: https://github.com/facebookresearch/dinov3.
- `seisdfe/models/dpt_head.py`, `linear_head.py`, `regression.py`, and
  `decoders.py` contain code migrated from that checkout's evaluation modules.
  Their source notices and DINOv3 terms continue to apply. The DPT/SETR model
  structures and tensor names are retained for checkpoint compatibility.
- The Dice computations in `seisdfe/training.py` were adapted from the research
  DINOv3 evaluation trainer and retain its applicable terms.
- `seisdfe/models/lora.py` integrates `loralib` (Microsoft LoRA, MIT), installed
  as a dependency. Upstream: https://github.com/microsoft/LoRA.
- Datasets, manuscripts, figures, pretrained DINOv3 weights and derived
  checkpoints retain their respective source and model-license conditions.
