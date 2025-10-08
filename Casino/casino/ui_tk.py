from __future__ import annotations

"""Tkinter prototype UI for Caino.

Simple red felt table with opponent (top), board (center), player (bottom).
Click a player card to see legal actions; provide buttons for actions.
"""

import os
import random
import tkinter as tk
from tkinter import messagebox
from typing import Dict, List, Tuple

from .engine import CainoGame, Move
from .cards import Card


class CainoApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Caino")
        self.configure(bg="#7b0000")  # felt
        self.game = CainoGame()
        self.selected_hand_index: int | None = None
        self.moves_for_selected: List[Move] = []
        self.base_font = 16
        # cache of resized images per (card_key, size_key)
        self.images: Dict[Tuple[str, str], tk.PhotoImage] = {}
        self.card_back_original: tk.PhotoImage | None = None
        self.card_back: tk.PhotoImage | None = None
        self.deck_variant_name: str = ""

        # Layout frames
        self.top_frame = tk.Frame(self, bg="#7b0000")
        self.board_frame = tk.Frame(self, bg="#7b0000")
        self.bottom_frame = tk.Frame(self, bg="#7b0000")
        self.controls = tk.Frame(self, bg="#550000")
        self.status = tk.Label(self, text="", bg="#330000", fg="white")

        self.top_frame.pack(padx=10, pady=10)
        self.board_frame.pack(padx=10, pady=10)
        self.bottom_frame.pack(padx=10, pady=10)
        self.controls.pack(fill="x", padx=10, pady=5)
        # Status bar and quick actions
        status_row = tk.Frame(self, bg="#330000")
        status_row.pack(fill="x")
        self.status.pack(in_=status_row, side="left", padx=8, pady=2)
        tk.Button(status_row, text="New Deal", command=self.start_next_hand).pack(side="right", padx=8, pady=2)

        # Try to maximize and bind resize to scale UI
        try:
            self.state('zoomed')
        except Exception:
            pass
        self.bind('<Configure>', self._on_resize)

        # Pick a random deck back from provided path options
        self._init_deck_back()
        self.render()

    # ---------- Assets ----------
    @staticmethod
    def _cards_root_paths() -> List[Tuple[str, int]]:
        # Return candidate card face directories and an inferred size priority (smaller first)
        roots: List[Tuple[str, int]] = []
        base1 = "Assets/Cards take 2/kenney_playing-cards-pack/PNG"
        for sub, pri in [("Cards (small)", 0), ("Cards (medium)", 1), ("Cards (large)", 2)]:
            p = os.path.join(base1, sub)
            if os.path.isdir(p):
                roots.append((p, pri))
        return sorted(roots, key=lambda x: x[1])

    def _init_deck_back(self) -> None:
        # Choose a random deck back file from the decks folder
        decks_dir = "Assets/poker_cards_chips_2d/PNGs/decks"
        choices: List[str] = []
        if os.path.isdir(decks_dir):
            for name in os.listdir(decks_dir):
                if name.lower().endswith((".png", ".gif")):
                    choices.append(os.path.join(decks_dir, name))
        if choices:
            path = random.choice(choices)
            try:
                self.card_back_original = tk.PhotoImage(file=path)
                self.card_back = None
                self.deck_variant_name = os.path.basename(path)
            except Exception:
                self.card_back_original = None
                self.card_back = None
                self.deck_variant_name = ""
        else:
            self.card_back_original = None
            self.card_back = None
            self.deck_variant_name = ""

    def _card_face_path(self, card: Card) -> str | None:
        # Map our Card to a filename in the Kenney pack using suit initial + rank
        # Kenney names often look like: club_2.png, heart_A.png, spade_J.png etc.
        suit_map = {"♠": "spade", "♥": "heart", "♦": "diamond", "♣": "club"}
        rank = card.rank
        # Normalize ranks that may appear as letters/numbers
        rank_token = rank
        # Try several naming patterns
        candidates: List[str] = []
        for root, _pri in self._cards_root_paths():
            # common patterns
            candidates.extend([
                os.path.join(root, f"{suit_map[card.suit]}_{rank_token}.png"),
                os.path.join(root, f"{suit_map[card.suit]}-{rank_token}.png"),
                os.path.join(root, f"card_{suit_map[card.suit]}_{rank_token}.png"),
            ])
        for path in candidates:
            if os.path.isfile(path):
                return path
        return None

    def _current_size_key(self) -> str:
        h = max(600, self.winfo_height())
        ch = int(h * 0.14)
        ch = max(60, min(240, (ch // 10) * 10))
        return f"h{ch}"

    def _resize_photo(self, img: tk.PhotoImage, target_h: int) -> tk.PhotoImage:
        orig_h = img.height()
        if orig_h == target_h:
            return img
        if target_h < orig_h:
            factor = max(1, int(round(orig_h / target_h)))
            return img.subsample(factor, factor)
        factor = max(1, int(round(target_h / orig_h)))
        factor = min(factor, 3)
        return img.zoom(factor, factor)

    def _get_image_for_card(self, card: Card) -> tk.PhotoImage | None:
        key = f"{card.rank}{card.suit}"
        size_key = self._current_size_key()
        cache_key = (key, size_key)
        if cache_key in self.images:
            return self.images[cache_key]
        path = self._card_face_path(card)
        if path is None:
            return None
        try:
            base = tk.PhotoImage(file=path)
            target_h = int(size_key[1:])
            img = self._resize_photo(base, target_h)
        except Exception:
            return None
        self.images[cache_key] = img
        return img

    def _on_resize(self, event: tk.Event) -> None:
        h = max(600, self.winfo_height())
        # 3% of height, clamped
        self.base_font = max(14, min(36, int(h * 0.03)))
        # re-render to apply sizes
        self.after_idle(self.render)

    def f(self, scale: float = 1.0) -> dict:
        """Return Tk font kwargs scaled by a factor."""
        return {"font": ("TkDefaultFont", max(10, int(self.base_font * scale)))}

    def render(self) -> None:
        # Auto-correct: if something went wrong and no cards are visible at start, force a new deal
        try:
            needs_deal = (
                len(self.game.players[0].hand) < 1 or
                len(self.game.players[1].hand) < 1 or
                len(self.game.board) < 1
            ) and (len(self.game.deck) > 0)
            if needs_deal:
                self.game = CainoGame()
                # After fresh game, if still no board due to unusual state, put 4 random from deck to board
                if len(self.game.board) < 1 and len(self.game.deck) >= 4:
                    self.game.board.extend(self.game.deck.deal(4))
                # Ensure each player has at least one card
                for p in (0, 1):
                    if not self.game.players[p].hand and len(self.game.deck) > 0:
                        self.game.players[p].hand.extend(self.game.deck.deal(1))
                # re-render now that we have content
                # Fall through to draw widgets
        except Exception:
            # if any unexpected error, try to reset and continue
            self.game = CainoGame()

        for f in (self.top_frame, self.board_frame, self.bottom_frame, self.controls):
            for w in list(f.winfo_children()):
                w.destroy()

        # Opponent (face-down backs, not showing faces)
        opp_count = len(self.game.players[1].hand)
        tk.Label(self.top_frame, text="Opponent:", bg="#7b0000", fg="white", **self.f(1.0)).pack(anchor="w")
        orow = tk.Frame(self.top_frame, bg="#7b0000")
        orow.pack()
        for _ in range(opp_count):
            if self.card_back is not None:
                tk.Label(orow, image=self.card_back, bg="#7b0000").pack(side="left", padx=5)
            else:
                tk.Label(orow, text="🂠", bg="#1e1e1e", fg="white", padx=12, pady=10, **self.f(1.2)).pack(side="left", padx=5)

        # Board
        top_board = tk.Frame(self.board_frame, bg="#7b0000")
        top_board.pack(fill="x")
        # Deck area to the left
        deck_area = tk.Frame(top_board, bg="#7b0000")
        deck_area.pack(side="left", padx=10)
        tk.Label(deck_area, text="Deck:", bg="#7b0000", fg="white", **self.f(0.9)).pack(anchor="w")
        # Ensure card back scaled to current size
        if self.card_back_original is not None:
            size_key = self._current_size_key()
            target_h = int(size_key[1:])
            self.card_back = self._resize_photo(self.card_back_original, target_h)
            tk.Label(deck_area, image=self.card_back, bg="#7b0000").pack()
        else:
            tk.Label(deck_area, text="🂠", bg="#1e1e1e", fg="white", padx=10, pady=8, **self.f(1.1)).pack()

        # Board label and row
        tk.Label(top_board, text="Board:", bg="#7b0000", fg="white", **self.f(1.0)).pack(anchor="n", side="left", padx=12)
        brow = tk.Frame(top_board, bg="#7b0000")
        brow.pack()
        for c in self.game.board:
            img = self._get_image_for_card(c)
            if img is not None:
                tk.Label(brow, image=img, bg="#7b0000").pack(side="left", padx=6)
            else:
                tk.Label(brow, text=str(c), bg="#226622", fg="white", padx=14, pady=10, **self.f(1.2)).pack(side="left", padx=6)

        # Builds
        if self.game.builds:
            brow2 = tk.Frame(self.board_frame, bg="#7b0000")
            brow2.pack(pady=6)
            for b in self.game.builds:
                tk.Label(brow2, text=str(b), bg="#444444", fg="white", padx=6, pady=4).pack(side="left", padx=3)

        # Player hand
        tk.Label(self.bottom_frame, text="Your Hand:", bg="#7b0000", fg="white", **self.f(1.0)).pack(anchor="w")
        hrow = tk.Frame(self.bottom_frame, bg="#7b0000")
        hrow.pack()
        for i, c in enumerate(self.game.players[0].hand):
            img = self._get_image_for_card(c)
            if img is not None:
                btn = tk.Button(hrow, image=img, command=lambda i=i: self.select_card(i))
            else:
                btn = tk.Button(hrow, text=str(c), command=lambda i=i: self.select_card(i), **self.f(1.3))
            btn.pack(side="left", padx=8, pady=6)

        # Controls
        if self.selected_hand_index is not None:
            sel_card = self.game.players[0].hand[self.selected_hand_index]
            tk.Label(self.controls, text=f"Selected {sel_card}", bg="#550000", fg="white", **self.f(1.0)).pack(side="left", padx=6)
            # Show categorized buttons
            cap = [m for m in self.moves_for_selected if m.type == "capture"]
            bld = [m for m in self.moves_for_selected if m.type == "build"]
            dsc = [m for m in self.moves_for_selected if m.type == "discard"]
            if cap:
                tk.Button(self.controls, text=f"Capture ({len(cap)})", command=lambda: self.pick_move(cap), **self.f(1.0)).pack(side="left", padx=4)
            if bld:
                tk.Button(self.controls, text=f"Build ({len(bld)})", command=lambda: self.pick_move(bld), **self.f(1.0)).pack(side="left", padx=4)
            if dsc:
                tk.Button(self.controls, text="Discard", command=lambda: self.apply_move(dsc[0]), **self.f(1.0)).pack(side="left", padx=4)

        # Minimal status: turn + last action + quick counts
        counts = f"P1:{len(self.game.players[0].hand)} P2:{len(self.game.players[1].hand)} Board:{len(self.game.board)}"
        last = self.game.last_action or "-"
        self.status.config(text=f"Turn: P{self.game.turn+1} | {counts} | Last: {last}")

        # End of round check -> dedicated scoring screen (only when truly over)
        if self.game._round_over():
            self.show_scoring()

    def select_card(self, index: int) -> None:
        if self.game.turn != 0:
            return
        self.selected_hand_index = index
        # Filter moves for this selection
        ms = [m for m in self.game.legal_moves(0) if m.hand_index == index]
        self.moves_for_selected = ms
        self.render()

    def pick_move(self, options: List[Move]) -> None:
        # If multiple options, open a simple chooser window
        if len(options) == 1:
            self.apply_move(options[0])
            return
        win = tk.Toplevel(self)
        win.title("Choose Move")
        # Show explicit capture contents when possible
        for m in options:
            tk.Button(win, text=self.describe_move(m), command=lambda m=m: (win.destroy(), self.apply_move(m)), **self.f(1.0)).pack(fill="x", padx=6, pady=4)

    def describe_move(self, m: Move) -> str:
        if m.type == "discard":
            return "Discard"
        if m.type == "build":
            return f"Build => {m.new_target}"
        if m.type == "capture":
            if m.capture_builds:
                return "Capture build"
            if m.capture_loose:
                names = []
                try:
                    names = [str(self.game.board[i]) for i in (m.capture_loose or [])]
                except Exception:
                    names = ["?"]
                return "Capture [" + ", ".join(names) + "]"
        return "?"

    def apply_move(self, m: Move) -> None:
        try:
            self.game.apply_move(0, m)
        except AssertionError as e:
            messagebox.showerror("Illegal Move", str(e))
            return
        self.selected_hand_index = None
        self.moves_for_selected = []

        # Very basic opponent turn using SimpleAI-like priorities inline (avoid import cycle)
        from .ai import SimpleAI

        if not self.game._round_over() and self.game.turn == 1:
            ai = SimpleAI()
            ai_move = ai.choose_move(self.game, 1)
            self.game.apply_move(1, ai_move)
        self.render()

    def show_scoring(self) -> None:
        # Clear frames and show scoring with next-hand button
        for f in (self.top_frame, self.board_frame, self.bottom_frame, self.controls):
            for w in list(f.winfo_children()):
                w.destroy()
        scores, breakdown = self.game.score()
        tk.Label(self.board_frame, text="Round Over", bg="#7b0000", fg="white", **self.f(1.3)).pack(pady=12)
        tk.Label(self.board_frame, text=f"Scores: P1 {scores[0]} - P2 {scores[1]}", bg="#7b0000", fg="white", **self.f(1.1)).pack(pady=8)
        for k in ("aces_p0", "aces_p1", "two_spades", "ten_diamonds", "most_spades", "most_cards"):
            tk.Label(self.board_frame, text=f"{k}: {breakdown.get(k)}", bg="#7b0000", fg="white", **self.f(1.0)).pack()
        tk.Button(self.bottom_frame, text="Start Next Hand", command=self.start_next_hand, **self.f(1.1)).pack(pady=12)

    def start_next_hand(self) -> None:
        self.game = CainoGame()
        self.selected_hand_index = None
        self.moves_for_selected = []
        self.render()


def main() -> None:
    app = CainoApp()
    app.mainloop()


if __name__ == "__main__":
    main()
