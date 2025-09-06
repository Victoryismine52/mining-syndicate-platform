// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}), { virtual: true });

import { CardBuilderApp } from '../App';

describe('packages/card-builder delete flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes card from state and localStorage', () => {
    const initialCard = {
      id: '1',
      name: 'Sample',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };
    localStorage.setItem('cards', JSON.stringify([initialCard]));

    render(<CardBuilderApp />);

    expect(screen.getAllByText('Sample')[0]).toBeTruthy();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    fireEvent.click(screen.getByText('Delete'));

    expect(screen.queryByText('Sample')).toBeNull();
    expect(localStorage.getItem('cards')).toBe(JSON.stringify([]));

    confirmSpy.mockRestore();
  });

  it('keeps card when deletion is cancelled', () => {
    const initialCard = {
      id: '1',
      name: 'Sample',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };
    localStorage.setItem('cards', JSON.stringify([initialCard]));

    render(<CardBuilderApp />);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fireEvent.click(screen.getByText('Delete'));

    expect(screen.getAllByText('Sample')[0]).toBeTruthy();
    expect(localStorage.getItem('cards')).toBe(JSON.stringify([initialCard]));

    confirmSpy.mockRestore();
  });

  it('removes only the targeted card when multiple exist', () => {
    const cards = [
      {
        id: '1',
        name: 'First',
        elements: [],
        theme: 'light',
        shadow: 'none',
        lighting: 'none',
        animation: 'none',
      },
      {
        id: '2',
        name: 'Second',
        elements: [],
        theme: 'light',
        shadow: 'none',
        lighting: 'none',
        animation: 'none',
      },
    ];
    localStorage.setItem('cards', JSON.stringify(cards));

    render(<CardBuilderApp />);

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getAllByText('Delete')[0]);

    expect(screen.queryByText('First')).toBeNull();
    expect(screen.getByText('Second')).toBeTruthy();

    expect(localStorage.getItem('cards')).toBe(
      JSON.stringify([cards[1]])
    );

    confirmSpy.mockRestore();
  });
});
