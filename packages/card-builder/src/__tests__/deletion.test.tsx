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

import { CardBuilderApp } from '../App';


describe('packages/card-builder deletion flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('removes a card and updates localStorage', () => {
    const initialCard = {
      id: '1',
      name: 'Card To Delete',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };
    localStorage.setItem('cards', JSON.stringify([initialCard]));

    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<CardBuilderApp />);

    expect(screen.getAllByText('Card To Delete').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('Delete'));

    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.queryAllByText('Card To Delete').length).toBe(0);

    const stored = JSON.parse(localStorage.getItem('cards')!);
    expect(stored).toEqual([]);

    confirmSpy.mockRestore();
  });
});

