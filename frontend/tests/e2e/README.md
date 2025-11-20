# E2E Testing for Hikaru

This directory contains end-to-end (E2E) tests for the Hikaru data analytics dashboard using [Playwright](https://playwright.dev/).

## Overview

The E2E test suite verifies all user-facing functionality including:
- Authentication flows (login, register, logout)
- Project management (create, list, search, delete)
- File operations (upload, download, delete)
- Data analysis workflows
- Chart generation and AI insights
- File comparison and merging
- Q&A chat functionality
- Export features

## Test Structure

```
tests/e2e/
├── auth/                    # Authentication tests
│   ├── login.spec.ts
│   ├── register.spec.ts
│   └── logout.spec.ts
├── projects/                # Project management tests
│   ├── create-project.spec.ts
│   ├── list-projects.spec.ts
│   └── project-crud.spec.ts
├── files/                   # File operation tests
│   ├── file-upload.spec.ts
│   ├── file-download.spec.ts
│   └── file-delete.spec.ts
├── analysis/                # Analysis workflow tests
│   ├── single-file-analysis.spec.ts
│   ├── multi-analysis.spec.ts
│   └── analysis-list.spec.ts
├── operations/              # Advanced feature tests
│   ├── file-comparison.spec.ts
│   ├── file-merging.spec.ts
│   └── export.spec.ts
├── chat/                    # Q&A chat tests
│   └── qa-chat.spec.ts
├── analytics/               # Analytics page tests
│   └── cross-project-analytics.spec.ts
├── workflows/               # End-to-end workflow tests
│   ├── end-to-end-happy-path.spec.ts
│   └── error-recovery.spec.ts
├── fixtures/                # Test fixtures
│   └── auth.ts             # Authentication helpers
├── helpers/                 # Helper utilities
│   └── api.ts              # API helpers for test setup
└── page-objects/            # Page Object Models
    ├── LoginPage.ts
    ├── RegisterPage.ts
    └── ProjectsPage.ts
```

## Prerequisites

1. **Backend running**: Ensure the FastAPI backend is running on `http://localhost:8000`
   ```bash
   cd backend
   poetry run uvicorn app.main:app --reload
   ```

2. **Frontend dev server**: Tests will automatically start the frontend dev server on `http://localhost:5173`

3. **Browsers installed**: Run `npx playwright install` to install test browsers

## Running Tests

### Run all tests (headless)
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test auth/login.spec.ts
```

### Run tests matching a pattern
```bash
npx playwright test --grep "should successfully login"
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View test report
```bash
npm run test:e2e:report
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../fixtures/auth';
import { ProjectsPage } from '../page-objects/ProjectsPage';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    // Perform actions
    await projectsPage.createProject('Test Project');

    // Verify results
    await projectsPage.verifyProjectExists('Test Project');
  });
});
```

### Using Fixtures

#### Authenticated Page
```typescript
test('test with authenticated user', async ({ authenticatedPage }) => {
  // User is already logged in
  await authenticatedPage.goto('/projects');
});
```

#### Test User
```typescript
test('test with user data', async ({ testUser }) => {
  // Access user credentials
  console.log(testUser.email, testUser.username);
});
```

### Using Page Object Models

```typescript
import { LoginPage } from '../page-objects/LoginPage';

test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('username', 'password');
  await loginPage.verifyLoginSuccess();
});
```

### Using API Helpers

```typescript
import { createProject, uploadFile } from '../helpers/api';

test('test with pre-created project', async ({ page, testUser }) => {
  // Get auth token
  const token = await getAuthToken(page);

  // Create project via API
  const project = await createProject(page, token, 'Test Project');

  // Now test UI interactions with this project
});
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use unique names (include timestamp) to avoid conflicts
- Clean up test data in afterEach hooks if needed

### 2. Selectors
- Prefer `data-testid` attributes: `page.locator('[data-testid="user-avatar"]')`
- Use semantic selectors: `page.getByRole('button', { name: 'Submit' })`
- Avoid CSS classes (they change frequently)

### 3. Waiting Strategies
- Use `waitForURL()` for navigation: `await page.waitForURL('/projects')`
- Use `waitForLoadState()`: `await page.waitForLoadState('networkidle')`
- Avoid `waitForTimeout()` unless absolutely necessary

### 4. Assertions
- Use Playwright's auto-waiting assertions: `await expect(element).toBeVisible()`
- Be specific with assertions: `await expect(page).toHaveURL('/projects')`

### 5. Error Handling
- Tests should handle both success and failure scenarios
- Verify error messages are displayed correctly
- Test network failures and timeouts

## Debugging Tests

### Visual Debugging
```bash
npm run test:e2e:ui
```
Opens Playwright UI where you can step through tests, see screenshots, and inspect the DOM.

### Debug Mode
```bash
npm run test:e2e:debug
```
Runs tests in headed mode with Playwright Inspector for step-by-step debugging.

### Screenshots on Failure
Screenshots are automatically captured on test failures in `test-results/`.

### Videos on Failure
Videos are recorded for failed tests and saved in `test-results/`.

### Traces
Traces are captured on first retry and can be viewed with:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Pull requests
- Pushes to main branch

See `.github/workflows/e2e-tests.yml` for CI configuration.

### Environment Variables

- `PLAYWRIGHT_BASE_URL`: Frontend URL (default: `http://localhost:5173`)
- `PLAYWRIGHT_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `CI`: Set to `true` in CI environments

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if backend is running
- Verify network connectivity

### Browser Installation Issues
```bash
npx playwright install --with-deps
```

### Port Conflicts
- Ensure ports 5173 (frontend) and 8000 (backend) are available
- Change ports in `playwright.config.ts` if needed

### Flaky Tests
- Add explicit waits for async operations
- Use `waitForLoadState('networkidle')`
- Increase timeout for slow operations

### Database State Issues
- Tests use a test database (separate from development)
- Clean up test data in afterEach hooks
- Consider resetting database between test runs

## Contributing

When adding new features:
1. Write E2E tests for all user-facing functionality
2. Follow existing test structure and naming conventions
3. Add new Page Object Models for new pages
4. Update this README if adding new test categories
5. Ensure tests pass locally before committing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Project CLAUDE.md](/CLAUDE.md) for application architecture
- [Project README.md](/README.md) for setup instructions
