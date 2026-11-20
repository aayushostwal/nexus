import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
});
test.afterEach(() => expect(errors).toEqual([]));

test('workflow onboarding and installation tabs work with keyboard and clipboard feedback', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('reviewable PR');
  await page.getByRole('tab', { name: 'Claude Code' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Codex', exact: true })).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('codex plugin add nexus@nexus-marketplace');
  await page.getByRole('button', { name: 'Copy install commands' }).click();
  await expect(page.getByRole('tabpanel').getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('codex plugin add');
  await page.getByRole('button', { name: 'Copy workflow prompt' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('software-engineer');
});

test('clipboard rejection exposes a useful fallback without reporting success', async ({ page }) => {
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { value: () => Promise.reject(new Error('Denied')) }));
  await page.getByRole('button', { name: 'Copy install commands' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('Copy unavailable');
  await expect(page.getByRole('tabpanel').getByRole('button', { name: 'Copied', exact: true })).toHaveCount(0);
});

test('catalog filters recover from no results and search reveals a hidden target', async ({ page }) => {
  await page.getByLabel('Find a workflow').fill('not-a-real-workflow');
  await expect(page.getByRole('heading', { name: 'No matching workflows' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all workflows' }).click();
  await expect(page.locator('#skill-software-engineer')).toBeVisible();
  await page.getByLabel('Find a workflow').fill('shorts');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Search query').fill('  software-engineer  ');
  await page.getByRole('dialog').getByRole('link', { name: /software-engineer/ }).click();
  await expect(page).toHaveURL(/#skill-software-engineer$/);
  await expect(page.locator('#skill-software-engineer')).toBeFocused();
  await page.getByLabel('Find a specialist').fill('unmatched-specialist');
  await expect(page.getByRole('heading', { name: 'No matching specialists' })).toBeVisible();
  await page.getByRole('button', { name: 'Show all specialists' }).click();
  await expect(page.locator('#agent-code-reviewer')).toBeVisible();
});

test('search closes with Escape and restores focus', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Search documentation, workflows, and specialists' });
  await trigger.click();
  await expect(page.getByLabel('Search query')).toBeFocused();
  await page.getByLabel('Search query').fill('nothing-matches-here');
  await expect(page.getByRole('dialog')).toContainText('No matches');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const theme of ['light', 'dark']) {
  test(`${theme} theme persists and homepage has no serious accessibility violations`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Color theme' }).selectOption(theme);
    await expect(page.locator('html')).toHaveClass(new RegExp(theme));
    await page.reload();
    await expect(page.locator('html')).toHaveClass(new RegExp(theme));
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const width of [360, 768, 1440]) {
  test(`layout stays within viewport at ${width}px; mobile navigation and docs remain usable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.NEXUS_UI_SCREENSHOTS) {
      await page.screenshot({ path: `${process.env.NEXUS_UI_SCREENSHOTS}/nexus-ui-${width}.png` });
    }
    if (width < 1024) {
      const trigger = page.getByRole('button', { name: 'Open navigation' });
      await trigger.click();
      await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
    await page.goto('/docs/getting-started/quickstart');
    await expect(page.getByRole('heading', { name: 'Fix Your First Issue' })).toBeVisible();
    if (width < 1024) {
      await page.getByText('Browse documentation', { exact: true }).click();
      await page.getByRole('navigation', { name: 'Documentation' }).getByRole('link', { name: 'Installation', exact: true }).click();
      await expect(page).toHaveURL(/getting-started\/installation$/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations).toEqual([]);
  });
}
