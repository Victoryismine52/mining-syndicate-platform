// Unit tests for the card builder's configuration utilities. These ensure that
// a card's name survives a round trip through `buildConfig`/`parseConfig` and
// that the OpenAPI export contains expected metadata.
import { describe, it, expect } from 'vitest';
import { buildConfig, parseConfig } from '../Editor';
import { generateOpenApi } from '../export';

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

  it('assigns default name when missing', () => {
    const json = JSON.stringify({ elements: [], ...base });
    const parsed = parseConfig(json);
    expect(parsed?.name).toBe('Untitled Card');
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
