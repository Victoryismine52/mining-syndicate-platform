/* @vitest-environment jsdom */
/// <reference types="vitest" />

import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { useDebouncedCallback } from './use-debounced-callback';

function TestComponent({ onUpdate }: { onUpdate: (v: string) => void }) {
  const [value, setValue] = useState('');
  const { debounced, flush } = useDebouncedCallback((v: string) => onUpdate(v), 300);

  return (
    <input
      data-testid="input"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        setValue(v);
        debounced(v);
      }}
      onBlur={() => flush()}
    />
  );
}

describe('useDebouncedCallback', () => {
  it('triggers update once after rapid typing', () => {
    vi.useFakeTimers();
    const onUpdate = vi.fn();
    const { getByTestId } = render(<TestComponent onUpdate={onUpdate} />);
    const input = getByTestId('input') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(100);
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(onUpdate).toHaveBeenCalledTimes(0);
    vi.advanceTimersByTime(300);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith('abc');
  });
});

