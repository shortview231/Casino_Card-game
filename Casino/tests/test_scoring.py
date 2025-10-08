from __future__ import annotations

from caino.engine import CainoGame
from casino.cards import Card


def test_scoring_breakdown_totals_11():
    g = CainoGame(seed=10)
    # Fabricate piles for deterministic scoring
    g.players[0].pile = [Card("A", "♠"), Card("2", "♠"), Card("K", "♣")]
    g.players[1].pile = [Card("A", "♥"), Card("A", "♦"), Card("10", "♦"), Card("2", "♦"), Card("3", "♠")]  # more spades and cards

    scores, breakdown = g.score()
    assert sum(scores) <= 11
    total = breakdown.get("aces_p0", 0) + breakdown.get("aces_p1", 0) + (1 if breakdown.get("two_spades", -1) != -1 else 0) + (3 if breakdown.get("ten_diamonds", -1) != -1 else 0) + (1 if breakdown.get("most_spades", -1) != -1 else 0) + (2 if breakdown.get("most_cards", -1) != -1 else 0)
    assert total == 11
