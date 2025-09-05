import { describe, it, expect } from 'vitest';
import { buildConfig, parseConfig } from '../Editor';
import generateOpenApi from '../exportApi';

const base = {
  theme: 'light',
  shadow: 'none',
  lighting: 'none',
  animation: 'none',
};

describe('card builder config', () => {
  it('preserves card name through build and parse', () => {
    const cfg = buildConfig({ name: 'My Card', elements: [], ...base });
    const json = JSON.stringify(cfg);
    const parsed = parseConfig(json);
    expect(parsed?.name).toBe('My Card');
  });

  it('generates OpenAPI YAML with card name and button path', () => {
    const cfg = buildConfig({
      name: 'My Card',
      elements: [
        {
          id: 'btn1',
          elementId: 'button',
          displayMode: 'display',
          props: { label: 'Go' },
        },
      ],
      ...base,
    });
    const yaml = generateOpenApi(cfg);
    expect(yaml).toContain('title: "My Card"');
    expect(yaml).toContain('/element/btn1');
    expect(yaml).toContain('openapi: "3.0.0"');
  });
});
