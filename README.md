<div align="center">

# SeisDFE

### A Seismic Foundation Model for Dense Feature Extraction

**English** · [简体中文](README.zh-CN.md)

**One reusable representation for data-efficient seismic interpretation.**

[Manuscript](dist/paper/seisdfe.pdf) · [Project Page](https://seisdfe.swoony-petal-8046.chatgpt.site) · [Results](#results) · [Citation](#citation)

[![Model](https://img.shields.io/badge/Encoder-ViT--7B-244c3e?style=flat-square)](#model)
[![Pretraining](https://img.shields.io/badge/Pretraining-5.34M_images-4c735e?style=flat-square)](#pretraining)
[![Evaluation](https://img.shields.io/badge/Evaluation-Frozen_encoder-657e67?style=flat-square)](#results)
[![License](https://img.shields.io/badge/License-MIT-b87750?style=flat-square)](https://github.com/ProgrammerZXG/SeisDFE/blob/main/LICENSE)

**Zhixiang Guo**<sup>1,2,3</sup> · **Xinming Wu**<sup>1,2,3,*</sup> · **Yimin Dou**<sup>1,2,3</sup> · **Hui Gao**<sup>4</sup><br>
**Siyao Zhao**<sup>1,2,3</sup> · **He Huang**<sup>1,2,3</sup> · **Wei Liu**<sup>1,2,3</sup>

[Computational Interpretation Group (CIG)](https://cig.ustc.edu.cn/) · University of Science and Technology of China

<img src="dist/assets/readme-cover.png" alt="SeisDFE: a shared seismic representation learned from 5.34 million images, with original seismic and dense feature PCA panels from the manuscript." width="100%">

</div>

<details>
<summary><strong>Affiliations</strong></summary>

1. Laboratory of Seismology and Physics of the Earth's Interior, School of Earth and Space Sciences, University of Science and Technology of China, Hefei, China.
2. State Key Laboratory of Precision Geodesy, University of Science and Technology of China, Hefei, China.
3. Mengcheng National Geophysical Observatory, University of Science and Technology of China, Hefei, China.
4. Anhui University of Science and Technology, Huainan, China.

\* Corresponding author: [xinmwu@ustc.edu.cn](mailto:xinmwu@ustc.edu.cn).

</details>

## Overview

SeisDFE is a **7B-parameter seismic foundation model** for dense feature extraction. Pretrained on **5.34 million unlabeled 2D images** derived from **more than 500 seismic volumes**, it learns discriminative, spatially coherent representations that can be reused across seismic interpretation tasks.

A progressive training strategy combines large-scale self-supervised learning, Gram feature anchoring, and multi-resolution adaptation. The resulting **frozen encoder** supports seismic facies classification, salt detection, fault detection, and relative geologic time (RGT) estimation with lightweight prediction heads or task-specific decoders.

- **Data-efficient interpretation.** With only two annotated F3 sections, frozen linear probing reaches approximately **0.82 whole-volume mIoU**, a gain of **12–19 percentage points** over the compared baselines.
- **A shared feature extractor.** The same pretrained representation supports multiple geological targets without repeated encoder optimization in the core benchmarks.
- **Spatially coherent dense features.** Gram anchoring constrains patch-feature relations; multi-resolution adaptation stabilizes representations across input scales.
- **Field and 3D applications.** Synthetic supervision and sparse slice annotations support field interpretation and cross-slice 3D decoding. These extensions are evaluated qualitatively.
- **A distilled alternative.** SeisDFE-Large retains much of the 7B model's facies, salt, and RGT capability at lower computational cost.

<div align="center">
  <img src="dist/assets/figures/fig1.png" alt="Overview of the three-stage SeisDFE pretraining pipeline, frozen ViT-7B dense feature extractor, and downstream tasks." width="100%">
</div>

*Figure 1. SeisDFE connects large-scale seismic pretraining to reusable dense features and task-specific interpretation. [Original PDF](dist/assets/figures/fig1.pdf).*

## Release Status

This release provides the research overview, manuscript, original figures, benchmark tables, citation, and project-page source.

| Resource | Status / access |
| :--- | :--- |
| Author manuscript | [PDF, including supplementary information](dist/paper/seisdfe.pdf) |
| Project page | [Hosted review version](https://seisdfe.swoony-petal-8046.chatgpt.site), currently owner-private; [local source](dist/index.html) |
| Main and supplementary figures | [Original PDFs and web images](dist/assets/figures/) |
| Cross-task benchmark results | [CSV: all 15 entries from Table 1](dist/assets/benchmarks.csv) |
| Pretraining / downstream implementation | Not included in this release |
| Pretrained checkpoints / experiment configurations | Not included in this release |
| Pretraining dataset download | No download link provided in this release |

Follow the [SeisDFE repository](https://github.com/ProgrammerZXG/SeisDFE) for release updates. Training and inference commands will be documented alongside the corresponding implementation and checkpoints.

## Pretraining

The pretraining collection spans more than 500 migrated 3D seismic volumes covering over 200,000 km². Source repositories include USGS, SEG, NZPAM, and NLOG. After harmonization, duplicate removal, and quality control, the volumes are sampled into single-channel 2D seismic images.

| Stage | Objective | Data / resolution | Training steps |
| :--- | :--- | :--- | ---: |
| **I · Large-scale self-supervision** | DINO image-level self-distillation, iBOT patch-level prediction, and KoLeo regularization | 5.34M images, 256 × 256 | 100k |
| **II · Gram feature anchoring** | Constrain pairwise patch-feature relationships during continued pretraining | Dense feature-relation constraints | 10k |
| **III · Multi-resolution adaptation** | Stabilize representations as input size and token-grid size change | 600k images; 256², 384², and 512² inputs | 30k |

Under the same frozen linear-probing protocol on SEAM facies, mIoU increases from **0.6332 → 0.6431 → 0.6530** across Stages I–III; mPA increases from **0.8143 → 0.8247 → 0.8297**.

[Dense feature evolution (Figure 2)](dist/assets/figures/fig2.pdf) · [Detailed training architecture (Figure S1)](dist/assets/figures/figs1.pdf)

## Model

| Model | Role | Initialization | Core downstream setting |
| :--- | :--- | :--- | :--- |
| **SeisDFE** | ViT-7B; 40 Transformer blocks; primary dense feature extractor | DINOv3 ViT-7B | Frozen encoder + prediction head / decoder |
| **SeisDFE-Large** | Distilled student for lower computational cost | DINOv3-Large | Frozen encoder + prediction head / decoder |

The patch embedding accepts **single-channel seismic input**, initialized by averaging the original RGB embedding weights along the channel dimension. Intermediate Transformer features are available for multi-level decoding. The distilled student learns image-level and patch-level output distributions from the final SeisDFE-7B teacher.

The 7B encoder has substantial memory and inference costs. See the manuscript for training details; this release does not specify unverified inference hardware requirements.

## Results

### Extreme few-shot interpretation

All compared encoders are **frozen**, and only a **linear prediction head** is trained. Experiments use different annotation subsets to assess sampling variability.

| Experiment | Supervision | SeisDFE | DINOv3-7B | NCS-2D | SFM-Large |
| :--- | :--- | ---: | ---: | ---: | ---: |
| F3 facies classification · whole-volume mIoU ↑ | 2 annotated sections | **≈0.82** | ≈0.70 | ≈0.66 | ≈0.63 |
| Salt detection · mIoU ↑ | 5 annotated images | **≈0.72** | ≈0.60 | ≈0.58 | ≈0.57 |

These are rounded values reported in manuscript §2.4. SeisDFE also reaches approximately **0.82 SSIM** on RGT estimation with five training samples. For faults, SeisDFE and DINOv3-7B perform similarly in the few-shot settings; seismic-domain gains are smaller for these narrow discontinuities.

<div align="center">
  <img src="dist/assets/figures/fig3.png" alt="Few-shot frozen linear-probing results for salt detection, F3 facies classification, relative geologic time estimation, and fault detection." width="900">
</div>

*Figure 3. Performance across annotation budgets, including variation across subsets. [Original PDF](dist/assets/figures/fig3.pdf).*

### Cross-task downstream evaluation

Results below reproduce **Table 1** of the manuscript. These experiments use larger training sets and task-specific decoders; they are separate from the few-shot protocol above. Bold denotes the best value within each task.

| Task | Decoder | Encoder | Encoder setting | mIoU ↑ | mPA ↑ |
| :--- | :--- | :--- | :--- | ---: | ---: |
| SEAM facies | PUP | DINOv3-7B | Frozen | 0.8374 | 0.9221 |
| SEAM facies | PUP | SFM-Large | LoRA | 0.8243 | 0.8994 |
| SEAM facies | PUP | NCS-2D | Frozen | 0.8415 | 0.9121 |
| SEAM facies | PUP | SeisDFE-Large | Frozen | 0.8768 | 0.9289 |
| SEAM facies | PUP | **SeisDFE** | **Frozen** | **0.8845** | **0.9324** |
| TGS salt | Linear | DINOv3-7B | Frozen | 0.8116 | 0.8815 |
| TGS salt | Linear | SFM-Large | LoRA | 0.8044 | 0.8773 |
| TGS salt | Linear | NCS-2D | LoRA | 0.8046 | 0.8767 |
| TGS salt | Linear | SeisDFE-Large | Frozen | 0.8565 | 0.9149 |
| TGS salt | Linear | **SeisDFE** | **Frozen** | **0.8819** | **0.9297** |
| Fault detection | MLA | DINOv3-7B | Frozen | **0.7564** | **0.8023** |
| Fault detection | MLA | SFM-Large | LoRA | 0.6361 | 0.7062 |
| Fault detection | MLA | NCS-2D | LoRA | 0.6468 | 0.7165 |
| Fault detection | MLA | SeisDFE-Large | Frozen | 0.7090 | 0.7691 |
| Fault detection | MLA | **SeisDFE** | **Frozen** | 0.7374 | 0.7867 |

SeisDFE, SeisDFE-Large, and DINOv3-7B remain frozen. For SFM-Large and NCS-2D, the better of frozen and LoRA settings is reported. **SeisDFE leads facies and salt interpretation; DINOv3-7B leads the fault benchmark.**

[Download benchmark CSV](dist/assets/benchmarks.csv) · [Qualitative comparisons (Figure S2)](dist/assets/figures/figs2.pdf)

## Field and 3D Applications

### Synthetic-to-field transfer

Synthetic training supports field **fault detection, karst cave detection, and RGT estimation**. Compared with U-Net, the SeisDFE configurations show more continuous faults, more localized karst responses, and finer stratigraphic variations in several examples.

The field RGT experiment uses **limited LoRA adaptation in deeper encoder blocks**, together with a DPT decoder. Complete field labels are unavailable, so these comparisons are **qualitative**, not quantitative claims of field accuracy.

[View synthetic-to-field examples (Figure 4)](dist/assets/figures/fig4.pdf).

### Sparse 3D geobody interpretation

SeisDFE's frozen **2D** encoder extracts features from neighboring sections. A lightweight **3D convolutional decoder** introduces cross-slice context, using supervision only on annotated slices. Compared with independent 2D PUP decoding, this approach produces more coherent cross-slice continuity in several examples.

The study includes channels in **Parihaka** and **Romney**, a salt dome in **F3**, and karst caves in a field survey. Full voxel-level annotations are unavailable; these experiments examine spatial coherence rather than absolute accuracy.

<div align="center">
  <img src="dist/assets/figures/fig5.png" alt="Sparse 3D interpretation with frozen two-dimensional features and a cross-slice decoder, including channels, a salt dome, and karst caves." width="900">
</div>

*Figure 5. Sparse slice supervision and volumetric interpretation. [Original PDF](dist/assets/figures/fig5.pdf).*

## Explore the Project Page

The project page supports English (default) and Simplified Chinese through the **EN / 中文** switch. Use [`?lang=zh`](https://seisdfe.swoony-petal-8046.chatgpt.site/?lang=zh) to share the Chinese view.

The project page is a self-contained static site with no build step or production JavaScript dependencies. It includes an automatic feature tour with smooth layer transitions, a seismic/PCA comparison slider, scroll-triggered reveals, a reading progress indicator, benchmark tabs, an accessible figure viewer, and downloadable research materials. The tour pauses for manual exploration and respects reduced-motion preferences.

To preview a local copy of this documentation package:

```bash
# Run from the directory containing this README.
python3 -m http.server 8000 --directory dist --bind 127.0.0.1
```

Open [localhost:8000](http://localhost:8000). See [WEBSITE.md](WEBSITE.md) for editing, validation, and static-host deployment instructions.

## Citation

If you use SeisDFE in your research, please cite the manuscript. This entry intentionally contains no unconfirmed journal, DOI, or arXiv identifier.

```bibtex
@misc{guo2026seisdfe,
  title  = {SeisDFE: A Seismic Foundation Model
            for Dense Feature Extraction},
  author = {Guo, Zhixiang and Wu, Xinming and
            Dou, Yimin and Gao, Hui and Zhao, Siyao
            and Huang, He and Liu, Wei},
  year   = {2026},
  note   = {Manuscript},
  url    = {https://github.com/ProgrammerZXG/SeisDFE}
}
```

[Download BibTeX](dist/assets/seisdfe.bib).

## Related Projects and Acknowledgments

- [Cross-Domain Foundation Model Adaptation](https://github.com/ProgrammerZXG/Cross-Domain-Foundation-Model-Adaptation): adapting computer vision foundation models to geophysical interpretation.
- [LFD](https://github.com/ProgrammerZXG/LFD): latent-compression-free generative diffusion for implicit structural modeling.

SeisDFE builds on DINOv3 and teacher–student self-supervised learning. We acknowledge the seismic data providers described in the manuscript and the authors of the compared foundation models. Full references are provided in the [paper](dist/paper/seisdfe.pdf).

## Contact and License

For research questions, contact [Xinming Wu](mailto:xinmwu@ustc.edu.cn), the corresponding author.

The SeisDFE repository uses the [MIT License](https://github.com/ProgrammerZXG/SeisDFE/blob/main/LICENSE). Manuscript figures and third-party datasets retain their applicable rights and source terms.
