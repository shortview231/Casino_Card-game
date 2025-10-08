from __future__ import annotations

from casino.engine import CainoGame


def test_opening_deal():
    g = CainoGame(seed=42)
    assert len(g.players[0].hand) == 4
    assert len(g.players[1].hand) == 4
    assert len(g.board) == 4


def test_refill_after_empty_hands():
    g = CainoGame(seed=1)
    # burn all hands quickly by discarding
    for _ in range(4):
        g.apply_move(g.turn, g.legal_moves(g.turn)[0])
        g.apply_move(g.turn, g.legal_moves(g.turn)[0])
    # both hands empty now, deck remains, should auto-refill
    assert len(g.players[0].hand) == 4
    assert len(g.players[1].hand) == 4
    # Board should not get new cards
    assert len(g.board) == 4
