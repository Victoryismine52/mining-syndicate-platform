// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Provide minimal implementations for UI components used in CardBuilderApp
vi.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardTitle: (props: any) => <div {...props} />,
  CardDescription: (props: any) => <div {...props} />,
  CardContent: (props: any) => <div {...props} />,
}), { virtual: true });

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}), { virtual: true });

import { CardBuilderApp } from '../App';


describe('packages/card-builder naming flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('updates card name through editor and persists via saveCard', async () => {
    const initialCard = {
      id: '1',
      name: 'Default Card',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };
    localStorage.setItem('cards', JSON.stringify([initialCard]));

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<CardBuilderApp />);

    // ensure initial name rendered
    expect(screen.getAllByText('Default Card').length).toBeGreaterThan(0);

    // open editor
    fireEvent.click(screen.getByText('Edit'));

    // rename card
    const input = screen.getByDisplayValue('Default Card') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Renamed Card' } });

    // save changes
    fireEvent.click(screen.getByText('Save'));

    // CardBuilderApp should display updated name
    await screen.findAllByText('Renamed Card');
    expect(screen.getAllByText('Renamed Card').length).toBeGreaterThan(0);

    // saveCard should persist updated name to localStorage
    expect(setItemSpy).toHaveBeenLastCalledWith(
      'cards',
      expect.stringContaining('Renamed Card'),
    );
    const stored = JSON.parse(localStorage.getItem('cards')!);
    expect(stored[0].name).toBe('Renamed Card');

    setItemSpy.mockRestore();
  });
});

