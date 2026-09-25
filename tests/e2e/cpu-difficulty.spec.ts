import { expect, test } from '@playwright/test';

test('CPU difficulty selector persists and is shown during play', async ({ page }, testInfo) => {
  await page.goto('/');
  const selector = page.getByLabel('CPU Difficulty');
  await expect(selector).toHaveValue('medium');
  await selector.selectOption('hard');
  await expect(page.getByText('Tracks the deck and plays strategically.')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('difficulty-selector-desktop.png'), fullPage: false });
  await page.getByRole('button', { name: 'Play vs CPU' }).click();
  await expect(page.locator('.table-meta')).toContainText('CPU Hard');

  await page.goto('/');
  await expect(page.getByLabel('CPU Difficulty')).toHaveValue('hard');
  await page.screenshot({ path: testInfo.outputPath('difficulty-selector-mobile.png'), fullPage: false });
});
