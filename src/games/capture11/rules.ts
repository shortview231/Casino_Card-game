import type { Card, LooseBoardCard, NumericBuild } from './model';
import { numericBuildValue } from './model';

function holdsNumericTarget(hand: readonly Card[], target: number): boolean {
  return hand.some((card) => numericBuildValue(card) === target);
}

export function canCaptureLooseSelection(
  playedCard: Card,
  selected: readonly LooseBoardCard[],
): boolean {
  if (selected.length === 0) return false;

  const playedValue = numericBuildValue(playedCard);
  if (playedValue === null) {
    return selected.length === 1 && selected[0]!.card.rank === playedCard.rank;
  }

  const values = selected.map((item) => numericBuildValue(item.card));
  if (values.some((value) => value === null)) return false;
  return (values as number[]).reduce((sum, value) => sum + value, 0) === playedValue;
}

export function canCreateOpenBuild(
  playedCard: Card,
  selectedLooseCards: readonly LooseBoardCard[],
  remainingHand: readonly Card[],
  declaredTarget: number,
): boolean {
  if (selectedLooseCards.length === 0) return false;
  if (!Number.isInteger(declaredTarget) || declaredTarget < 1 || declaredTarget > 10) return false;
  if (!holdsNumericTarget(remainingHand, declaredTarget)) return false;

  const playedValue = numericBuildValue(playedCard);
  if (playedValue === null) return false;

  const boardValues = selectedLooseCards.map((item) => numericBuildValue(item.card));
  if (boardValues.some((value) => value === null)) return false;

  const total = playedValue + (boardValues as number[]).reduce((sum, value) => sum + value, 0);
  return total === declaredTarget;
}

export function canRaiseOpenBuild(
  playedCard: Card,
  build: NumericBuild,
  remainingHand: readonly Card[],
  declaredTarget: number,
): boolean {
  if (build.mode !== 'open') return false;
  if (!Number.isInteger(declaredTarget) || declaredTarget < 1 || declaredTarget > 10) return false;
  if (!holdsNumericTarget(remainingHand, declaredTarget)) return false;

  const playedValue = numericBuildValue(playedCard);
  if (playedValue === null) return false;
  return build.target + playedValue === declaredTarget;
}

export function canCreatePairedBuild(
  playedCard: Card,
  boardCard: LooseBoardCard,
  remainingHand: readonly Card[],
): boolean {
  const playedValue = numericBuildValue(playedCard);
  const boardValue = numericBuildValue(boardCard.card);
  if (playedValue === null || boardValue === null) return false;
  if (playedValue !== boardValue) return false;
  return holdsNumericTarget(remainingHand, playedValue);
}

export function canCaptureBuild(playedCard: Card, build: NumericBuild): boolean {
  const playedValue = numericBuildValue(playedCard);
  return playedValue !== null && playedValue === build.target;
}
