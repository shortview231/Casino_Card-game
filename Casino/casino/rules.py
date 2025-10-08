from __future__ import annotations

"""Scoring configuration for Caino."""

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PointsConfig:
    """Points available per round.

    Attributes:
        ace: Points per captured Ace.
        most_spades: Points for capturing the most spades.
        most_cards: Points for capturing the most cards.
        two_spades: Points for capturing the 2 of spades.
        ten_diamonds: Points for capturing the 10 of diamonds.
    """

    ace: int = 1
    most_spades: int = 1
    most_cards: int = 2
    two_spades: int = 1
    ten_diamonds: int = 3


POINTS_CONFIG = PointsConfig()

