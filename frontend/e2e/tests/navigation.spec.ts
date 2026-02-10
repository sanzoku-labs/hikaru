import { test, expect } from '../fixtures/auth.fixture'
import { AppLayoutPage } from '../pages/app-layout.page'

test.describe('Navigation', () => {
  test('should display sidebar navigation items', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await expect(layout.sidebar).toBeVisible()
    await expect(layout.sidebar.getByText('Quick Analysis')).toBeVisible()
    await expect(layout.sidebar.getByText('Projects')).toBeVisible()
    await expect(layout.sidebar.getByText('AI Assistant')).toBeVisible()
    await expect(layout.sidebar.getByText('Reports')).toBeVisible()
    await expect(layout.sidebar.getByText('Integrations')).toBeVisible()
    await expect(layout.sidebar.getByText('History')).toBeVisible()
    await expect(layout.sidebar.getByText('Analytics')).toBeVisible()
  })

  test('should navigate to Projects page', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await layout.navigateTo('Projects')
    await layout.waitForNavigation()

    await expect(authenticatedPage).toHaveURL(/\/projects/)
    await expect(authenticatedPage.getByText('Projects').first()).toBeVisible()
  })

  test('should navigate to AI Assistant page', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await layout.navigateTo('AI Assistant')
    await layout.waitForNavigation()

    await expect(authenticatedPage).toHaveURL(/\/assistant/)
  })

  test('should navigate to Reports page', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await layout.navigateTo('Reports')
    await layout.waitForNavigation()

    await expect(authenticatedPage).toHaveURL(/\/reports/)
  })

  test('should navigate to Analytics page', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await layout.navigateTo('Analytics')
    await layout.waitForNavigation()

    await expect(authenticatedPage).toHaveURL(/\/analytics/)
  })

  test('should navigate to History page', async ({ authenticatedPage }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    await layout.navigateTo('History')
    await layout.waitForNavigation()

    await expect(authenticatedPage).toHaveURL(/\/history/)
  })

  test('should navigate back to Quick Analysis from other pages', async ({
    authenticatedPage,
  }) => {
    const layout = new AppLayoutPage(authenticatedPage)

    // Navigate away first
    await layout.navigateTo('Projects')
    await expect(authenticatedPage).toHaveURL(/\/projects/)

    // Navigate back to Quick Analysis (home)
    await layout.navigateTo('Quick Analysis')
    await layout.waitForNavigation()

    // Quick Analysis is at the root path
    const currentPath = await layout.getCurrentPath()
    expect(currentPath).toBe('/')
  })

  test('should redirect unknown routes to home', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/some-nonexistent-route')

    // The catch-all route redirects to /
    await expect(authenticatedPage).toHaveURL(/^\/$/, { timeout: 5000 })
  })
})
