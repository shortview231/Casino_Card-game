from __future__ import annotations

"""CLI loop to play one round against the SimpleAI."""

from typing import List

from .ai import SimpleAI
from .engine import CainoGame, Move


def list_moves(game: CainoGame, player: int) -> List[Move]:
    moves = game.legal_moves(player)
    for i, m in enumerate(moves):
        print(f"[{i}] {format_move(game, player, m)}")
    return moves


def format_move(game: CainoGame, player: int, m: Move) -> str:
    h = game.players[player].hand[m.hand_index]
    if m.type == "discard":
        return f"Discard {h}"
    if m.type == "build":
        sel = " ".join(str(game.board[i]) for i in (m.select_loose or []))
        return f"Build with {h} + [{sel}] => {m.new_target}"
    if m.type == "capture":
        if m.capture_builds:
            b = m.capture_builds[0]
            return f"Capture build with {h} (build #{b})"
        sel = " ".join(str(game.board[i]) for i in (m.capture_loose or []))
        return f"Capture with {h}: [{sel}]"
    return "?"


def main() -> None:
    game = CainoGame()
    ai = SimpleAI()
    human = 0

    print("Welcome to Caino CLI. You are Player 1.")

    while True:
        print("\n" + game.state_summary())
        if game._round_over():
            scores, breakdown = game.score()
            print("Round over! Scores:", scores, breakdown)
            break

        p = game.turn
        if p == human:
            print("Your move. Legal moves:")
            moves = list_moves(game, p)
            choice = None
            while choice is None:
                try:
                    s = input("Select move index: ")
                    idx = int(s)
                    if 0 <= idx < len(moves):
                        choice = moves[idx]
                except Exception:
                    pass
            game.apply_move(p, choice)
        else:
            moves = game.legal_moves(p)
            choice = ai.choose_move(game, p)
            print(f"AI selects: {format_move(game, p, choice)}")
            game.apply_move(p, choice)


if __name__ == "__main__":
    main()

