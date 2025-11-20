import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Register Page
 *
 * Encapsulates interactions with the registration page.
 */
export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly usernameInput: Locator;
  readonly fullNameInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly loginLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.fullNameInput = page.locator('[data-testid="fullname-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
    this.submitButton = page.locator('[data-testid="register-submit"]');
    this.loginLink = page.locator('[data-testid="login-link"]');
    this.errorMessage = page.locator('[data-testid="register-error"]');
  }

  /**
   * Navigate to register page
   */
  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill in registration form
   */
  async fillForm(
    email: string,
    username: string,
    fullName: string,
    password: string,
    confirmPassword: string
  ) {
    await this.emailInput.fill(email);
    await this.usernameInput.fill(username);
    await this.fullNameInput.fill(fullName);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Submit registration form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Perform complete registration flow
   */
  async register(
    email: string,
    username: string,
    fullName: string,
    password: string
  ) {
    await this.goto();
    await this.fillForm(email, username, fullName, password, password);
    await this.submit();
  }

  /**
   * Click login link
   */
  async goToLogin() {
    await this.loginLink.click();
    await this.page.waitForURL('/login');
  }

  /**
   * Check if error message is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Verify registration success (redirects to home or projects)
   */
  async verifyRegistrationSuccess() {
    // Wait for navigation away from register page
    await this.page.waitForURL(url => url.pathname !== '/register', { timeout: 5000 });

    // Verify we're not on register page anymore
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain('/register');
  }
}
