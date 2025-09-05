// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';

vi.mock('../export/openapi', () => ({
  generateOpenApi: vi.fn(() => 'openapi: "3.0.0"'),
}));

import { exportAssets, type CardConfig } from '../export';
import { generateOpenApi } from '../export';

describe('API export', () => {
  it('generates JSON and YAML downloads using card name', () => {
    const cfg: CardConfig = {
      name: 'Unit Test Card',
      elements: [],
      theme: 'light',
      shadow: 'none',
      lighting: 'none',
      animation: 'none',
    };

    const createObjectURL = vi.fn(() => 'blob:url');
    const revokeObjectURL = vi.fn();
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;

    const anchors: any[] = [];
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const anchor = { href: '', download: '', click: vi.fn() } as any;
      anchors.push(anchor);
      return anchor;
    });

    exportAssets(cfg);

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(generateOpenApi).toHaveBeenCalledWith(cfg);
    expect(anchors[0].download).toBe('card.json');
    expect(anchors[1].download).toBe('card.yaml');
    expect(anchors[0].click).toHaveBeenCalled();
    expect(anchors[1].click).toHaveBeenCalled();

    (URL as any).createObjectURL = origCreate;
    (URL as any).revokeObjectURL = origRevoke;
  });
});
