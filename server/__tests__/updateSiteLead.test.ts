import { describe, it, expect, vi } from 'vitest';

vi.mock('../db', () => ({ db: {} }));

import { updateSiteLead, siteStorage } from '../site-storage';

describe('updateSiteLead helper', () => {
  it('persists the HubSpot ID', async () => {
    const mockResponse = { id: 'lead1', hubspotContactId: 'hs123' } as any;
    const spy = vi
      .spyOn(siteStorage, 'updateSiteLead')
      .mockResolvedValue(mockResponse);
    const result = await updateSiteLead('lead1', 'hs123');
    expect(spy).toHaveBeenCalledWith('lead1', { hubspotContactId: 'hs123' });
    expect(result).toBe(mockResponse);
  });

  it('propagates errors from siteStorage', async () => {
    const error = new Error('db down');
    vi.spyOn(siteStorage, 'updateSiteLead').mockRejectedValue(error);
    await expect(updateSiteLead('lead1', 'hs123')).rejects.toThrow(error);
  });
});
