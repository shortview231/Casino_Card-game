import type { Card, LooseBoardCard, NumericBuild } from './model';
import { numericBuildValue } from './model';

function holdsNumericTarget(hand: readonly Card[], target: number): boolean {
  return hand.some((card) => numericBuildValue(card) === target);
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

/** Return a concrete partition for a multi-component build, when one exists. */
export function partitionCardsIntoTargetGroups(cards: readonly Card[], target: number, minimumGroups = 1): Card[][] | null {
  const values = cards.map(numericBuildValue);
  if (values.some((value) => value === null)) return null;
  const numeric = values as number[];
  const total = numeric.reduce((sum, value) => sum + value, 0);
  if (total < target * minimumGroups || total % target !== 0 || numeric.some((value) => value > target)) return null;
  const groupCount = total / target;
  const groups: { cards: Card[]; sum: number }[] = Array.from({ length: groupCount }, () => ({ cards: [], sum: 0 }));
  const ordered = cards.map((card, index) => ({ card, value: numeric[index]! })).sort((a, b) => b.value - a.value);
  const place = (index: number): boolean => {
    if (index === ordered.length) return groups.every((group) => group.sum === target);
    const entry = ordered[index]!;
    const attemptedSums = new Set<number>();
    for (const group of groups) {
      if (attemptedSums.has(group.sum) || group.sum + entry.value > target) continue;
      attemptedSums.add(group.sum); group.cards.push(entry.card); group.sum += entry.value;
      if (place(index + 1)) return true;
      group.sum -= entry.value; group.cards.pop();
    }
    return false;
  };
  return place(0) ? groups.map((group) => [...group.cards]) : null;
}

export function buildComponents(build: NumericBuild): readonly (readonly Card[])[] {
  if (build.components && build.components.length > 0) return build.components;
  return [build.cards];
}

export function canAddBuildComponent(build: NumericBuild, selectedLooseCards: readonly LooseBoardCard[]): boolean {
  if (selectedLooseCards.length === 0) return false;
  const component = selectedLooseCards.map((item) => item.card);
  return partitionCardsIntoTargetGroups(component, build.target, 1)?.length === 1;
}

export function canCaptureLooseSelection(
  playedCard: Card,
  selected: readonly LooseBoardCard[],
): boolean {
  if (selected.length === 0) return false;

  const playedValue = numericBuildValue(playedCard);
  if (playedValue === null) {
    return selected.every(item => item.card.rank === playedCard.rank);
  }

  const values = selected.map((item) => numericBuildValue(item.card));
  if (values.some((value) => value === null)) return false;
  return canPartitionIntoTargetGroups(values as number[], playedValue, 1);
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
  if (build.mode !== 'paired') return false;
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
