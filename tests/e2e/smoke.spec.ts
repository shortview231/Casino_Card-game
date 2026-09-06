import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('Capture 11 title to first move works with keyboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Capture 11', level: 1 })).toBeVisible();

  const play = page.getByRole('button', { name: 'Play' });
  await play.focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('region', { name: 'Capture 11 card table' })).toBeVisible();
  await expect(page.locator('.hand-card')).toHaveCount(4);

  const firstCard = page.locator('.hand-card').first();
  await firstCard.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Trail card' })).toBeVisible();

  await page.getByRole('button', { name: 'Trail card' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText(/CPU is thinking|CPU trails|CPU captures|CPU builds|CPU burns/)).toBeVisible();
});

test('preferences survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('High contrast').check();
  await page.getByLabel('Reduce motion').check();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
});

test('automated accessibility scan has no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((violation) =>
    violation.impact === 'serious' || violation.impact === 'critical',
  );
  expect(blocking).toEqual([]);
});
