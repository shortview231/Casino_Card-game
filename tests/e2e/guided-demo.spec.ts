import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function clickMove(page: Page, hand: string, board: string[], action: string) {
  const played = page.getByRole('button', { name: `${hand} in your hand` });
  await expect(played).toBeVisible(); await expect(played).toBeEnabled();
  if ((page.viewportSize()?.width ?? 0) >= 1024) await expect(played).toBeInViewport({ ratio: 0.99 });
  await played.click();
  for (const name of board) await page.getByRole('button', { name: `${name} on board` }).click();
  const button = page.getByRole('button', { name: new RegExp(`^${action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) });
  await button.scrollIntoViewIfNeeded(); await expect(button).toHaveClass(/scenario-suggested/); await button.click();
}

test('Guided Demo runs all seven real moves including BUG-004, final scoring, and multi-build capture', async ({ page }, testInfo) => {
  if (testInfo.project.name === 'chromium') await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/'); await page.getByRole('button', { name: 'Guided Demo' }).click();
  await expect(page.getByRole('heading', { name: '1 of 7 · Basic Capture' })).toBeVisible();
  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  const openingCard = page.getByRole('button', { name: '4 of Spades in your hand' });
  if (testInfo.project.name === 'chromium') await expect(openingCard).toBeInViewport(); else await openingCard.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('scene-1-staged.png'), fullPage: false });
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter(violation => violation.impact === 'serious' || violation.impact === 'critical')).toEqual([]);
  await clickMove(page, '4 of Spades', ['4 of Hearts'], 'Capture 1 board card');
  await expect(page.locator('.scenario-panel:visible').getByText('✓ Scene complete')).toBeVisible(); await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.getByRole('heading', { name: '2 of 7 · Multiple Equal Cards' })).toBeVisible();
  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  await clickMove(page, '8 of Spades', ['8 of Hearts', '8 of Diamonds'], 'Capture 2 board cards');
  await expect(page.locator('.scenario-panel:visible').getByText(/Both loose 8s were captured/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /YOUR HAND .* 3 captured/ })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('bug-004-complete.png'), fullPage: false });
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  await clickMove(page, 'A of Hearts', ['4 of Clubs'], 'Build 5');
  await expect(page.getByRole('button', { name: /5 build, open, You/ })).toBeVisible();
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  const takeoverCard = page.getByRole('button', { name: '3 of Diamonds in your hand' });
  if (testInfo.project.name === 'chromium') await expect(takeoverCard).toBeInViewport({ ratio: 0.99 }); else await takeoverCard.scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('scene-4-takeover-staged.png'), fullPage: false });
  await page.getByRole('button', { name: '3 of Diamonds in your hand' }).click();
  await page.getByRole('button', { name: /5 build, open, CPU/ }).click();
  const takeover = page.getByRole('button', { name: /^Burn build → 8/ });
  await expect(takeover).toHaveClass(/scenario-suggested/); await takeover.click();
  await expect(page.getByRole('button', { name: /8 build, open, You/ })).toBeVisible();
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  await clickMove(page, '10 of Spades', ['10 of Diamonds', '9 of Hearts', 'A of Clubs'], 'Capture 3 board cards');
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.locator('.hand-card')).toHaveCount(1); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(0);
  await clickMove(page, '4 of Spades', ['4 of Hearts'], 'Capture 1 board card');
  await expect(page.getByRole('heading', { name: 'Hand 1 complete' })).toBeVisible();
  await expect(page.getByText('Cards captured: 28–24.')).toBeVisible();
  await expect(page.getByText(/Your \d+ points: Aces \d+, 2♠ \d+, most spades \d+, most cards \d+, 10♦ \d+/)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('final-sweep-score.png'), fullPage: false });
  await page.getByRole('button', { name: 'Next Scene' }).click();

  await expect(page.getByRole('heading', { name: '7 of 7 · Multi-Build Capture' })).toBeVisible();
  await expect(page.locator('.hand-card')).toHaveCount(4); await expect(page.locator('.cpu-hand .card-back')).toHaveCount(4);
  await page.screenshot({ path: testInfo.outputPath('scene-7-multi-build-staged.png'), fullPage: false });
  await page.getByRole('button', { name: '10 of Spades in your hand' }).click();
  await page.getByRole('button', { name: /10 build, open, You/ }).click();
  await page.getByRole('button', { name: '7 of Diamonds on board' }).click();
  await page.getByRole('button', { name: '3 of Spades on board' }).click();
  const addComponent = page.getByRole('button', { name: /^Add 10 component/ });
  await expect(addComponent).toHaveClass(/scenario-suggested/); await addComponent.click();
  await expect(page.getByRole('button', { name: /10 build, locked, You/ })).toBeVisible();
  await page.getByRole('button', { name: '10 of Spades in your hand' }).click();
  await page.getByRole('button', { name: /10 build, locked, You/ }).click();
  await page.locator('.action-panel:visible').getByRole('button', { name: /^Capture 10 build/ }).click();
  await expect(page.locator('.scenario-panel:visible').getByText(/complete multi-component BUILD 10/i)).toBeVisible();
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
