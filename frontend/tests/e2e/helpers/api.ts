import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * API Helper Functions for E2E Tests
 *
 * Provides utilities for setting up test data via backend API.
 */

const API_BASE_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:8000';

/**
 * Creates a project via API
 */
export async function createProject(
  page: Page,
  token: string,
  name: string,
  description?: string
) {
  const response = await page.request.post(`${API_BASE_URL}/api/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      name,
      description: description || `Test project: ${name}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Uploads a file to a project via API
 */
export async function uploadFile(
  page: Page,
  token: string,
  projectId: number,
  filePath: string,
  fileName?: string
) {
  const fileBuffer = fs.readFileSync(filePath);
  const actualFileName = fileName || path.basename(filePath);

  const response = await page.request.post(
    `${API_BASE_URL}/api/projects/${projectId}/files`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: {
        file: {
          name: actualFileName,
          mimeType: actualFileName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: fileBuffer,
        },
      },
    }
  );

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Analyzes a file via API
 */
export async function analyzeFile(
  page: Page,
  token: string,
  projectId: number,
  fileId: number,
  userIntent?: string,
  save: boolean = true
) {
  const url = `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}/analyze?save=${save}`;

  const response = await page.request.post(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      user_intent: userIntent,
    },
  });

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Lists all projects via API
 */
export async function listProjects(page: Page, token: string) {
  const response = await page.request.get(`${API_BASE_URL}/api/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Gets a specific project via API
 */
export async function getProject(page: Page, token: string, projectId: number) {
  const response = await page.request.get(`${API_BASE_URL}/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Deletes a project via API
 */
export async function deleteProject(page: Page, token: string, projectId: number) {
  const response = await page.request.delete(`${API_BASE_URL}/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.ok()).toBeTruthy();
  return response.status() === 204;
}

/**
 * Lists files in a project via API
 */
export async function listProjectFiles(page: Page, token: string, projectId: number) {
  const response = await page.request.get(
    `${API_BASE_URL}/api/projects/${projectId}/files`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  expect(response.ok()).toBeTruthy();
  return await response.json();
}

/**
 * Deletes a file from a project via API
 */
export async function deleteFile(
  page: Page,
  token: string,
  projectId: number,
  fileId: number
) {
  const response = await page.request.delete(
    `${API_BASE_URL}/api/projects/${projectId}/files/${fileId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  expect(response.ok()).toBeTruthy();
  return response.status() === 204;
}

/**
 * Creates a test CSV file with sample data
 */
export function createTestCSV(filename: string, rows: number = 100): string {
  const testDataDir = path.join(__dirname, '../test-data');

  // Create test-data directory if it doesn't exist
  if (!fs.existsSync(testDataDir)) {
    fs.mkdirSync(testDataDir, { recursive: true });
  }

  const filepath = path.join(testDataDir, filename);

  // Generate sample CSV data
  const headers = ['id', 'name', 'category', 'value', 'date'];
  const categories = ['A', 'B', 'C', 'D'];

  let csvContent = headers.join(',') + '\n';

  for (let i = 1; i <= rows; i++) {
    const row = [
      i,
      `Product ${i}`,
      categories[i % categories.length],
      Math.floor(Math.random() * 1000),
      new Date(2024, 0, i % 30 + 1).toISOString().split('T')[0],
    ];
    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync(filepath, csvContent);
  return filepath;
}

/**
 * Cleanup test data directory
 */
export function cleanupTestData() {
  const testDataDir = path.join(__dirname, '../test-data');
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
}

/**
 * Waits for API request to complete and returns response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
) {
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern);
    }
    return urlPattern.test(url);
  });

  await action();
  return await responsePromise;
}

/**
 * Intercepts and mocks API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any,
  status: number = 200
) {
  await page.route(urlPattern, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseData),
    });
  });
}
