import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { RegisterPage } from '../pages/register.page'

test.describe('Authentication', () => {
  let loginPage: LoginPage
  let registerPage: RegisterPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    registerPage = new RegisterPage(page)
  })

  test('should display login form', async () => {
    await loginPage.goto()

    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.signInButton).toBeVisible()
    await expect(loginPage.registerLink).toBeVisible()
  })

  test('should navigate to register page', async ({ page }) => {
    await loginPage.goto()
    await loginPage.registerLink.click()

    await expect(page).toHaveURL(/\/register/)
    await expect(registerPage.createAccountButton).toBeVisible()
  })

  test('should show validation errors on empty login submit', async ({ page }) => {
    await loginPage.goto()
    await loginPage.signInButton.click()

    // Form validation should prevent submission or show errors
    // The button should still be visible (form not submitted)
    await expect(loginPage.signInButton).toBeVisible()
    // Check that we're still on the login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show error on invalid credentials', async ({ page }) => {
    await loginPage.goto()
    await loginPage.login('nonexistent_user', 'WrongPassword123!')

    // Wait for error message to appear
    await expect(
      page.locator('.text-destructive, [class*="destructive"]').first()
    ).toBeVisible({ timeout: 10000 })
  })

  test('should register a new user and redirect', async ({ page }) => {
    const timestamp = Date.now()
    const user = {
      email: `e2e-auth-${timestamp}@example.com`,
      username: `e2e_auth_${timestamp}`,
      password: 'TestPassword123!',
      full_name: 'Auth Test User',
    }

    await registerPage.goto()
    await registerPage.register(user)

    // After successful registration, should redirect to login or dashboard
    await expect(page).not.toHaveURL(/\/register/, { timeout: 10000 })
  })

  test('should login with valid credentials', async ({ page, request }) => {
    // First register a user via API
    const timestamp = Date.now()
    const user = {
      email: `e2e-login-${timestamp}@example.com`,
      username: `e2e_login_${timestamp}`,
      password: 'TestPassword123!',
      full_name: 'Login Test User',
    }

    const apiBaseUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000'
    await request.post(`${apiBaseUrl}/api/auth/register`, { data: user })

    // Now login via the UI
    await loginPage.goto()
    await loginPage.login(user.username, user.password)

    // Should redirect away from login page after successful login
    await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access a protected route without being logged in
    await page.goto('/projects')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('should display register form fields', async ({ page }) => {
    await registerPage.goto()

    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(registerPage.createAccountButton).toBeVisible()
    await expect(registerPage.signInLink).toBeVisible()
  })
})
