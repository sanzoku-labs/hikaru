import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Authentication Fixtures for E2E Tests
 *
 * Provides reusable authentication helpers for test setup and teardown.
 */

export interface AuthFixtures {
  authenticatedPage: Page;
  testUser: {
    email: string;
    username: string;
    password: string;
    fullName: string;
  };
}

/**
 * Generates a unique test user for each test run
 */
function generateTestUser() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    email: `test-${timestamp}-${random}@hikaru.test`,
    username: `testuser_${timestamp}_${random}`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
  };
}

/**
 * Registers a new test user via API
 */
async function registerUser(page: Page, user: { email: string; username: string; password: string; fullName: string }) {
  const response = await page.request.post('http://localhost:8000/api/auth/register', {
    data: {
      email: user.email,
      username: user.username,
      password: user.password,
      full_name: user.fullName,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.access_token;
}

/**
 * Logs in a user via API
 */
async function loginUser(page: Page, username: string, password: string) {
  const response = await page.request.post('http://localhost:8000/api/auth/login', {
    data: {
      username,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  return data.access_token;
}

/**
 * Sets authentication token in localStorage
 */
async function setAuthToken(page: Page, token: string) {
  await page.addInitScript((token) => {
    localStorage.setItem('auth_token', token);
  }, token);
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Test user fixture - generates unique user for each test
  testUser: async ({}, use) => {
    const user = generateTestUser();
    await use(user);
  },

  // Authenticated page fixture - automatically logs in before each test
  authenticatedPage: async ({ page, testUser }, use) => {
    // Register and login the test user
    const token = await registerUser(page, testUser);

    // Set auth token in localStorage
    await setAuthToken(page, token);

    // Navigate to app (now authenticated)
    await page.goto('/');

    // Wait for app to recognize authentication
    await page.waitForSelector('[data-testid="authenticated-layout"]', { timeout: 5000 }).catch(() => {
      // Fallback: just wait for page load
    });

    // Provide the authenticated page to the test
    await use(page);

    // Cleanup: logout after test
    try {
      await page.request.post('http://localhost:8000/api/auth/logout', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      // Ignore logout errors during cleanup
      console.warn('Logout failed during cleanup:', error);
    }
  },
});

export { expect };

/**
 * Helper function to login via UI
 */
export async function loginViaUI(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.fill('[name="username"]', username);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/projects');
}

/**
 * Helper function to register via UI
 */
export async function registerViaUI(
  page: Page,
  email: string,
  username: string,
  fullName: string,
  password: string
) {
  await page.goto('/register');
  await page.fill('[name="email"]', email);
  await page.fill('[name="username"]', username);
  await page.fill('[name="full_name"]', fullName);
  await page.fill('[name="password"]', password);
  await page.fill('[name="confirm_password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/projects');
}

/**
 * Helper function to logout via UI
 */
export async function logoutViaUI(page: Page) {
  // Click user avatar dropdown
  await page.locator('[data-testid="user-avatar"]').click();

  // Wait for menu to appear
  await page.waitForTimeout(300);

  // Click logout option
  await page.locator('[data-testid="logout-button"]').click();

  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  return token !== null;
}

/**
 * Helper function to get auth token from localStorage
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('auth_token'));
}
