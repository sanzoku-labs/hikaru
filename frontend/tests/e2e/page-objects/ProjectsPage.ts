import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Page Object Model for Projects Page
 *
 * Encapsulates interactions with the projects list page.
 */
export class ProjectsPage {
  readonly page: Page;
  readonly newProjectButton: Locator;
  readonly createProjectDialog: Locator;
  readonly projectNameInput: Locator;
  readonly projectDescriptionInput: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly sortDropdown: Locator;
  readonly gridViewButton: Locator;
  readonly listViewButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProjectButton = page.getByRole('button', { name: /new project/i });
    this.createProjectDialog = page.locator('[role="dialog"]');
    this.projectNameInput = page.locator('[name="name"]');
    this.projectDescriptionInput = page.locator('[name="description"]');
    this.createButton = page.getByRole('button', { name: /create/i });
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdown = page.locator('select[name="filter"], button:has-text("Filter")');
    this.sortDropdown = page.locator('select[name="sort"], button:has-text("Sort")');
    this.gridViewButton = page.locator('button[aria-label="Grid view"]');
    this.listViewButton = page.locator('button[aria-label="List view"]');
  }

  /**
   * Navigate to projects page
   */
  async goto() {
    await this.page.goto('/projects');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click "New Project" button to open dialog
   */
  async openCreateDialog() {
    await this.newProjectButton.click();
    await expect(this.createProjectDialog).toBeVisible();
  }

  /**
   * Fill in project creation form
   */
  async fillProjectForm(name: string, description?: string) {
    await this.projectNameInput.fill(name);
    if (description) {
      await this.projectDescriptionInput.fill(description);
    }
  }

  /**
   * Submit project creation form
   */
  async submitProjectForm() {
    await this.createButton.click();
    await expect(this.createProjectDialog).toBeHidden();
  }

  /**
   * Complete project creation flow
   */
  async createProject(name: string, description?: string) {
    await this.openCreateDialog();
    await this.fillProjectForm(name, description);
    await this.submitProjectForm();
  }

  /**
   * Cancel project creation dialog
   */
  async cancelCreateDialog() {
    await this.cancelButton.click();
    await expect(this.createProjectDialog).toBeHidden();
  }

  /**
   * Search for projects
   */
  async searchProjects(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  /**
   * Get project card by name
   */
  getProjectCard(projectName: string): Locator {
    return this.page.locator(`[data-testid="project-card"]:has-text("${projectName}")`);
  }

  /**
   * Click on a project card to open it
   */
  async openProject(projectName: string) {
    const card = this.getProjectCard(projectName);
    await card.click();
    await this.page.waitForURL(/\/projects\/\d+/);
  }

  /**
   * Open project dropdown menu
   */
  async openProjectMenu(projectName: string) {
    const card = this.getProjectCard(projectName);
    const menuButton = card.locator('button[aria-label="Project menu"]');
    await menuButton.click();
  }

  /**
   * Delete a project
   */
  async deleteProject(projectName: string) {
    await this.openProjectMenu(projectName);
    await this.page.getByRole('menuitem', { name: /delete/i }).click();

    // Confirm deletion
    const confirmButton = this.page.getByRole('button', { name: /confirm|delete/i });
    await confirmButton.click();

    // Wait for card to disappear
    await expect(this.getProjectCard(projectName)).toBeHidden();
  }

  /**
   * Archive a project
   */
  async archiveProject(projectName: string) {
    await this.openProjectMenu(projectName);
    await this.page.getByRole('menuitem', { name: /archive/i }).click();
  }

  /**
   * Switch to grid view
   */
  async switchToGridView() {
    await this.gridViewButton.click();
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    await this.listViewButton.click();
  }

  /**
   * Verify project exists in list
   */
  async verifyProjectExists(projectName: string) {
    await expect(this.getProjectCard(projectName)).toBeVisible();
  }

  /**
   * Verify project does not exist in list
   */
  async verifyProjectNotExists(projectName: string) {
    await expect(this.getProjectCard(projectName)).toBeHidden();
  }

  /**
   * Get count of visible projects
   */
  async getProjectCount(): Promise<number> {
    return await this.page.locator('[data-testid="project-card"]').count();
  }
}
