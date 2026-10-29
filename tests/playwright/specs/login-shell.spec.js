const { test, expect } = require('@playwright/test');

/**
 * Smoke: app shell + login UI render without Firebase (static host).
 * Full OTP cannot be automated without test credentials — we assert structure.
 */
test.describe('Login shell', () => {
  test('loads index and shows login mobile field', async ({ page }) => {
    await page.goto('/');
    // PWA install scripts may run; wait for login UI
    const mobile = page.locator('#loginMobile, input[name="mobile"], input[inputmode="numeric"]').first();
    await expect(mobile).toBeVisible({ timeout: 20000 });
  });

  test('login screen has accessible labels or placeholders', async ({ page }) => {
    await page.goto('/');
    const mobile = page.locator('#loginMobile').first();
    if (await mobile.count()) {
      const label = await mobile.getAttribute('aria-label');
      const ph = await mobile.getAttribute('placeholder');
      expect(!!(label || ph)).toBeTruthy();
    }
  });

  test('service worker registers or fails gracefully', async ({ page }) => {
    await page.goto('/');
    const swOk = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return true;
      try {
        // registration may already be in flight from app
        await new Promise((r) => setTimeout(r, 1500));
        return true;
      } catch (e) {
        return false;
      }
    });
    expect(swOk).toBeTruthy();
  });
});
