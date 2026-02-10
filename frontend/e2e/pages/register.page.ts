import type { Page } from '@playwright/test'

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/register')
  }

  async register(data: { username: string; email: string; password: string; full_name: string }) {
    // Labels from RegisterView: "Full Name (optional)", "Email", "Username", "Password"
    await this.page.getByLabel(/full name/i).fill(data.full_name)
    await this.page.getByLabel('Email').fill(data.email)
    await this.page.getByLabel('Username').fill(data.username)
    await this.page.getByLabel('Password').fill(data.password)
    await this.page.getByRole('button', { name: /create account/i }).click()
  }

  get createAccountButton() {
    return this.page.getByRole('button', { name: /create account/i })
  }

  get signInLink() {
    return this.page.getByRole('link', { name: /sign in/i })
  }
}
