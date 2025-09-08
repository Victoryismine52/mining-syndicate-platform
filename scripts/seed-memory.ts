import fs from 'fs';
import path from 'path';
import slides from '../server/seeds/slides.json' assert { type: 'json' };

const seed = {
  sites: [
    {
      id: 'demo-id',
      siteId: 'demo',
      name: 'Demo Site',
      siteType: 'standard',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteLeads: [],
  siteAnalytics: [],
  siteManagers: [
    {
      id: 'admin-manager-id',
      siteId: 'demo',
      userEmail: 'admin@local.dev',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  legalDisclaimers: [],
  siteDisclaimers: [],
  siteSlides: (slides as any[]).map((s, i) => ({
    id: `slide-${i+1}`,
    siteId: 'demo',
    title: s.title,
    imageUrl: s.imageUrl,
    slideOrder: s.slideOrder,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  })),
  globalSlides: [],
  siteSections: [],
  siteMemberships: []
};

const outPath = path.join(process.cwd(), 'server/data/seed.json');
fs.writeFileSync(outPath, JSON.stringify(seed, null, 2));
console.log('Seed data written to', outPath);
