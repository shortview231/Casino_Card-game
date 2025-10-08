from __future__ import annotations

from casino.engine import CainoGame, Move
from casino.cards import Card


def test_build_requires_holding_target():
    g = CainoGame(seed=1)
    # Force a simple state: player 1 has A♠ and 3♠ and another 4 (2♣+2♦ on board)
    g.players[0].hand = [Card("A", "♠"), Card("3", "♠"), Card("4", "♣"), Card("5", "♣")]
    g.players[1].hand = [Card("7", "♣"), Card("8", "♣"), Card("9", "♣"), Card("K", "♣")]
    g.board = [Card("2", "♣"), Card("2", "♦"), Card("9", "♦"), Card("Q", "♦")]
    g.builds = []
    g.turn = 0

    # Try to build with A + 2 => 3 (legal if holding another 3)
    mv = Move(type="build", hand_index=0, select_loose=[0], new_target=3)
    g.apply_move(0, mv)
    assert len(g.builds) == 1
    assert g.builds[0].target == 3
    assert g.builds[0].owner == 0


def test_extend_build_requires_higher_target_and_holding():
    g = CainoGame(seed=2)
    g.players[0].hand = [Card("A", "♠"), Card("3", "♠"), Card("4", "♣"), Card("5", "♣")]
    g.players[1].hand = [Card("7", "♣"), Card("8", "♣"), Card("9", "♣"), Card("K", "♣")]
    g.board = [Card("2", "♣"), Card("2", "♦"), Card("9", "♦"), Card("Q", "♦")]
    g.builds = []
    g.turn = 0

    # P0 builds to 3
    g.apply_move(0, Move(type="build", hand_index=0, select_loose=[0], new_target=3))
    # P1 can extend to higher target 10 if holding a 10 (has K=10 plus needs a separate 10 card - does not have)
    # So no legal build extend to 10 should be present.
    exts = [m for m in g.legal_moves(1) if m.type == "build" and (m.new_target or 0) > 3]
    assert not exts
