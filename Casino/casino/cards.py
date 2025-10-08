from __future__ import annotations

"""Card and deck utilities for Caino.

Only standard library is used. Suits are represented by unicode characters.
"""

from dataclasses import dataclass
from random import Random
from typing import Iterable, List, Sequence


# Configurable: face cards as 10 for math.
USE_FACE_CARDS_AS_TEN: bool = True


SUITS: Sequence[str] = ("♠", "♥", "♦", "♣")
RANKS: Sequence[str] = (
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
)


@dataclass(frozen=True, slots=True)
class Card:
    """A single playing card.

    Attributes:
        rank: Rank string (A, 2..10, J, Q, K)
        suit: Suit symbol (♠, ♥, ♦, ♣)
    """

    rank: str
    suit: str

    @property
    def value(self) -> int:
        """Numeric value for Caino math.

        - A = 1
        - 2..10 = pip value
        - J/Q/K = 10 if USE_FACE_CARDS_AS_TEN else 0
        """

        if self.rank == "A":
            return 1
        if self.rank.isdigit():
            return int(self.rank)
        # Face
        return 10 if USE_FACE_CARDS_AS_TEN else 0

    def __str__(self) -> str:  # pragma: no cover - trivial
        return f"{self.rank}{self.suit}"

    def __repr__(self) -> str:  # pragma: no cover - trivial
        return f"Card({self.rank!r}, {self.suit!r})"


class Deck:
    """Standard 52-card deck with deterministic shuffle.

    Use `seed` for deterministic order during tests.
    """

    def __init__(self, *, seed: int | None = None) -> None:
        self._rng = Random(seed)
        self._cards: List[Card] = [Card(rank, suit) for suit in SUITS for rank in RANKS]
        self.shuffle()

    def shuffle(self) -> None:
        self._rng.shuffle(self._cards)

    def deal(self, n: int) -> List[Card]:
        assert n >= 0
        dealt = self._cards[:n]
        del self._cards[:n]
        return dealt

    def __len__(self) -> int:
        return len(self._cards)

    def remaining(self) -> int:
        return len(self._cards)

    def extend_top(self, cards: Iterable[Card]) -> None:
        """Testing helper: push cards on top in given order (first becomes next to draw)."""
        prepend = list(cards)
        self._cards = prepend + self._cards

