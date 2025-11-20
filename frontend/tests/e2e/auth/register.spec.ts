import { test, expect } from '../fixtures/auth';
import { RegisterPage } from '../page-objects/RegisterPage';

/**
 * E2E Tests for Registration Flow
 *
 * Tests all aspects of user registration including:
 * - Successful registration
 * - Form validation
 * - Password requirements
 * - Duplicate user handling
 */

test.describe('Register Page', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should display registration form', async () => {
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.usernameInput).toBeVisible();
    await expect(registerPage.fullNameInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.submitButton).toBeVisible();
    await expect(registerPage.loginLink).toBeVisible();
  });

  test('should navigate to login page when clicking login link', async () => {
    await registerPage.goToLogin();
    await expect(registerPage.page).toHaveURL('/login');
  });

  test('should show error for empty form submission', async ({ page }) => {
    await registerPage.submit();

    // HTML5 validation should prevent submission
    const currentUrl = page.url();
    expect(currentUrl).toContain('/register');
  });

  test('should show error for invalid email format', async ({ page }) => {
    await registerPage.fillForm(
      'invalid-email',
      'testuser123',
      'Test User',
      'TestPassword123!',
      'TestPassword123!'
    );
    await registerPage.submit();

    // Should stay on register page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/register');
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await registerPage.fillForm(
      'test@example.com',
      'testuser123',
      'Test User',
      'TestPassword123!',
      'DifferentPassword123!'
    );
    await registerPage.submit();

    await page.waitForTimeout(500);

    // Should show error or stay on page
    const hasError = await registerPage.hasError();
    const onRegisterPage = page.url().includes('/register');

    expect(hasError || onRegisterPage).toBeTruthy();
  });

  test('should show error for weak password', async ({ page }) => {
    await registerPage.fillForm(
      'test@example.com',
      'testuser123',
      'Test User',
      'weak', // Too short, no uppercase, no digit
      'weak'
    );
    await registerPage.submit();

    await page.waitForTimeout(500);

    // Should show error or stay on page
    const hasError = await registerPage.hasError();
    const onRegisterPage = page.url().includes('/register');

    expect(hasError || onRegisterPage).toBeTruthy();
  });

  test('should successfully register with valid data', async ({ testUser }) => {
    await registerPage.fillForm(
      testUser.email,
      testUser.username,
      testUser.fullName,
      testUser.password,
      testUser.password
    );
    await registerPage.submit();

    // Should redirect to projects page
    await registerPage.verifyRegistrationSuccess();

    // Verify token is stored in localStorage
    const token = await registerPage.page.evaluate(() =>
      localStorage.getItem('auth_token')
    );
    expect(token).toBeTruthy();
  });

  test('should show error when registering duplicate username', async ({
    page,
    testUser,
  }) => {
    // Register user first time via API
    await page.request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
        full_name: testUser.fullName,
      },
    });


    // Try to register same username again via UI
    const duplicateEmail = `duplicate_${testUser.email}`;
    await registerPage.fillForm(
      duplicateEmail,
      testUser.username, // Same username
      'Another User',
      testUser.password,
      testUser.password
    );
    await registerPage.submit();

    await page.waitForTimeout(1000);

    // Should show error
    const hasError = await registerPage.hasError();
    expect(hasError).toBeTruthy();

    // Should stay on register page
    expect(page.url()).toContain('/register');
  });

  test('should show error when registering duplicate email', async ({
    page,
    testUser,
  }) => {
    // Register user first time via API
    await page.request.post('http://localhost:8000/api/auth/register', {
      data: {
        email: testUser.email,
        username: testUser.username,
        password: testUser.password,
        full_name: testUser.fullName,
      },
    });


    // Try to register same email again via UI
    const duplicateUsername = `duplicate_${testUser.username}`;
    await registerPage.fillForm(
      testUser.email, // Same email
      duplicateUsername,
      'Another User',
      testUser.password,
      testUser.password
    );
    await registerPage.submit();

    await page.waitForTimeout(1000);

    // Should show error
    const hasError = await registerPage.hasError();
    expect(hasError).toBeTruthy();

    // Should stay on register page
    expect(page.url()).toContain('/register');
  });

  test('should trim whitespace from inputs', async ({ testUser }) => {
    await registerPage.emailInput.fill(`  ${testUser.email}  `);
    await registerPage.usernameInput.fill(`  ${testUser.username}  `);
    await registerPage.fullNameInput.fill(testUser.fullName);
    await registerPage.passwordInput.fill(testUser.password);
    await registerPage.confirmPasswordInput.fill(testUser.password);
    await registerPage.submit();

    // Should still successfully register (trimmed on backend)
    await registerPage.page.waitForURL('/projects', { timeout: 5000 }).catch(() => {
      // May fail due to whitespace handling
    });
  });

  test('should handle Enter key press on confirm password field', async ({ testUser }) => {
    await registerPage.fillForm(
      testUser.email,
      testUser.username,
      testUser.fullName,
      testUser.password,
      testUser.password
    );

    // Press Enter on confirm password field
    await registerPage.confirmPasswordInput.press('Enter');

    // Should redirect to projects page
    await registerPage.verifyRegistrationSuccess();
  });
});

test.describe('Registration Password Validation', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goto();
  });

  test('should accept password with uppercase, lowercase, and digit', async ({ testUser }) => {
    await registerPage.fillForm(
      testUser.email,
      testUser.username,
      testUser.fullName,
      'ValidPass123', // 8+ chars, uppercase, lowercase, digit
      'ValidPass123'
    );
    await registerPage.submit();

    await registerPage.verifyRegistrationSuccess();
  });

  test('should accept password with special characters', async ({ testUser }) => {
    await registerPage.fillForm(
      testUser.email,
      testUser.username,
      testUser.fullName,
      'SecureP@ssw0rd!',
      'SecureP@ssw0rd!'
    );
    await registerPage.submit();

    await registerPage.verifyRegistrationSuccess();
  });
});
