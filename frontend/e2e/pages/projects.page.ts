import type { Page } from '@playwright/test'

export class ProjectsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/projects')
  }

  async createProject(name: string, description?: string) {
    // Click "New Project" button in the page header
    await this.page.getByRole('button', { name: /new project/i }).click()

    // Fill in the "Create New Project" dialog
    await this.page.getByLabel(/project name/i).fill(name)
    if (description) {
      await this.page.getByLabel(/description/i).fill(description)
    }
    await this.page
      .getByRole('dialog')
      .getByRole('button', { name: /create project/i })
      .click()
  }

  getProjectCard(name: string) {
    return this.page.locator(`[class*="card"]`).filter({ hasText: name })
  }

  async deleteProject(name: string) {
    const card = this.getProjectCard(name)
    await card.getByRole('button', { name: /delete project/i }).click()
    // Confirm deletion in the alert dialog
    await this.page.getByRole('button', { name: /delete|confirm/i }).last().click()
  }

  get newProjectButton() {
    return this.page.getByRole('button', { name: /new project/i })
  }

  get emptyState() {
    return this.page.getByText(/no projects yet/i)
  }
}
