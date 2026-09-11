import { expect, test } from '@playwright/test';
import { createMatch } from '../../src/games/capture11/game';

// Find real opening deals, keeping the production UI and dealing path intact.
function opening(ranks: string[]) {
  for (let seed = 0; seed < 100_000; seed++) {
    const state = createMatch(seed);
    const played = state.players.player1.hand.find(card => card.rank === '8');
    const loose = state.board.flatMap(item => item.kind === 'loose' ? [item.card] : []);
    const selected = ranks.map(rank => {
      const index = loose.findIndex(card => card.rank === rank);
      return index < 0 ? undefined : loose.splice(index, 1)[0];
    });
    if (played && selected.every(card => card !== undefined)) return { seed, played, selected };
  }
  throw new Error(`No opening deal for ${ranks.join(' + ')}`);
}

for (const ranks of [['8', '8'], ['8', '3', '5']]) {
  const fixture = opening(ranks);
  test(`BUG-004: played 8 captures ${ranks.join(' + ')} as independent groups`, async ({ page }, testInfo) => {
    await page.addInitScript(seed => { Date.now = () => seed; }, fixture.seed);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play vs CPU' }).click();
    const name = (card: { rank: string; suit: string }) => `${card.rank} of ${card.suit[0]!.toUpperCase()}${card.suit.slice(1)}`;
    await page.getByRole('button', { name: `${name(fixture.played)} in your hand` }).click();
    for (const card of fixture.selected) {
      await page.getByRole('button', { name: `${name(card!)} on board` }).click();
    }
    const action = page.getByRole('button', { name: `Capture ${ranks.length} board cards`, exact: true });
    await action.scrollIntoViewIfNeeded();
    await expect(action).toBeInViewport();
    await expect(page.locator('.board-card.selected')).toHaveCount(ranks.length);
    await page.screenshot({ path: testInfo.outputPath('capture-ready.png') });
    await action.click();
    await expect(page.getByRole('heading', { name: new RegExp(`YOUR HAND .* ${ranks.length + 1} captured`) })).toBeVisible();
    for (const card of fixture.selected) {
      await expect(page.getByRole('button', { name: `${name(card!)} on board` })).toHaveCount(0);
    }
    await expect(page.locator('.hand-card')).toHaveCount(3);
    await expect(page.locator('.hand-card').first()).toBeDisabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}
