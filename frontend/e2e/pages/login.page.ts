import type { Page } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async login(username: string, password: string) {
    // Labels from LoginView: "Username or Email", "Password"
    await this.page.getByLabel(/username or email/i).fill(username)
    await this.page.getByLabel('Password').fill(password)
    await this.page.getByRole('button', { name: /sign in/i }).click()
  }

  async getErrorMessage() {
    return this.page.locator('.text-destructive, [class*="destructive"]').first().textContent()
  }

  get signInButton() {
    return this.page.getByRole('button', { name: /sign in/i })
  }

  get registerLink() {
    return this.page.getByRole('link', { name: /create one/i })
  }

  get usernameInput() {
    return this.page.getByLabel(/username or email/i)
  }

  get passwordInput() {
    return this.page.getByLabel('Password')
  }
}
