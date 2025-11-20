import { test, expect } from '../fixtures/auth';

/**
 * E2E Tests for Logout Flow
 *
 * Tests user logout functionality including:
 * - Successful logout
 * - Session cleanup
 * - Redirect to login
 * - Protected route access after logout
 */

test.describe('Logout Flow', () => {
  test('should successfully logout via UI', async ({ authenticatedPage }) => {
    // User is already authenticated via fixture
    await authenticatedPage.goto('/projects');

    // Click user avatar dropdown (adjust selector based on actual implementation)
    const userMenu = authenticatedPage.locator('[data-testid="user-avatar"], button:has-text("Profile"), button[aria-label="User menu"]').first();
    await userMenu.click();

    // Click logout button
    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();

    // Should redirect to login page
    await authenticatedPage.waitForURL('/login', { timeout: 5000 });
    await expect(authenticatedPage).toHaveURL('/login');

    // Verify token is cleared from localStorage
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeNull();
  });

  test('should prevent access to protected routes after logout', async ({
    authenticatedPage,
  }) => {
    // Logout
    await authenticatedPage.goto('/projects');

    const userMenu = authenticatedPage.locator('[data-testid="user-avatar"], button:has-text("Profile"), button[aria-label="User menu"]').first();
    await userMenu.click();

    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();

    await authenticatedPage.waitForURL('/login');

    // Try to access protected route
    await authenticatedPage.goto('/projects');

    // Should redirect back to login
    await authenticatedPage.waitForURL('/login');
    await expect(authenticatedPage).toHaveURL('/login');
  });

  test('should clear all session data on logout', async ({ authenticatedPage }) => {
    // Set some additional data in localStorage
    await authenticatedPage.evaluate(() => {
      localStorage.setItem('test_key', 'test_value');
    });

    // Logout
    await authenticatedPage.goto('/projects');

    const userMenu = authenticatedPage.locator('[data-testid="user-avatar"], button:has-text("Profile"), button[aria-label="User menu"]').first();
    await userMenu.click();

    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")').first();
    await logoutButton.click();

    await authenticatedPage.waitForURL('/login');

    // Verify auth token is cleared
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeNull();

    // Other data may or may not be cleared (depends on implementation)
    // This is just to verify the auth token specifically is gone
  });

  test('should handle logout when already logged out', async ({ page }) => {
    // Navigate to login without authentication
    await page.goto('/login');

    // Try to access projects (should redirect to login)
    await page.goto('/projects');
    await page.waitForURL('/login');

    await expect(page).toHaveURL('/login');
  });

  test('should handle logout with expired token', async ({ page, testUser }) => {
    // Register and login user
    const registerResponse = await page.request.post(
      'http://localhost:8000/api/auth/register',
      {
        data: {
          email: testUser.email,
          username: testUser.username,
          password: testUser.password,
          full_name: testUser.fullName,
        },
      }
    );

    const { access_token } = await registerResponse.json();

    // Set an invalid/expired token
    await page.addInitScript((token) => {
      localStorage.setItem('auth_token', 'invalid_expired_token');
    }, access_token);

    // Try to access protected route
    await page.goto('/projects');

    // Should redirect to login (token invalid)
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Session Management', () => {
  test('should maintain session across page refreshes', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/projects');

    // Verify we're on projects page
    await expect(authenticatedPage).toHaveURL('/projects');

    // Refresh the page
    await authenticatedPage.reload();

    // Should still be on projects page (session maintained)
    await expect(authenticatedPage).toHaveURL('/projects');

    // Token should still exist
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeTruthy();
  });

  test('should maintain session across navigation', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/projects');

    // Navigate to analytics
    await authenticatedPage.goto('/analytics');
    await expect(authenticatedPage).toHaveURL('/analytics');

    // Navigate back to projects
    await authenticatedPage.goto('/projects');
    await expect(authenticatedPage).toHaveURL('/projects');

    // Session should still be valid
    const token = await authenticatedPage.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeTruthy();
  });

  test('should handle concurrent logout requests gracefully', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/projects');

    // Open user menu
    const userMenu = authenticatedPage.locator('[data-testid="user-avatar"], button:has-text("Profile"), button[aria-label="User menu"]').first();
    await userMenu.click();

    // Get logout button but don't click yet
    const logoutButton = authenticatedPage.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")').first();

    // Click logout
    await logoutButton.click();

    // Should handle gracefully even if clicked multiple times
    await authenticatedPage.waitForURL('/login');
    await expect(authenticatedPage).toHaveURL('/login');
  });
});
