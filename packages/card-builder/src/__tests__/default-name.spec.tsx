import React from 'react';
import fs from 'node:fs/promises';
import { test, expect } from '@playwright/experimental-ct-react';
import { CardEditor } from '../Editor';

// Ensure default naming is preserved when exporting across browsers
// Playwright config runs this spec in Chromium, Firefox and WebKit

test('exports assets with default card name', async ({ mount, page }) => {
  await mount(<CardEditor onSave={() => {}} onBack={() => {}} />);
  await page.locator('input').first().fill('');

  const exportButton = page.getByText('Export Assets');
  const [jsonDownload, yamlDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.waitForEvent('download'),
    exportButton.click(),
  ]);

  const jsonContent = await fs.readFile(await jsonDownload.path()!, 'utf-8');
  const yamlContent = await fs.readFile(await yamlDownload.path()!, 'utf-8');

  expect(jsonContent).toContain('"name": "Untitled Card"');
  expect(yamlContent).toContain('title: "Untitled Card"');
});
