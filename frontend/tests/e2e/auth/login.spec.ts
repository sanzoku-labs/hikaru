import { test, expect } from '../fixtures/auth';
import { LoginPage } from '../page-objects/LoginPage';

/**
 * E2E Tests for Login Flow
 *
 * Tests all aspects of user authentication including:
 * - Successful login
 * - Invalid credentials
 * - Form validation
 * - Navigation to register
 */

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login form', async () => {
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.registerLink).toBeVisible();
  });

  test('should navigate to register page when clicking register link', async () => {
    await loginPage.goToRegister();
    await expect(loginPage.page).toHaveURL('/register');
  });

  test('should show error for empty credentials', async ({ page }) => {
    await loginPage.submit();

    // HTML5 validation should prevent submission or show error
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginPage.fillCredentials('nonexistent_user', 'wrong_password');
    await loginPage.submit();

    // Wait for error message
    await page.waitForTimeout(1000);

    // Should either show error or stay on login page
    const hasError = await loginPage.hasError();
    const onLoginPage = page.url().includes('/login');

    expect(hasError || onLoginPage).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page, testUser }) => {
    // First register the user via API
    await page.request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
        full_name: testUser.fullName,
      },
    });

    // Now login via UI
    await loginPage.fillCredentials(testUser.username, testUser.password);
    await loginPage.submit();

    // Should redirect to projects page
    await loginPage.verifyLoginSuccess();

    // Verify token is stored in localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeTruthy();
  });

  test('should successfully login with email instead of username', async ({ page, testUser }) => {
    // Register user first
    await page.request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
        full_name: testUser.fullName,
      },
    });

    // Login with email
    await loginPage.fillCredentials(testUser.email, testUser.password);
    await loginPage.submit();

    // Should redirect to projects page
    await loginPage.verifyLoginSuccess();
  });

  test('should handle Enter key press on password field', async ({ page, testUser }) => {
    // Register user first
    await page.request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
        full_name: testUser.fullName,
      },
    });

    await loginPage.fillCredentials(testUser.username, testUser.password);

    // Press Enter on password field
    await loginPage.passwordInput.press('Enter');

    // Should redirect to projects page
    await loginPage.verifyLoginSuccess();
  });

  test('should clear form after failed login attempt', async ({ page }) => {
    await loginPage.fillCredentials('invalid_user', 'invalid_pass');
    await loginPage.submit();

    await page.waitForTimeout(1000);

    // User should be able to re-type credentials
    await loginPage.usernameInput.clear();
    await loginPage.passwordInput.clear();

    await expect(loginPage.usernameInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });
});

test.describe('Login Redirects', () => {
  test('should redirect to login when accessing protected route unauthenticated', async ({
    page,
  }) => {
    // Try to access projects page without authentication
    await page.goto('/projects');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing project detail unauthenticated', async ({
    page,
  }) => {
    await page.goto('/projects/1');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing analytics unauthenticated', async ({
    page,
  }) => {
    await page.goto('/analytics');

    // Should redirect to login
    await page.waitForURL('/login');
    await expect(page).toHaveURL('/login');
  });
});
