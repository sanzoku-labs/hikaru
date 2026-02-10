import type { Page } from '@playwright/test'
import path from 'path'

export class QuickAnalysisPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async uploadFile(filePath: string) {
    const absolutePath = path.resolve(filePath)
    // The upload zone uses react-dropzone with a hidden file input
    await this.page.locator('input[type="file"]').setInputFiles(absolutePath)
  }

  async waitForUploadComplete() {
    // Wait for the "Complete" stage or analyze button to appear
    await this.page.waitForSelector('text=Complete', { timeout: 15000 }).catch(() => {
      // Alternatively, wait for the results section
      return this.page.waitForSelector('[class*="chart"], [class*="insight"]', { timeout: 15000 })
    })
  }

  get pageTitle() {
    return this.page.getByText('Quick Analysis')
  }

  get analyzeButton() {
    return this.page.getByRole('button', { name: /analyze data/i })
  }

  get userIntentInput() {
    return this.page.locator('#user-intent')
  }

  get uploadZone() {
    return this.page.locator('label').filter({ hasText: /drag and drop/i })
  }
}
