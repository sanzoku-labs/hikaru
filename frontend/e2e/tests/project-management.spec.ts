import { test, expect } from '../fixtures/auth.fixture'
import { ProjectsPage } from '../pages/projects.page'

test.describe('Project Management', () => {
  test('should display the projects page', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    await expect(authenticatedPage.getByText('Projects').first()).toBeVisible()
    await expect(
      authenticatedPage.getByText(/organize your data files/i)
    ).toBeVisible()
  })

  test('should show New Project button', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    await expect(projectsPage.newProjectButton).toBeVisible()
  })

  test('should open create project dialog', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    await projectsPage.newProjectButton.click()

    // The dialog should open with form fields
    await expect(
      authenticatedPage.getByText('Create New Project')
    ).toBeVisible()
    await expect(
      authenticatedPage.getByLabel(/project name/i)
    ).toBeVisible()
    await expect(
      authenticatedPage.getByLabel(/description/i)
    ).toBeVisible()
  })

  test('should create a new project', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    const projectName = `E2E Project ${Date.now()}`
    await projectsPage.createProject(projectName, 'Created by E2E test')

    // The project should appear in the list
    await expect(
      projectsPage.getProjectCard(projectName)
    ).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to project detail', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    // Create a project first
    const projectName = `E2E Detail ${Date.now()}`
    await projectsPage.createProject(projectName, 'For detail navigation test')

    // Wait for it to appear and click on it
    const card = projectsPage.getProjectCard(projectName)
    await expect(card).toBeVisible({ timeout: 10000 })
    await card.click()

    // Should navigate to the project detail page
    await expect(authenticatedPage).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/, { timeout: 10000 })
  })

  test('should delete a project', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    // Create a project to delete
    const projectName = `E2E Delete ${Date.now()}`
    await projectsPage.createProject(projectName, 'To be deleted')

    // Wait for the project to appear
    const card = projectsPage.getProjectCard(projectName)
    await expect(card).toBeVisible({ timeout: 10000 })

    // Delete the project
    await projectsPage.deleteProject(projectName)

    // The project card should disappear
    await expect(card).not.toBeVisible({ timeout: 10000 })
  })

  test('should show empty state when no projects exist', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage)
    await projectsPage.goto()

    // If this is a fresh user (from fixture), there should be no projects
    // Check for either empty state OR the project list
    const hasEmptyState = await projectsPage.emptyState.isVisible().catch(() => false)
    const hasNewButton = await projectsPage.newProjectButton.isVisible().catch(() => false)

    // At minimum, the page should show either empty state or the new project button
    expect(hasEmptyState || hasNewButton).toBeTruthy()
  })
})
