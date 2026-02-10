import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  authenticatedPage: import('@playwright/test').Page
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, request }, use) => {
    const timestamp = Date.now()
    const user = {
      email: `e2e-${timestamp}@example.com`,
      username: `e2e_user_${timestamp}`,
      password: 'TestPassword123!',
      full_name: 'E2E Test User',
    }

    // Register via API
    const apiBaseUrl = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000'
    const registerResponse = await request.post(`${apiBaseUrl}/api/auth/register`, {
      data: user,
    })
    expect(registerResponse.ok()).toBeTruthy()

    // Login via API to get JWT token
    const loginResponse = await request.post(`${apiBaseUrl}/api/auth/login`, {
      data: { username: user.username, password: user.password },
    })
    expect(loginResponse.ok()).toBeTruthy()
    const { access_token } = await loginResponse.json()

    // Inject token into localStorage so the app recognizes the session
    await page.goto('/')
    await page.evaluate((token) => {
      localStorage.setItem('token', token)
    }, access_token)
    await page.reload()

    await use(page)
  },
})

export { expect } from '@playwright/test'
