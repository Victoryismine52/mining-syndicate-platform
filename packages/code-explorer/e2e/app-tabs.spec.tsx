import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { CodeExplorerApp } from '../src/App';

test.describe('CodeExplorerApp tabs', () => {
  test('opens, switches, and closes tabs without duplication', async ({ mount, page }) => {
    const tree = {
      name: 'repo',
      path: '/repo',
      children: [
        { name: 'one.ts', path: '/repo/one.ts' },
        { name: 'two.ts', path: '/repo/two.ts' },
      ],
    };

    await page.route('**/code-explorer/api/clone', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tree),
      })
    );
    await page.route('**/code-explorer/api/file?*', route => {
      const url = new URL(route.request().url());
      const path = url.searchParams.get('path');
      route.fulfill({ body: `code for ${path}` });
    });
    await page.route('**/code-explorer/api/save', route =>
      route.fulfill({ status: 200, body: '{}' })
    );

    await mount(<CodeExplorerApp />);

    await page.getByRole('button', { name: 'Import' }).click();
    await page
      .getByPlaceholder('https://github.com/user/repo')
      .fill('https://github.com/user/repo');
    await page.getByRole('button', { name: 'Import' }).nth(1).click();

    const treePanel = page.locator('.w-64');
    await treePanel.getByText('one.ts').click();
    await expect(page.getByText('/repo/one.ts')).toBeVisible();
    await treePanel.getByText('two.ts').click();
    await expect(page.getByText('/repo/two.ts')).toBeVisible();

    await treePanel.getByText('one.ts').click();
    const tabBar = page.getByTestId('tab-bar');
    await expect(tabBar.locator('[aria-label="Close"]')).toHaveCount(2);

    await tabBar.getByText('one.ts').click();
    await expect(page.getByText('/repo/one.ts')).toBeVisible();

    await tabBar.locator('[aria-label="Close"]').nth(1).click();
    await expect(tabBar.locator('[aria-label="Close"]')).toHaveCount(1);
    await expect(page.getByText('/repo/one.ts')).toBeVisible();
  });
});
