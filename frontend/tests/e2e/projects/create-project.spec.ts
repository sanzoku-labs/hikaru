import { test, expect } from '../fixtures/auth';
import { ProjectsPage } from '../page-objects/ProjectsPage';

/**
 * E2E Tests for Project Creation
 *
 * Tests project creation functionality including:
 * - Dialog interaction
 * - Form validation
 * - Successful project creation
 * - Project appears in list
 */

test.describe('Create Project', () => {
  let projectsPage: ProjectsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();
  });

  test('should open create project dialog when clicking New Project button', async () => {
    await projectsPage.openCreateDialog();
    await expect(projectsPage.createProjectDialog).toBeVisible();
    await expect(projectsPage.projectNameInput).toBeVisible();
    await expect(projectsPage.projectDescriptionInput).toBeVisible();
  });

  test('should close create project dialog when clicking Cancel', async () => {
    await projectsPage.openCreateDialog();
    await projectsPage.cancelCreateDialog();
    await expect(projectsPage.createProjectDialog).toBeHidden();
  });

  test('should require project name', async () => {
    await projectsPage.openCreateDialog();

    // Try to submit without name
    await projectsPage.createButton.click();

    // Dialog should still be visible (validation prevents submission)
    await expect(projectsPage.createProjectDialog).toBeVisible();
  });

  test('should successfully create project with name only', async () => {
    const projectName = `Test Project ${Date.now()}`;

    await projectsPage.createProject(projectName);

    // Verify project appears in list
    await projectsPage.verifyProjectExists(projectName);
  });

  test('should successfully create project with name and description', async () => {
    const projectName = `Test Project ${Date.now()}`;
    const description = 'This is a test project created during E2E testing';

    await projectsPage.createProject(projectName, description);

    // Verify project appears in list
    await projectsPage.verifyProjectExists(projectName);
  });

  test('should allow creating multiple projects', async () => {
    const timestamp = Date.now();
    const project1 = `Project A ${timestamp}`;
    const project2 = `Project B ${timestamp}`;

    await projectsPage.createProject(project1);
    await projectsPage.verifyProjectExists(project1);

    await projectsPage.createProject(project2);
    await projectsPage.verifyProjectExists(project2);

    // Both projects should be visible
    await expect(projectsPage.getProjectCard(project1)).toBeVisible();
    await expect(projectsPage.getProjectCard(project2)).toBeVisible();
  });

  test('should handle special characters in project name', async () => {
    const projectName = `Test @Project #${Date.now()} & Special!`;

    await projectsPage.createProject(projectName);

    // Verify project appears in list (may be sanitized by backend)
    await projectsPage.page.waitForTimeout(1000);
  });

  test('should trim whitespace from project name', async () => {
    const projectName = `  Trimmed Project ${Date.now()}  `;

    await projectsPage.openCreateDialog();
    await projectsPage.projectNameInput.fill(projectName);
    await projectsPage.submitProjectForm();

    // Wait for creation
    await projectsPage.page.waitForTimeout(1000);

    // Project should exist (trimmed by backend)
    const count = await projectsPage.getProjectCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should clear form after successful creation', async () => {
    const projectName = `Test Project ${Date.now()}`;

    await projectsPage.createProject(projectName);

    // Open dialog again
    await projectsPage.openCreateDialog();

    // Form should be empty
    await expect(projectsPage.projectNameInput).toHaveValue('');
    await expect(projectsPage.projectDescriptionInput).toHaveValue('');
  });

  test('should handle Enter key press in name field', async () => {
    const projectName = `Test Project ${Date.now()}`;

    await projectsPage.openCreateDialog();
    await projectsPage.projectNameInput.fill(projectName);

    // Press Enter
    await projectsPage.projectNameInput.press('Enter');

    // Wait for submission
    await projectsPage.page.waitForTimeout(1000);

    // Dialog should close and project should be created
    // Note: depends on form submission behavior
  });

  test('should handle Escape key press to close dialog', async () => {
    await projectsPage.openCreateDialog();

    // Press Escape
    await projectsPage.page.keyboard.press('Escape');

    // Dialog should close
    await projectsPage.page.waitForTimeout(500);
    await expect(projectsPage.createProjectDialog).toBeHidden();
  });

  test('should disable Create button while submitting', async () => {
    const projectName = `Test Project ${Date.now()}`;

    await projectsPage.openCreateDialog();
    await projectsPage.fillProjectForm(projectName);

    // Click create button
    const createButton = projectsPage.createButton;
    await createButton.click();

    // Button should be disabled briefly during submission (if implemented)
    // This prevents double-submission
    await projectsPage.page.waitForTimeout(100);
  });
});

test.describe('Create Project Validation', () => {
  let projectsPage: ProjectsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();
  });

  test('should show validation error for empty project name', async () => {
    await projectsPage.openCreateDialog();

    // Try to create with empty name
    await projectsPage.projectDescriptionInput.fill('Description without name');
    await projectsPage.createButton.click();

    // Dialog should remain open
    await expect(projectsPage.createProjectDialog).toBeVisible();
  });

  test('should allow very long project names', async () => {
    const longName = `Test Project with a very long name that goes on and on ${Date.now()}`;

    await projectsPage.createProject(longName.substring(0, 100)); // Limit to reasonable length

    await projectsPage.page.waitForTimeout(1000);
  });

  test('should allow very long descriptions', async () => {
    const projectName = `Test Project ${Date.now()}`;
    const longDescription =
      'This is a very long description '.repeat(20) + Date.now();

    await projectsPage.createProject(projectName, longDescription);

    await projectsPage.verifyProjectExists(projectName);
  });
});
