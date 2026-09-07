import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
  await expect(page.getByText(/CPU is thinking|CPU trails|CPU captures|CPU builds|CPU burns/)).toBeVisible();
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
