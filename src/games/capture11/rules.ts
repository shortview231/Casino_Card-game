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

function canPartitionIntoTargetGroups(values: readonly number[], target: number, minimumGroups: number): boolean {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total < target * minimumGroups || total % target !== 0 || values.some((value) => value > target)) return false;

  const groupCount = total / target;
  const groups = Array.from({ length: groupCount }, () => 0);
  const sorted = [...values].sort((a, b) => b - a);

  const place = (index: number): boolean => {
    if (index === sorted.length) return groups.every((sum) => sum === target);
    const value = sorted[index]!;
    const attemptedSums = new Set<number>();
    for (let group = 0; group < groups.length; group += 1) {
      const current = groups[group]!;
      if (attemptedSums.has(current) || current + value > target) continue;
      attemptedSums.add(current);
      groups[group] = current + value;
      if (place(index + 1)) return true;
      groups[group] = current;
    }
    return false;
  };

  return place(0);
}

export function canCreatePairedBuild(
  playedCard: Card,
  selectedLooseCards: readonly LooseBoardCard[],
  remainingHand: readonly Card[],
  declaredTarget: number,
): boolean {
  if (!Number.isInteger(declaredTarget) || declaredTarget < 1 || declaredTarget > 10) return false;
  if (!holdsNumericTarget(remainingHand, declaredTarget)) return false;

  const values = [playedCard, ...selectedLooseCards.map((item) => item.card)].map(numericBuildValue);
  if (values.some((value) => value === null)) return false;
  return canPartitionIntoTargetGroups(values as number[], declaredTarget, 2);
}

export function canExtendPairedBuild(
  playedCard: Card,
  selectedLooseCards: readonly LooseBoardCard[],
  build: NumericBuild,
  remainingHand: readonly Card[],
): boolean {
  if (!holdsNumericTarget(remainingHand, build.target)) return false;
  const values = [playedCard, ...selectedLooseCards.map((item) => item.card)].map(numericBuildValue);
  if (values.some((value) => value === null)) return false;
  return (values as number[]).reduce((sum, value) => sum + value, 0) === build.target;
}

export function canCaptureBuild(playedCard: Card, build: NumericBuild): boolean {
  const playedValue = numericBuildValue(playedCard);
  return playedValue !== null && playedValue === build.target;
}

export function canCaptureCombinedSelection(
  playedCard: Card,
  selectedBuilds: readonly NumericBuild[],
  selectedLooseCards: readonly LooseBoardCard[],
): boolean {
  const playedValue = numericBuildValue(playedCard);
  if (playedValue === null || selectedBuilds.length === 0 || selectedLooseCards.length === 0) return false;
  if (selectedBuilds.some((build) => build.target !== playedValue)) return false;

  const looseValues = selectedLooseCards.map((item) => numericBuildValue(item.card));
  if (looseValues.some((value) => value === null)) return false;
  return canPartitionIntoTargetGroups(looseValues as number[], playedValue, 1);
}
