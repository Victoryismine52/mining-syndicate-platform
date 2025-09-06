import { describe, it, expect } from 'vitest';
import { buildConfig } from '../export/buildConfig';
import { parseConfig } from '../export/parseConfig';
import type { CardConfig } from '../export/types';

describe('config name persistence', () => {
  it('round-trips card name through buildConfig and parseConfig', () => {
    const cfg: CardConfig = {
      name: 'Persistence Card',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };

    const built = buildConfig(cfg);
    const parsed = parseConfig(JSON.stringify(built));
    expect(parsed?.name).toBe('Persistence Card');
  });

  it('defaults to "Untitled Card" when name missing', () => {
    const parsed = parseConfig('{}');
    expect(parsed?.name).toBe('Untitled Card');
  });

  it('preserves special characters in card name', () => {
    const cfg: CardConfig = {
      name: 'Nombre: Café & Música!',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };

    const built = buildConfig(cfg);
    const parsed = parseConfig(JSON.stringify(built));
    expect(parsed?.name).toBe('Nombre: Café & Música!');
  });

  it('keeps leading and trailing whitespace in name', () => {
    const cfg: CardConfig = {
      name: '  Spaced Card  ',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };

    const built = buildConfig(cfg);
    const parsed = parseConfig(JSON.stringify(built));
    expect(parsed?.name).toBe('  Spaced Card  ');
  });
});

