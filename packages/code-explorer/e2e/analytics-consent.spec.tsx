import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { useAnalyticsConsent } from '@/components/analytics-consent-modal';

function ConsentTester() {
  const { ConsentModal } = useAnalyticsConsent();
  return <ConsentModal />;
}

test.describe('Analytics consent', () => {
  test('records consent when allowed', async ({ mount, page }) => {
    await page.evaluate(() => localStorage.removeItem('analytics-consent'));
    await mount(<ConsentTester />);
    await expect(page.getByText('Allow analytics?')).toBeVisible();
    await page.getByRole('button', { name: 'Allow' }).click();
    await expect(page.getByText('Allow analytics?')).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('analytics-consent'));
    expect(stored).toContain('granted');
  });
});
