from __future__ import annotations

"""Core engine for the Caino card game.

Enforces dealing, legal moves, builds, captures, scoring, and turn flow.
UI layers call `apply_move` with a validated Move; the engine mutates state.
"""

from dataclasses import dataclass, field
from typing import Dict, Iterable, List, Literal, Optional, Sequence, Tuple

from .cards import Card, Deck
from .rules import POINTS_CONFIG


MoveType = Literal["discard", "build", "capture"]


@dataclass(slots=True)
class Build:
    target: int
    cards: List[Card]
    owner: int  # 0 or 1 - player index

    def __str__(self) -> str:  # pragma: no cover - trivial
        parts = " + ".join(str(c) for c in self.cards)
        return f"[{parts} => {self.target} (P{self.owner+1})]"


@dataclass(slots=True)
class PlayerState:
    hand: List[Card] = field(default_factory=list)
    pile: List[Card] = field(default_factory=list)


@dataclass(slots=True)
class Move:
    """A move instruction from a player.

    For discard: type="discard", hand_index
    For build:   type="build", hand_index, select_loose (indices into board loose cards), new_target (int)
    For capture: type="capture", hand_index, capture_loose (indices into board loose cards) or capture_builds (indices into builds). Only one mode allowed per move.
    """

    type: MoveType
    hand_index: int
    select_loose: Optional[List[int]] = None
    new_target: Optional[int] = None
    capture_loose: Optional[List[int]] = None
    capture_builds: Optional[List[int]] = None


class CainoGame:
    """Caino core game state and rules."""

    def __init__(self, *, seed: Optional[int] = None) -> None:
        self.deck = Deck(seed=seed)
        self.players = [PlayerState(), PlayerState()]
        self.board: List[Card] = []
        self.builds: List[Build] = []
        self.turn: int = 0  # player index 0 or 1
        self.last_captor: Optional[int] = None
        self.last_action: str = ""  # brief description of last move applied

        # Opening deal: 4 to each player and 4 to board (defensive against short deck)
        for _ in range(4):
            for p in (0, 1):
                dealt = self.deck.deal(1)
                if dealt:
                    self.players[p].hand.append(dealt[0])
        self.board.extend(self.deck.deal(4))

    # --------- Helpers ---------
    @staticmethod
    def _card_value(card: Card) -> int:
        return card.value

    def _ensure_refill_if_needed(self) -> None:
        if not self.players[0].hand and not self.players[1].hand and len(self.deck) > 0:
            # deal 4 to each player, not to board
            for _ in range(4):
                for p in (0, 1):
                    dealt = self.deck.deal(1)
                    if dealt:
                        self.players[p].hand.append(dealt[0])

    def _round_over(self) -> bool:
        return len(self.deck) == 0 and not self.players[0].hand and not self.players[1].hand

    # --------- Legal move generation ---------
    def legal_moves(self, player: int) -> List[Move]:
        assert player in (0, 1)
        moves: List[Move] = []
        hand = self.players[player].hand

        # Index lists for loose board cards
        loose_cards = list(enumerate(self.board))

        # Build capture opportunities by target value
        builds_by_target: Dict[int, List[int]] = {}
        for i, b in enumerate(self.builds):
            builds_by_target.setdefault(b.target, []).append(i)

        def subsets_sum_to(indices: List[int], target: int) -> List[List[int]]:
            # small board ⇒ simple power set search; prune by sum
            best: List[List[int]] = []
            n = len(indices)
            for mask in range(1, 1 << n):
                sels: List[int] = []
                s = 0
                for j in range(n):
                    if mask & (1 << j):
                        idx = indices[j]
                        s += self.board[idx].value
                        if s > target:
                            break
                        sels.append(idx)
                if s == target:
                    best.append(sorted(sels))
            # Deduplicate selections
            uniq = []
            seen = set()
            for sel in best:
                tup = tuple(sel)
                if tup not in seen:
                    seen.add(tup)
                    uniq.append(sel)
            return uniq

        for h_i, hcard in enumerate(hand):
            hv = hcard.value

            # Capture a build (any number of builds whose target equals hv). Restrict to one build per rules simplification.
            if hv in builds_by_target:
                for bidx in builds_by_target[hv]:
                    moves.append(Move(type="capture", hand_index=h_i, capture_builds=[bidx]))

            # Capture loose: equal-value cards (allow capturing any number of equal cards at once)
            equal_indices = [i for i, c in loose_cards if c.value == hv]
            if equal_indices:
                # One move that takes all equal cards at once (fast play default)
                moves.append(Move(type="capture", hand_index=h_i, capture_loose=sorted(equal_indices)))
                # Also allow single-card equal capture as an option
                for idx in equal_indices:
                    moves.append(Move(type="capture", hand_index=h_i, capture_loose=[idx]))

            # Capture loose: sum equals (combinations of loose cards that sum to hv)
            loose_indices = [i for i, _ in loose_cards]
            for sel in subsets_sum_to(loose_indices, hv):
                if len(sel) > 1:
                    moves.append(Move(type="capture", hand_index=h_i, capture_loose=sel))

            # Build moves: create or extend
            # To create/extend a build to target T, player must hold another card with value T (not the build card itself)
            # We only allow using loose board cards (by indices) plus the selected hand card to define the build.
            # You must hold a separate card of value target (could be another copy in hand).
            # Allow extending opponent build to higher target if you also hold that target value.
            # We propose possible targets from sums of hand card with combinations of loose board cards.
            indices = [i for i, _ in loose_cards]
            # include empty selection to allow building solely from hand? No, must combine with at least one loose card per rules.
            for mask in range(1, 1 << len(indices)):
                sel: List[int] = []
                total = hcard.value
                for j in range(len(indices)):
                    if mask & (1 << j):
                        idx = indices[j]
                        total += self.board[idx].value
                        sel.append(idx)
                # Target must be supported by another card of same value in hand (not h_i)
                if any(k != h_i and hand[k].value == total for k in range(len(hand))):
                    moves.append(Move(type="build", hand_index=h_i, select_loose=sorted(sel), new_target=total))

            # Extend existing builds: replace target with higher total using hcard and possibly loose cards
            for b_i, b in enumerate(self.builds):
                # cannot reduce target; must increase
                indices = [i for i, _ in loose_cards]
                for mask in range(0, 1 << len(indices)):
                    sel: List[int] = []
                    total = hcard.value + sum(self.board[indices[j]].value for j in range(len(indices)) if mask & (1 << j)) + sum(c.value for c in b.cards)
                    if total > b.target and any(k != h_i and hand[k].value == total for k in range(len(hand))):
                        # Represent as building with selected loose plus (implicitly) the existing build cards
                        moves.append(Move(type="build", hand_index=h_i, select_loose=sorted([indices[j] for j in range(len(indices)) if mask & (1 << j)]), new_target=total))

            # Always can discard
            moves.append(Move(type="discard", hand_index=h_i))

        return moves

    # --------- Apply moves ---------
    def apply_move(self, player: int, move: Move) -> None:
        assert player == self.turn, "Not your turn"
        hand = self.players[player].hand
        assert 0 <= move.hand_index < len(hand)
        card = hand.pop(move.hand_index)

        def end_turn(captured: bool, action_text: str) -> None:
            self.last_action = action_text
            if captured:
                self.last_captor = player
            self.turn = 1 - self.turn
            # refill if needed
            self._ensure_refill_if_needed()
            # if round ends, collect remainder to last captor
            if self._round_over() and self.last_captor is not None and (self.board or self.builds):
                cap_pile = self.players[self.last_captor].pile
                cap_pile.extend(self.board)
                for b in self.builds:
                    cap_pile.extend(b.cards)
                self.board.clear()
                self.builds.clear()

        if move.type == "discard":
            self.board.append(card)
            end_turn(False, f"P{player+1} discarded {card}")
            return

        if move.type == "capture":
            captured_cards: List[Card] = []
            if move.capture_builds is not None:
                # capture exactly one build for simplicity
                assert len(move.capture_builds) == 1
                bidx = move.capture_builds[0]
                assert 0 <= bidx < len(self.builds)
                b = self.builds[bidx]
                assert card.value == b.target, "Must match build target"
                captured_cards.extend(b.cards)
                del self.builds[bidx]
                action = f"P{player+1} captured build =>{b.target} with {card}"
            elif move.capture_loose is not None:
                # capture a single loose card equal value OR a set summing to value
                sel = sorted(move.capture_loose)
                assert sel, "Empty capture selection"
                s = sum(self.board[i].value for i in sel)
                assert s == card.value, "Capture selection must equal hand card value"
                # collect selected in descending index order for safe removal
                picked = [self.board[i] for i in sel]
                for idx in sorted(sel, reverse=True):
                    captured_cards.append(self.board.pop(idx))
                action = f"P{player+1} captured {', '.join(str(c) for c in picked)} with {card}"
            else:
                raise AssertionError("Capture move missing selection")

            # Hand card also to pile
            pile = self.players[player].pile
            pile.extend(captured_cards)
            pile.append(card)
            end_turn(True, action)
            return

        if move.type == "build":
            sel = sorted(move.select_loose or [])
            assert sel, "Build must include at least one loose card"
            assert move.new_target is not None and move.new_target > 0
            target = move.new_target

            # Must hold another card of value == target (besides played card)
            if not any(i != move.hand_index and h.value == target for i, h in enumerate(hand)):
                raise AssertionError("Must hold a separate card matching build target")

            # Validate selected loose indices are unique and in range
            assert all(0 <= i < len(self.board) for i in sel)
            assert len(set(sel)) == len(sel)

            # Determine if this is an extension of an existing build (if selected cards imply using build cards)
            used_cards = [self.board[i] for i in sel] + [card]
            # Remove selected loose from board
            selected_cards = [self.board[i] for i in sel]
            for idx in sorted(sel, reverse=True):
                self.board.pop(idx)

            # Place/extend build
            self.builds.append(Build(target=target, cards=selected_cards + [card], owner=player))
            used = " + ".join(str(c) for c in selected_cards + [card])
            end_turn(False, f"P{player+1} built [{used} => {target}]")
            return

        raise AssertionError("Unknown move type")

    # --------- Scoring ---------
    def score(self) -> Tuple[List[int], Dict[str, int]]:
        """Compute scores and a breakdown dictionary keys sum to 11.

        Returns (scores_by_player, breakdown) where breakdown includes keys:
        - aces_p0, aces_p1
        - two_spades (player index)
        - ten_diamonds (player index)
        - most_spades (player index or -1 if tie)
        - most_cards (player index or -1 if tie)
        """

        cfg = POINTS_CONFIG
        piles = [self.players[0].pile, self.players[1].pile]

        def count_aces(cards: Iterable[Card]) -> int:
            return sum(1 for c in cards if c.rank == "A")

        aces = [count_aces(piles[0]), count_aces(piles[1])]
        spades = [sum(1 for c in piles[0] if c.suit == "♠"), sum(1 for c in piles[1] if c.suit == "♠")]
        total_cards = [len(piles[0]), len(piles[1])]

        def who_has(card: Tuple[str, str]) -> int | None:
            rank, suit = card
            for i, pile in enumerate(piles):
                if any(c.rank == rank and c.suit == suit for c in pile):
                    return i
            return None

        p_two = who_has(("2", "♠"))
        p_ten = who_has(("10", "♦"))

        scores = [0, 0]
        breakdown: Dict[str, int] = {}

        scores[0] += aces[0] * cfg.ace
        scores[1] += aces[1] * cfg.ace
        breakdown["aces_p0"] = aces[0]
        breakdown["aces_p1"] = aces[1]

        if p_two is not None:
            scores[p_two] += cfg.two_spades
            breakdown["two_spades"] = p_two
        else:
            breakdown["two_spades"] = -1

        if p_ten is not None:
            scores[p_ten] += cfg.ten_diamonds
            breakdown["ten_diamonds"] = p_ten
        else:
            breakdown["ten_diamonds"] = -1

        # Most spades
        if spades[0] > spades[1]:
            scores[0] += cfg.most_spades
            breakdown["most_spades"] = 0
        elif spades[1] > spades[0]:
            scores[1] += cfg.most_spades
            breakdown["most_spades"] = 1
        else:
            breakdown["most_spades"] = -1

        # Most cards
        if total_cards[0] > total_cards[1]:
            scores[0] += cfg.most_cards
            breakdown["most_cards"] = 0
        elif total_cards[1] > total_cards[0]:
            scores[1] += cfg.most_cards
            breakdown["most_cards"] = 1
        else:
            breakdown["most_cards"] = -1

        return scores, breakdown

    # --------- Debug summary ---------
    def state_summary(self) -> str:
        def cards_str(cards: Sequence[Card]) -> str:
            return " ".join(str(c) for c in cards) or "-"

        b_str = " ".join(str(c) for c in self.board) or "-"
        builds = ", ".join(str(b) for b in self.builds) or "-"
        return (
            f"Turn:P{self.turn+1} | P1 hand:{cards_str(self.players[0].hand)} | P2 hand:{cards_str(self.players[1].hand)}\n"
            f"Board:{b_str} | Builds:{builds}\n"
            f"P1 pile:{cards_str(self.players[0].pile)} | P2 pile:{cards_str(self.players[1].pile)}\n"
            f"Deck:{len(self.deck)} | Last cap:{'-' if self.last_captor is None else 'P'+str(self.last_captor+1)}\n"
            f"Last action: {self.last_action or '-'}"
        )
