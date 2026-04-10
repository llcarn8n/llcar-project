"""Rules sub-package — threshold rules and future Python-based rules.

This package holds JSON rule definitions and optional Python rule modules.
The RuleEngine loads rules from this directory automatically.
"""
from pathlib import Path

RULES_DIR = Path(__file__).parent
