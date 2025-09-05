import { describe, it, expect } from 'vitest';
import { exportApi } from '../exportApi';
import type { CardConfig } from '../export/types';

describe('exportApi', () => {
  it('generates OpenAPI YAML for interactive elements', () => {
    const cfg: CardConfig = {
      name: 'API Card',
      elements: [
        {
          id: 'btn1',
          elementId: 'button',
          displayMode: 'display',
          props: { label: 'Submit' },
        },
        {
          id: 'input1',
          elementId: 'input',
          displayMode: 'input',
          props: { label: 'Name' },
        },
      ],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };

    const yaml = exportApi(cfg);
    expect(yaml).toContain('openapi: "3.0.0"');
    expect(yaml).toContain('title: "API Card"');
    expect(yaml).toContain('/element/btn1:');
    expect(yaml).toContain('Handle Submit click');
    expect(yaml).toContain('/element/input1:');
    expect(yaml).toContain('Submit value for Name');
  });
});

