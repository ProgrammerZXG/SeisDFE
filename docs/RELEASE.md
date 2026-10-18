# Publishing this code

**English** | [简体中文](RELEASE.zh-CN.md) · [Home](../README.md)

The release source contains `seisdfe/`, the required `dinov3/` core, configs, tests,
licenses and concise usage docs. The previous project-page files in this workspace
are independent of the Python package.

1. Publish the prepared source tree to `ProgrammerZXG/SeisDFE` using an account with
   repository write permission. Keep `.work/`, data, outputs and weights out of Git.
2. Upload `fault_dpt.pth` and `rgt_dpt_lora.pth` as release/model-host assets, together
   with the matching SeisDFE Stage-3 encoder under its applicable terms.
3. Set real download URLs in `docs/checkpoints.json` and update the availability table.
4. Run the CPU workflow after publishing. For full pretraining, keep the original
   corpus index, sample provenance and hardware/batch settings with the experiment.

The code repository and model assets have separate publication steps. A source
commit does not publish checkpoints; public model download URLs remain pending
until the corresponding assets are uploaded and verified.

Documentation uses paired English and Simplified Chinese Markdown files with
language links at the top. Keep the command examples synchronized, and write all
code comments, docstrings and comments inside documentation examples in English.
