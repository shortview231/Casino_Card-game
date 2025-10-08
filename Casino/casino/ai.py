from __future__ import annotations

"""Very simple heuristic AI for Caino."""

from typing import List

from .engine import CainoGame, Move


class SimpleAI:
    """Heuristic:
    1) Prefer capture of a build; else largest loose capture by card count.
    2) Else, create a build targeting 10 if possible; else any build where target is also in hand.
    3) Else, discard the lowest value card.
    """

    def choose_move(self, game: CainoGame, player: int) -> Move:
        moves = game.legal_moves(player)

        # 1) Capture preferences
        capture_builds: List[Move] = [m for m in moves if m.type == "capture" and m.capture_builds]
        if capture_builds:
            return capture_builds[0]

        capture_loose: List[Move] = [m for m in moves if m.type == "capture" and m.capture_loose]
        if capture_loose:
            capture_loose.sort(key=lambda m: len(m.capture_loose or []), reverse=True)
            return capture_loose[0]

        # 2) Build targeting 10 preferred
        build_moves: List[Move] = [m for m in moves if m.type == "build"]
        tens = [m for m in build_moves if m.new_target == 10]
        if tens:
            return tens[0]
        if build_moves:
            return build_moves[0]

        # 3) Discard lowest value
        discards: List[Move] = [m for m in moves if m.type == "discard"]
        discards.sort(key=lambda m: game.players[player].hand[m.hand_index].value)
        return discards[0]

