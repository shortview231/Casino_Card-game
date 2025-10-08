from __future__ import annotations

from caino.engine import CainoGame, Move
from casino.cards import Card


def test_capture_build_requires_matching_target():
    g = CainoGame(seed=3)
    g.players[0].hand = [Card("4", "♠"), Card("6", "♠"), Card("7", "♠"), Card("8", "♠")]
    g.players[1].hand = [Card("4", "♦"), Card("5", "♦"), Card("9", "♦"), Card("K", "♦")]
    g.board = [Card("A", "♣"), Card("3", "♣"), Card("2", "♦"), Card("2", "♣")]
    g.builds = []
    g.turn = 0

    # Build 4 using A+3, holding another 4
    g.apply_move(0, Move(type="build", hand_index=0, select_loose=[0, 1], new_target=4))
    # Opponent captures build with 4♦
    cap = Move(type="capture", hand_index=0, capture_builds=[0])
    g.apply_move(1, cap)
    assert len(g.players[1].pile) >= 3  # took build cards + played 4


def test_capture_loose_sum():
    g = CainoGame(seed=4)
    g.players[0].hand = [Card("5", "♠"), Card("6", "♠"), Card("7", "♠"), Card("8", "♠")]
    g.players[1].hand = [Card("2", "♦"), Card("3", "♦"), Card("9", "♦"), Card("K", "♦")]
    g.board = [Card("2", "♣"), Card("3", "♣"), Card("Q", "♣"), Card("A", "♦")]
    g.builds = []
    g.turn = 0

    # Capture 2+3 with 5
    mv = Move(type="capture", hand_index=0, capture_loose=[0, 1])
    g.apply_move(0, mv)
    assert all(c.rank not in {"2", "3"} for c in g.board)
