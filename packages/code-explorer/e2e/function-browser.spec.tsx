import React from 'react';
import { test, expect } from '@playwright/experimental-ct-react';
import { FunctionBrowser } from '../src/components/FunctionBrowser';
import { CompositionCanvas, CompositionNode, Edge } from '../src/components/CompositionCanvas';

// Tests for API failure states and drag-and-drop interactions

test.describe('FunctionBrowser integration', () => {
test('handles API failure gracefully', async ({ mount, page }) => {
    await page.route('**/api/functions', route => route.abort());
    const component = await mount(<FunctionBrowser />);
    await expect(component.locator('[data-testid="function-browser"]').first()).toBeVisible();
    await expect(component.locator('[data-testid^="function-"]')).toHaveCount(0);
  });

  test('drags function to composition canvas', async ({ mount, page }) => {
    await page.route('**/api/functions', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify([
          { name: 'foo', signature: '', path: 'a.ts', tags: [] }
        ])
      })
    );

    const Wrapper = () => {
      const [state, setState] = React.useState({
        nodes: [] as CompositionNode[],
        connections: [] as Edge[],
      });
      return (
        <div className="flex">
          <FunctionBrowser />
          <CompositionCanvas
            nodes={state.nodes}
            connections={state.connections}
            onUpdate={setState}
          />
        </div>
      );
    };

    const component = await mount(<Wrapper />);
    const fn = component.locator('[data-testid="function-foo"]');
    const canvas = component.locator('[data-testid="canvas"]');
    await fn.dragTo(canvas);
    await expect(component.getByText('foo')).toBeVisible();
  });
});

