import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 *
 * Encapsulates interactions with the login page.
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly registerLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill in login credentials
   */
  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Submit login form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Perform complete login flow
   */
  async login(username: string, password: string) {
    await this.goto();
    await this.fillCredentials(username, password);
    await this.submit();
  }

  /**
   * Click register link
   */
  async goToRegister() {
    await this.registerLink.click();
    await this.page.waitForURL('/register');
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
   * Verify login success (redirects to home or projects)
   */
  async verifyLoginSuccess() {
    // Wait for navigation away from login page
    await this.page.waitForURL(url => url.pathname !== '/login', { timeout: 5000 });

    // Verify we're not on login page anymore
    const currentUrl = this.page.url();
    expect(currentUrl).not.toContain('/login');
  }
}
