/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';

type Manager = { id: string; userEmail: string };
type User = { id: string; email: string };

function ManagerList({ managers, users }: { managers: Manager[]; users: User[] }) {
  return (
    <div>
      {managers.map((m) => {
        const hasAccount = users.some((u) => u.email === m.userEmail);
        return (
          <div key={m.id}>
            <span>{m.userEmail}</span>
            {!hasAccount && (
              <span data-testid={`badge-${m.userEmail}`}>Invited</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

describe('Site manager invitation badge', () => {
  it('shows badge for invited email and removes it after signup', () => {
    const managers: Manager[] = [{ id: '1', userEmail: 'test@example.com' }];
    const { rerender } = render(<ManagerList managers={[]} users={[]} />);

    // simulate invite
    rerender(<ManagerList managers={managers} users={[]} />);
    expect(screen.getByTestId('badge-test@example.com')).toBeTruthy();

    // simulate signup
    rerender(<ManagerList managers={managers} users={[{ id: 'u1', email: 'test@example.com' }]} />);
    expect(screen.queryByTestId('badge-test@example.com')).toBeNull();
  });
});
