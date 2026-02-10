import type { Page } from '@playwright/test'

export class AppLayoutPage {
  constructor(private page: Page) {}

  get sidebar() {
    return this.page.locator('aside').first()
  }

  async navigateTo(label: string) {
    // Sidebar items: "Quick Analysis", "AI Assistant", "Projects", "Reports",
    // "Integrations", "History", "Analytics"
    await this.sidebar.getByRole('link', { name: new RegExp(label, 'i') }).click()
  }

  async getCurrentPath() {
    return new URL(this.page.url()).pathname
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle')
  }
}
