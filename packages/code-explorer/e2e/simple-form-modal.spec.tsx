import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { SimpleFormModal } from '@/components/simple-form-modal';

const formTemplate = { id: 't1', name: 'Test', config: { buttonText: 'Submit' } };
const formFields = [
  {
    id: '1',
    order: '1',
    isRequired: true,
    fieldLibrary: {
      name: 'email',
      dataType: 'email',
      label: 'Email',
      defaultPlaceholder: 'email@example.com',
      translations: {
        es: { label: 'Correo Electrónico', placeholder: 'tu@ejemplo.com' },
      },
      defaultValidation: {},
    },
  },
];

test.describe('SimpleFormModal', () => {
  test('submits form successfully', async ({ mount, page }) => {
    await page.route('**/api/form-templates/t1/fields', route =>
      route.fulfill({ status: 200, body: JSON.stringify(formFields) })
    );
    await page.route('**/api/sites/site1/leads', route =>
      route.fulfill({ status: 200, body: '{}' })
    );

    await mount(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
        selectedLanguage="es"
      />
    );

    await expect(page.getByLabel('Correo Electrónico')).toBeVisible();
    await page.fill('[data-testid="input-email"]', 'tu@ejemplo.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Thank You!')).toBeVisible();
  });

  test('handles network failure', async ({ mount, page }) => {
    await page.route('**/api/form-templates/t1/fields', route =>
      route.fulfill({ status: 200, body: JSON.stringify(formFields) })
    );
    await page.route('**/api/sites/site1/leads', route =>
      route.fulfill({ status: 500, body: 'error' })
    );

    await mount(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
      />
    );

    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Submission Failed')).toBeVisible();
  });

  test('handles malformed field data', async ({ mount, page }) => {
    await page.route('**/api/form-templates/t1/fields', route =>
      route.fulfill({ status: 200, body: 'not-json' })
    );

    await mount(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
      />
    );

    await expect(page.getByText('Failed to load form fields')).toBeVisible();
  });
});
