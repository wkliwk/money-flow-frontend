import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * UI component library accessibility check.
 *
 * Visits the public `/dev/components` showcase route and runs axe-core in
 * both light and dark color schemes. The test fails on any wcag2a, wcag2aa
 * or wcag21aa violation — these are the required accessibility levels per
 * the design-system spec.
 */
test.describe('UI component library', () => {
  for (const scheme of ['light', 'dark'] as const) {
    test(`showcase page has zero axe-core violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto('/dev/components');
      await page.waitForLoadState('networkidle');

      // Sanity check: the showcase actually rendered.
      await expect(
        page.getByRole('heading', { level: 1, name: /UI primitives/i }),
      ).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});
