import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { FileViewer } from '../src/components/FileViewer';

test.describe('FileViewer', () => {
  test('saves patched content', async ({ mount, page }) => {
    await page.route('**/code-explorer/api/file?*', route =>
      route.fulfill({ body: 'const a = 1;' })
    );
    let saveRequest;
    await page.route('**/code-explorer/api/save', route => {
      saveRequest = route.request();
      route.fulfill({ status: 200, body: '{}' });
    });
    const component = await mount(<FileViewer path="/repo/test.ts" />);
    const textarea = component.locator('textarea[data-testid="editor"]');
    await textarea.fill('const a = 2;');
    await page.getByText('Save').click();
    const body = JSON.parse(saveRequest!.postData()!);
    expect(body.patch).toContain('-const a = 1;');
    expect(body.patch).toContain('+const a = 2;');
  });

  test('saves patched content with keyboard shortcut', async ({ mount, page }) => {
    await page.route('**/code-explorer/api/file?*', route =>
      route.fulfill({ body: 'const a = 1;' })
    );
    let saveRequest;
    await page.route('**/code-explorer/api/save', route => {
      saveRequest = route.request();
      route.fulfill({ status: 200, body: '{}' });
    });
    const component = await mount(<FileViewer path="/repo/test.ts" />);
    const textarea = component.locator('textarea[data-testid="editor"]');
    await textarea.fill('const a = 2;');
    await page.keyboard.press('Control+s');
    const body = JSON.parse(saveRequest!.postData()!);
    expect(body.patch).toContain('-const a = 1;');
    expect(body.patch).toContain('+const a = 2;');
  });

  test('toggles fullscreen via control', async ({ mount, page }) => {
    await page.route('**/code-explorer/api/file?*', route =>
      route.fulfill({ body: 'const a = 1;' })
    );
    await page.route('**/code-explorer/api/save', route =>
      route.fulfill({ status: 200, body: '{}' })
    );
    await mount(<FileViewer path="/repo/test.ts" />);
    await page.getByText('Full screen').click();
    await expect(page.getByText('Exit')).toBeVisible();
  });
});
