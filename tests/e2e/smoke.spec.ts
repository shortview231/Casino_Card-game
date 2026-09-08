import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectViewportWidthContained(page: Page): Promise<void> {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    game: document.querySelector<HTMLElement>('.game-screen')?.scrollWidth ?? 0,
    gameClient: document.querySelector<HTMLElement>('.game-screen')?.clientWidth ?? 0,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport + 1);
  if (widths.gameClient > 0) expect(widths.game).toBeLessThanOrEqual(widths.gameClient + 1);
}

async function expectGameOwnedScrolling(page: Page): Promise<void> {
  const scroller = page.locator('.game-screen');
  const metrics = await scroller.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(metrics.overflowY).toBe('auto');
  expect(metrics.scrollHeight).toBeGreaterThan(metrics.clientHeight);
  await scroller.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
}

test('Capture 11 main menu to first move works with keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Capture 11/i, level: 1 })).toBeVisible();

  const play = page.getByRole('button', { name: 'Play vs CPU' });
  await play.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('region', { name: 'Capture 11 card table' })).toBeVisible();
  await expect(page.locator('.hand-card')).toHaveCount(4);

  const firstCard = page.locator('.hand-card').first();
  await firstCard.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Play selected card to table' })).toBeVisible();

  await page.getByRole('button', { name: 'Play selected card to table' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hand-card').first()).toBeDisabled();
});

test('Capture 11 main-menu routes are functional', async ({ context, page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'How to Play' }).click();
  await expect(page.getByRole('heading', { name: 'How to Play' })).toBeVisible();
  await page.getByRole('button', { name: 'Play vs CPU' }).click();
  await expect(page.getByRole('region', { name: 'Capture 11 card table' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'How to Play' }).click();
  await page.getByRole('button', { name: 'Back to Main Menu' }).click();

  await page.getByRole('button', { name: 'Accessibility' }).click();
  await expect(page.getByRole('heading', { name: 'Accessibility' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Main Menu' }).click();
  await page.getByRole('button', { name: 'Accessibility' }).click();
  await page.getByRole('button', { name: 'Open Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Feedback' }).click();
  await expect(page.getByRole('heading', { name: 'Playtest Feedback' })).toBeVisible();
  await page.getByRole('button', { name: 'Copy Feedback Template' }).click();
  await expect(page.getByRole('button', { name: 'Template Copied' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Main Menu' }).click();

  await page.getByRole('button', { name: 'Quit' }).click();
  await expect(page.getByRole('heading', { name: 'Exit Capture 11' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to Main Menu' }).click();
  await expect(page.getByRole('button', { name: 'Play vs CPU' })).toBeVisible();
});

test('preferences survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Text size').selectOption('1.5');
  await page.getByLabel('High contrast').check();
  await page.getByLabel('Reduce motion').check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect(page.locator('html')).toHaveCSS('--text-scale', '1.5');
});

test('automated accessibility scan has no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking).toEqual([]);
});

test('BUG-001 locks 3 + 4 and a loose 7 into one fixed BUILD 7', async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => 142;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await page.getByRole('button', { name: '3 of Clubs in your hand' }).click();
  await page.getByRole('button', { name: '4 of Spades on board' }).click();
  await page.getByRole('button', { name: '7 of Hearts on board' }).click();

  const lock = page.getByRole('button', { name: 'Lock paired 7' });
  await expect(lock).toBeVisible();
  await lock.click();
  await expect(page.getByRole('button', { name: /7 build, locked, You/ })).toBeVisible();
});

test('BUG-002 captures BUILD 10 plus loose 9 + A with one 10', async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => 1848;
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await page.getByRole('button', { name: '10 of Diamonds in your hand' }).click();
  await page.getByRole('button', { name: '10 of Clubs on board' }).click();
  await page.getByRole('button', { name: 'Lock paired 10' }).click();

  await expect(page.getByText('Your turn', { exact: true })).toBeVisible({ timeout: 8_000 });
  await page.getByRole('button', { name: '10 of Spades in your hand' }).click();
  await page.getByRole('button', { name: /10 build, locked/ }).click();
  await page.getByRole('button', { name: '9 of Hearts on board' }).click();
  await page.getByRole('button', { name: 'A of Spades on board' }).click();

  const capture = page.getByRole('button', { name: 'Capture 1 build + 2 loose' });
  await expect(capture).toBeVisible();
  await capture.click();
  await expect(page.getByRole('heading', { name: /YOUR HAND .* 5 captured/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /10 build, locked/ })).toHaveCount(0);
});

test('mobile 390px gameplay keeps the hand and locked-build action reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => { Date.now = () => 142; });
  await page.goto('/');
  await expectViewportWidthContained(page);
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await expect(page.locator('.hand-card')).toHaveCount(4);
  await expectViewportWidthContained(page);
  await expectGameOwnedScrolling(page);
  await page.getByRole('button', { name: '3 of Clubs in your hand' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: '3 of Clubs in your hand' }).click();
  await page.getByRole('button', { name: '4 of Spades on board' }).click();
  await page.getByRole('button', { name: '7 of Hearts on board' }).click();

  const lock = page.getByRole('button', { name: 'Lock paired 7' });
  await lock.scrollIntoViewIfNeeded();
  await expect(lock).toBeInViewport();
  await lock.click();
  const build = page.getByRole('button', { name: /7 build, locked, You/ });
  await expect(build).toBeVisible();
  await expect(page.locator('.hand-card').first()).toBeDisabled();
  await expectViewportWidthContained(page);
});

test('mobile 360px gameplay scrolls to a legal action and advances the turn', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => { Date.now = () => 142; });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await expectGameOwnedScrolling(page);
  await page.getByRole('button', { name: 'J of Hearts in your hand' }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'J of Hearts in your hand' }).click();
  const trail = page.getByRole('button', { name: 'Play selected card to table' });
  await trail.scrollIntoViewIfNeeded();
  await expect(trail).toBeInViewport();
  await trail.click();
  await expect(page.locator('.hand-card').first()).toBeDisabled();
  await expectViewportWidthContained(page);
});

test('mobile 150% text keeps cards and actions reachable without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Text size').selectOption('1.5');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByRole('button', { name: 'Play vs CPU' }).click();

  await expectViewportWidthContained(page);
  await expectGameOwnedScrolling(page);
  const handCard = page.locator('.hand-card').first();
  await handCard.scrollIntoViewIfNeeded();
  await handCard.click();
  const trail = page.getByRole('button', { name: 'Play selected card to table' });
  await trail.scrollIntoViewIfNeeded();
  await expect(trail).toBeInViewport();
  await expectViewportWidthContained(page);
});

test('landscape phone gameplay remains internally scrollable and width-contained', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play vs CPU' }).click();
  await expectGameOwnedScrolling(page);
  await expectViewportWidthContained(page);
  await page.locator('.hand-card').first().scrollIntoViewIfNeeded();
  await expect(page.locator('.hand-card').first()).toBeInViewport();
});
