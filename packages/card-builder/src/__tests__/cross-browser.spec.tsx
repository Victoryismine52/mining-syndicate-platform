import React from 'react';
import fs from 'node:fs/promises';
import { test, expect } from '@playwright/experimental-ct-react';
import { CardEditor } from '../Editor';

test('exports OpenAPI with current card name', async ({ mount, page }) => {
  await mount(<CardEditor onSave={() => {}} onBack={() => {}} />);
  const nameInput = page.locator('input').first();
  await nameInput.fill('Cross Browser Card');

  const exportButton = page.getByText('Export JSON');
  const [jsonDownload, yamlDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.waitForEvent('download'),
    exportButton.click(),
  ]);

  expect(jsonDownload.suggestedFilename()).toBe('card.json');
  expect(yamlDownload.suggestedFilename()).toBe('card.yaml');

  const yamlPath = await yamlDownload.path();
  const content = await fs.readFile(yamlPath!, 'utf-8');
  expect(content).toContain('title: "Cross Browser Card"');
});
