import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function clickMove(page: Page, hand: string, board: string[], action: string) {
  await page.getByRole('button', { name: `${hand} in your hand` }).click();
  for (const name of board) await page.getByRole('button', { name: `${name} on board` }).click();
  const button = page.getByRole('button', { name: new RegExp(`^${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) });
  await button.scrollIntoViewIfNeeded(); await expect(button).toHaveClass(/scenario-suggested/); await button.click();
}

test('Guided Demo runs all six real moves including BUG-004 and final scoring', async ({ page }, testInfo) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Guided Demo' }).click();
  await expect(page.getByRole('heading', { name: '1 of 6 · Basic Capture' })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
  await clickMove(page, '4 of Spades', ['4 of Hearts'], 'Capture 1 board card');
  await expect(page.getByText('✓ Scene complete')).toBeVisible(); await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.getByRole('heading', { name: '2 of 6 · Multiple Equal Cards' })).toBeVisible();
  await clickMove(page, '8 of Spades', ['8 of Hearts', '8 of Diamonds'], 'Capture 2 board cards');
  await expect(page.getByText(/Both loose 8s were captured/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /YOUR HAND .* 3 captured/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('bug-004-complete.png'), fullPage: false });
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await clickMove(page, 'A of Hearts', ['4 of Clubs'], 'Build 5');
  await expect(page.getByRole('button', { name: /5 build, open, You/ })).toBeVisible();
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await page.getByRole('button', { name: '3 of Diamonds in your hand' }).click();
  await page.getByRole('button', { name: /5 build, open, CPU/ }).click();
  const takeover = page.getByRole('button', { name: /^Burn build → 8/ });
  await expect(takeover).toHaveClass(/scenario-suggested/); await takeover.click();
  await expect(page.getByRole('button', { name: /8 build, open, You/ })).toBeVisible();
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await clickMove(page, '10 of Spades', ['10 of Diamonds', '9 of Hearts', 'A of Clubs'], 'Capture 3 board cards');
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await clickMove(page, '4 of Spades', ['4 of Hearts'], 'Capture 1 board card');
  await expect(page.getByRole('heading', { name: 'Hand 1 complete' })).toBeVisible();
  await expect(page.getByText('Cards captured: 9–4. Spades: 5–0.')).toBeVisible();
  await expect(page.getByText(/Your 8 points: Aces 1, 2♠ 1, most spades 1, most cards 2, 10♦ 3/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('final-sweep-score.png'), fullPage: false });
  await page.getByRole('button', { name: 'Finish Demo' }).click();
  await expect(page.getByRole('button', { name: 'Play vs CPU' })).toBeVisible();
});

test('Guided Demo remains width-contained and reachable at 150% phone text', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click(); await page.getByLabel('Text size').selectOption('1.5');
  await page.getByRole('button', { name: 'Back' }).click(); await page.getByRole('button', { name: 'Guided Demo' }).click();
  await expect(page.getByRole('region', { name: 'Guided Demo instructions' })).toBeVisible();
  const hand = page.getByRole('button', { name: '4 of Spades in your hand' }); await hand.scrollIntoViewIfNeeded(); await expect(hand).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
});

test('Replay resets a scene and Exit Demo starts no normal-game state', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Guided Demo' }).click();
  await page.getByRole('button', { name: '4 of Spades in your hand' }).click();
  await page.getByRole('button', { name: 'Replay Scene' }).click();
  await expect(page.getByRole('button', { name: '4 of Spades in your hand' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Exit Demo' }).click();
  await page.getByRole('button', { name: 'Play vs CPU' }).click();
  await expect(page.getByRole('region', { name: 'Guided Demo instructions' })).toHaveCount(0);
  await expect(page.locator('.hand-card')).toHaveCount(4);
  await expect(page.locator('.scenario-suggested')).toHaveCount(0);
});
