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
  siteLeads: [
    {
      id: 'lead-1',
      siteId: 'demo',
      identifier: 'lead@example.com',
      identifierType: 'email',
      formType: 'learn-more',
      submissionCount: '1',
      lastFormSubmission: '2024-01-01T00:00:00.000Z',
      formData: {},
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'lead-2',
      siteId: 'demo',
      identifier: 'investor@example.com',
      identifierType: 'email',
      formType: 'mining-pool',
      submissionCount: '1',
      lastFormSubmission: '2024-01-02T00:00:00.000Z',
      formData: {
        miningAmount: '50000',
        investmentHorizon: '12-months'
      },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    },
    {
      id: 'lead-3',
      siteId: 'demo',
      identifier: 'lender@example.com',
      identifierType: 'email',
      formType: 'lending-pool',
      submissionCount: '1',
      lastFormSubmission: '2024-01-03T00:00:00.000Z',
      formData: {
        lendingAmount: '25000',
        interestRate: '8.5%'
      },
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z'
    }
  ],
  siteAnalytics: [
    {
      id: 'analytic-1',
      siteId: 'demo',
      eventType: 'page_view',
      eventData: {
        page: '/presentation',
        timestamp: '2024-01-01T10:00:00.000Z',
        userAgent: 'Mozilla/5.0 Test Browser'
      },
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'analytic-2',
      siteId: 'demo',
      eventType: 'form_submission',
      eventData: {
        formType: 'learn-more',
        submissionId: 'lead-1'
      },
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'analytic-3',
      siteId: 'demo',
      eventType: 'slide_view',
      eventData: {
        slideId: 'slide-3',
        slideTitle: 'Investment Opportunities',
        viewDuration: 45
      },
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteManagers: [
    {
      id: 'admin-manager-id',
      siteId: 'demo',
      userEmail: 'admin@local.dev',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'manager-2',
      siteId: 'demo',
      userEmail: 'manager@local.dev',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  legalDisclaimers: [
    {
      id: 'disclaimer-1',
      title: 'Investment Risk Disclaimer',
      content: 'All investments involve risk and potential loss of principal. Mining operations are subject to regulatory, environmental, and market risks.',
      siteTypes: ['standard'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'disclaimer-2',
      title: 'Privacy Policy',
      content: 'We collect and process personal information in accordance with applicable privacy laws and regulations.',
      siteTypes: ['standard'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'disclaimer-3',
      title: 'Terms of Service',
      content: 'By accessing this site, you agree to our terms of service and conditions of use.',
      siteTypes: ['standard'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteDisclaimers: [
    {
      id: 'site-disclaimer-1',
      siteId: 'demo',
      disclaimerId: 'disclaimer-1',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'site-disclaimer-2',
      siteId: 'demo',
      disclaimerId: 'disclaimer-2',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'site-disclaimer-3',
      siteId: 'demo',
      disclaimerId: 'disclaimer-3',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteSlides: (slides as any[]).map((s, i) => ({
    id: `slide-${i+1}`,
    siteId: 'demo',
    title: s.title,
    imageUrl: `/uploads/${s.imageUrl}`,
    slideOrder: s.slideOrder,
    description: s.description,
    isVisible: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  })),
  globalSlides: [
    {
      id: 'global-slide-1',
      slideKey: 'global-intro',
      title: 'Mining Syndicate Global Introduction',
      imageUrl: '/uploads/global-intro.jpg',
      isVisible: true,
      slideOrder: '0',
      description: 'Global introduction slide for all sites',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'global-slide-2',
      slideKey: 'global-closing',
      title: 'Thank You & Next Steps',
      imageUrl: '/uploads/global-closing.jpg',
      isVisible: true,
      slideOrder: '999',
      description: 'Global closing slide for all sites',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteSections: [
    {
      id: 'section-1',
      siteId: 'demo',
      title: 'Investment Overview',
      slug: 'investment-overview',
      description: 'Overview of mining investment opportunities',
      sectionOrder: '1',
      isVisible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'section-2',
      siteId: 'demo',
      title: 'Technology & Operations',
      slug: 'technology-operations',
      description: 'Technology stack and operational details',
      sectionOrder: '2',
      isVisible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'section-3',
      siteId: 'demo',
      title: 'Financial Projections',
      slug: 'financial-projections',
      description: 'Financial analysis and projections',
      sectionOrder: '3',
      isVisible: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  siteMemberships: [
    {
      id: 'membership-1',
      siteId: 'demo',
      userId: 'user-1',
      userEmail: 'member1@example.com',
      role: 'member',
      status: 'active',
      joinedAt: '2024-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'membership-2',
      siteId: 'demo',
      userId: 'user-2',
      userEmail: 'member2@example.com',
      role: 'member',
      status: 'active',
      joinedAt: '2024-01-02T00:00:00.000Z',
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    }
  ]
};

const outPath = path.join(process.cwd(), 'server/data/seed.json');
fs.writeFileSync(outPath, JSON.stringify(seed, null, 2));
console.log('Seed data written to', outPath);
