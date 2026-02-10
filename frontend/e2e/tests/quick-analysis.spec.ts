import { test, expect } from '../fixtures/auth.fixture'
import { QuickAnalysisPage } from '../pages/quick-analysis.page'
import { SAMPLE_CSV_PATH } from '../fixtures/test-data'

test.describe('Quick Analysis', () => {
  test('should display the quick analysis page', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    await expect(quickAnalysis.pageTitle).toBeVisible()
    await expect(
      authenticatedPage.getByText(/upload a csv or excel file/i)
    ).toBeVisible()
  })

  test('should show file upload zone', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    // Upload zone should display drag-and-drop instructions
    await expect(
      authenticatedPage.getByText(/drag and drop/i)
    ).toBeVisible()
  })

  test('should show user intent textarea', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    await expect(quickAnalysis.userIntentInput).toBeVisible()
    await expect(
      authenticatedPage.getByText(/what would you like to learn/i)
    ).toBeVisible()
  })

  test('should upload a CSV file', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    // Upload the sample CSV via the hidden file input
    await quickAnalysis.uploadFile(SAMPLE_CSV_PATH)

    // After file selection, the file name should be displayed
    await expect(
      authenticatedPage.getByText('sample-data.csv')
    ).toBeVisible({ timeout: 5000 })
  })

  test('should show analyze button after file upload', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    await quickAnalysis.uploadFile(SAMPLE_CSV_PATH)

    // The analyze button should be enabled after file selection
    await expect(quickAnalysis.analyzeButton).toBeVisible({ timeout: 5000 })
  })

  test.skip(
    !process.env.ANTHROPIC_API_KEY,
    'Requires AI API key for analysis'
  )
  test('should complete analysis after upload', async ({ authenticatedPage }) => {
    const quickAnalysis = new QuickAnalysisPage(authenticatedPage)
    await quickAnalysis.goto()

    await quickAnalysis.uploadFile(SAMPLE_CSV_PATH)
    await quickAnalysis.analyzeButton.click()

    // Wait for analysis to complete
    await quickAnalysis.waitForUploadComplete()

    // Results section should be visible
    await expect(
      authenticatedPage.getByText(/analysis complete|new analysis/i)
    ).toBeVisible({ timeout: 30000 })
  })
})
