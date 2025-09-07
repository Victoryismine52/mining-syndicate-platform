/** @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { SimpleFormModal } from '../simple-form-modal';
import { DynamicFormModal } from '../../pages/dynamic-site';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  QueryClient: class {},
  QueryClientProvider: ({ children }: any) => children,
}));

import { useQuery } from '@tanstack/react-query';
const mockedUseQuery = useQuery as unknown as vi.Mock;

const mockField = {
  id: '1',
  order: '1',
  isRequired: true,
  fieldLibrary: {
    name: 'email',
    dataType: 'email',
    label: 'Email',
    defaultPlaceholder: 'email@example.com',
    translations: {
      es: { label: 'Correo Electrónico', placeholder: 'tu@ejemplo.com' }
    },
    defaultValidation: {}
  }
};

const formTemplate = { id: 't1', name: 'Test', config: {} };

describe('form localization', () => {
  beforeEach(() => {
    mockedUseQuery.mockReturnValue({ data: [mockField], isLoading: false, isError: false });
  });

  test('SimpleFormModal renders Spanish labels and messages', async () => {
    render(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
        selectedLanguage="es"
      />
    );

    const input = await screen.findByLabelText(/Correo Electrónico/i);
    expect(input).toBeTruthy();
    expect(screen.getByPlaceholderText('tu@ejemplo.com')).toBeTruthy();
  });

  test('DynamicFormModal renders Spanish labels and messages', async () => {
    mockedUseQuery.mockReturnValue({ data: [mockField], isLoading: false, isError: false, refetch: vi.fn() });

    render(
      <DynamicFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
        selectedLanguage="es"
      />
    );

    const input = await screen.findByLabelText(/Correo Electrónico/i);
    expect(input).toBeTruthy();
  });
});
