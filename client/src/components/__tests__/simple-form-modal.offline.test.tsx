/** @vitest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimpleFormModal } from '../simple-form-modal';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
  QueryClient: class {},
  QueryClientProvider: ({ children }: any) => children,
}));

import { useQuery } from '@tanstack/react-query';
const mockedUseQuery = useQuery as unknown as vi.Mock;

const formTemplate = { id: 't1', name: 'Test', config: {} };

describe('SimpleFormModal offline and refresh behavior', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('shows offline warning and disables submit when offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
      />
    );

    expect(await screen.findByText(/You are offline/i)).toBeTruthy();
    const submit = screen.getByRole('button', { name: /submit/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  test('refresh form button triggers refetch', async () => {
    const refetch = vi.fn();
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch,
    });

    render(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
      />
    );

    const refresh = screen.getByRole('button', { name: /refresh form/i });
    fireEvent.click(refresh);
    expect(refetch).toHaveBeenCalled();
  });

  test('error state refresh button calls refetch', async () => {
    const refetch = vi.fn();
    mockedUseQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error('fail'),
      refetch,
    });

    render(
      <SimpleFormModal
        isOpen={true}
        onClose={() => {}}
        formTemplate={formTemplate}
        siteId="site1"
      />
    );

    const retry = screen.getAllByRole('button', { name: /refresh form/i })[0];
    fireEvent.click(retry);
    expect(refetch).toHaveBeenCalled();
  });
});
