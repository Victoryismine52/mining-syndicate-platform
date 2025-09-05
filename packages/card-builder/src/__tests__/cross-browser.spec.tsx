import React from 'react';
import fs from 'node:fs/promises';
import { test, expect } from '@playwright/experimental-ct-react';
import { CardEditor } from '../Editor';

// Run this component test in all configured browsers to ensure that editing the
// card and exporting assets behaves the same everywhere. The Playwright config
// already defines Chromium, Firefox and WebKit projects so this single test
// will execute in each browser.
test('exports assets with current card name', async ({ mount, page }) => {
  await mount(<CardEditor onSave={() => {}} onBack={() => {}} />);
  await page.locator('input').first().fill('Cross Browser Card');

  const exportButton = page.getByText('Export Assets');
  const [jsonDownload, yamlDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.waitForEvent('download'),
    exportButton.click(),
  ]);

  expect(jsonDownload.suggestedFilename()).toBe('card.json');
  expect(yamlDownload.suggestedFilename()).toBe('card.yaml');

  const jsonPath = await jsonDownload.path();
  const yamlPath = await yamlDownload.path();
  const jsonContent = await fs.readFile(jsonPath!, 'utf-8');
  const yamlContent = await fs.readFile(yamlPath!, 'utf-8');

  expect(jsonContent).toContain('"name": "Cross Browser Card"');
  expect(yamlContent).toContain('title: "Cross Browser Card"');
  expect(yamlContent).toContain('openapi: "3.0.0"');
});
