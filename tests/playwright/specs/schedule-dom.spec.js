const { test, expect } = require('@playwright/test');

/**
 * Smoke: schedule-related DOM helpers exist after scripts load.
 * Does not require authenticated session — checks global function presence.
 */
test.describe('Schedule module presence', () => {
  test('schedule helpers are defined after script load', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    const flags = await page.evaluate(() => {
      return {
        hasOfflineQueue: typeof window.MP_OFFLINE_QUEUE !== 'undefined',
        hasEnqueue: typeof window.enqueueScheduleEdit === 'function',
        hasFlush: typeof window.flushOfflineQueue === 'function',
        hasA11y: typeof window.runA11yPass === 'function',
        hasAnnounce: typeof window.mpAnnounce === 'function'
      };
    });
    expect(flags.hasOfflineQueue).toBeTruthy();
    expect(flags.hasEnqueue).toBeTruthy();
    expect(flags.hasFlush).toBeTruthy();
    expect(flags.hasA11y).toBeTruthy();
  });

  test('offline queue enqueue + size works in isolation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => {
      if (!window.MP_OFFLINE_QUEUE) return { ok: false };
      // Clear via localStorage key
      try {
        localStorage.removeItem('mp_sched_offline_queue_v1');
      } catch (e) {}
      window.enqueueScheduleEdit({
        empId: 'TEST001',
        date: '2026-10-29',
        shift: 'D',
        monthKey: '2026-10'
      });
      return { ok: true, size: window.MP_OFFLINE_QUEUE.size() };
    });
    expect(result.ok).toBeTruthy();
    expect(result.size).toBeGreaterThanOrEqual(1);
  });
});
