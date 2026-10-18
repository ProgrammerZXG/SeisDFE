"""Small, explicit YAML configuration interface shared by all commands."""

from pathlib import Path
from omegaconf import OmegaConf


def load_config(path, overrides=()):
    """Resolve YAML and dotted KEY=VALUE overrides; paths are relative to cwd."""
    cfg = OmegaConf.load(path)
    cfg = OmegaConf.merge(cfg, OmegaConf.from_dotlist(list(overrides)))
    return OmegaConf.to_container(cfg, resolve=True, throw_on_missing=True)


def save_config(config, path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    OmegaConf.save(OmegaConf.create(config), str(path))
