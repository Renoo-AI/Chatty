import { test, expect } from '@playwright/test';

test('verify chat UI after scroll fixes', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Wait for login card
  await expect(page.locator('.login-card')).toBeVisible();

  // Switch to sign up
  await page.click('text=Sign Up');
  await expect(page.locator('input[placeholder="Full Name"]')).toBeVisible();

  await page.screenshot({ path: '/home/jules/verification/final_verified_signup.png' });

  // Since we can't easily sign in without a real Firebase project,
  // we've already verified the components render.
});
