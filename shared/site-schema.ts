import { z } from 'zod';
import { 
  pgTable, 
  varchar, 
  timestamp, 
  boolean, 
  text, 
  jsonb,
  uuid,
  serial,
  integer
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Sites table - Each site has unique configuration
export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).unique().notNull(), // Custom slug/URL identifier
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Presentation configuration
  presentationImages: jsonb('presentation_images').$type<string[]>().default([]),
  landingConfig: jsonb('landing_config').$type<{
    heroTitle?: string;
    heroSubtitle?: string;
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    brandGradient?: string; // New field for site-specific gradient
    formsTitle?: string; // Forms section title
    formsDescription?: string; // Forms section description
  }>().default({}),
  
  // Form configuration
  hubspotFormIds: jsonb('hubspot_form_ids').$type<{
    learnMore?: string;
    miningPool?: string;
    lendingPool?: string;
  }>().default({}),
  
  // Site settings
  isActive: boolean('is_active').default(true),
  isLaunched: boolean('is_launched').default(false), // Controls site visibility to non-managers
  password: varchar('password', { length: 100 }), // Optional site-specific password
  passwordProtected: boolean('password_protected').default(false), // Toggle password protection
  
  // Site type and branding
  siteType: varchar('site_type', { length: 50 }).notNull(), // Site template type
  logoUrl: text('logo_url'), // Custom logo URL
  footerText: varchar('footer_text', { length: 255 }), // Custom footer text
  qrCodeUrl: text('qr_code_url'), // Generated QR code image URL
  
  // HubSpot integration
  hubspotEnabled: boolean('hubspot_enabled').default(false), // Enable/disable HubSpot integration
  hubspotApiKey: text('hubspot_api_key'), // HubSpot Private App API key
  hubspotPortalId: varchar('hubspot_portal_id', { length: 100 }), // Optional HubSpot Portal ID
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site managers table - Junction table for site access control
export const siteManagers = pgTable('site_managers', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  userEmail: varchar('user_email', { length: 255 }).notNull(), // Email of the site manager
  createdAt: timestamp('created_at').defaultNow(),
});

// Site-scoped leads table with identifier-based aggregation
export const siteLeads = pgTable('site_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  
  // Identifier-based aggregation fields
  identifier: varchar('identifier', { length: 255 }).notNull(), // Primary identifier value (email, googleId, etc.)
  identifierType: varchar('identifier_type', { length: 50 }).notNull().default('email'), // Type of identifier
  
  // Form submission tracking
  formTemplateId: uuid('form_template_id'), // Reference to form template used
  formType: varchar('form_type', { length: 50 }).notNull(), // 'learn-more', 'mining-pool', 'lending-pool'
  lastFormSubmission: timestamp('last_form_submission').defaultNow(),
  submissionCount: varchar('submission_count', { length: 10 }).default('1'),
  
  // Dynamic form data - stores all form field values as key-value pairs
  formData: jsonb('form_data').$type<Record<string, any>>().default({}),
  
  // Core contact information (extracted from formData for easier querying)
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  
  // Legacy support for existing data
  interests: jsonb('interests').$type<string[]>().default([]),
  message: text('message'),
  miningAmount: varchar('mining_amount', { length: 100 }),
  lendingAmount: varchar('lending_amount', { length: 100 }),
  
  // Tracking
  hubspotContactId: varchar('hubspot_contact_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site analytics table
export const siteAnalytics = pgTable('site_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  
  // Event tracking
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'page_view', 'form_open', 'form_submit', etc.
  eventData: jsonb('event_data').default({}),
  
  // Session info
  sessionId: varchar('session_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Legal disclaimers table - Document library for legal disclaimers
export const legalDisclaimers = pgTable('legal_disclaimers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(), // Friendly name like "Conduit Mining Syndicate US Legal Disclaimer"
  version: varchar('version', { length: 50 }).notNull().default('1.0'), // Version like "1.0", "2.1", etc.
  language: varchar('language', { length: 10 }).notNull().default('en'), // Language code: en, es, zh, ja, etc.
  content: text('content').notNull(), // Full disclaimer text
  
  // Scoping
  siteType: varchar('site_type', { length: 100 }), // NULL = global, specific value = site type only
  
  // Metadata
  description: text('description'), // Optional description of the disclaimer
  isActive: boolean('is_active').default(true), // Whether this disclaimer is active/available
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site disclaimers junction table - Links sites to their attached disclaimers
export const siteDisclaimers = pgTable('site_disclaimers', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  disclaimerId: uuid('disclaimer_id').notNull().references(() => legalDisclaimers.id, { onDelete: 'cascade' }),
  
  // Display options
  displayOrder: varchar('display_order', { length: 10 }).default('1'), // Order in footer/menu
  linkText: varchar('link_text', { length: 100 }), // Custom link text, defaults to disclaimer name
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Site-specific slides table - Each site can have its own custom slide set
export const siteSlides = pgTable('site_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull().references(() => sites.siteId, { onDelete: 'cascade' }),
  
  // Slide content
  title: varchar('title', { length: 255 }).notNull(),
  imageUrl: text('image_url').notNull(), // Object storage URL or static asset path
  slideOrder: text('slide_order').notNull(), // Position in presentation (0, 1, 2, etc.)
  
  // Slide settings
  isVisible: boolean('is_visible').default(true),
  slideType: varchar('slide_type', { length: 50 }).default('image'), // 'image', 'interactive', etc.
  
  // Metadata
  description: text('description'), // Optional slide description
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Global slides table - System-wide slides that appear on all sites (like final action slide)
export const globalSlides = pgTable('global_slides', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Slide identification
  slideKey: varchar('slide_key', { length: 100 }).unique().notNull(), // Unique identifier like 'final-action-cards'
  title: varchar('title', { length: 255 }).notNull(),
  slideType: varchar('slide_type', { length: 50 }).default('action-cards'), // 'action-cards', 'image', etc.
  
  // Display settings
  isVisible: boolean('is_visible').default(true), // Global toggle for this slide
  displayPosition: varchar('display_position', { length: 50 }).default('end'), // 'start', 'end', 'custom'
  
  // Content configuration (for action cards slide)
  cardConfig: jsonb('card_config').$type<{
    cards: Array<{
      title: string;
      description: string;
      buttonText: string;
      actionType: 'learn-more' | 'mining-pool' | 'lending-pool' | 'join';
      icon?: string;
      color?: string;
    }>;
    backgroundColor?: string;
    textColor?: string;
  }>().default({ cards: [] }),
  
  // Alternative content (for image slides)
  imageUrl: text('image_url'),
  content: text('content'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site sections table - For organizing cards into sections
export const siteSections = pgTable('site_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: varchar('site_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(1),
  isVisible: boolean('is_visible').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Define relationships
export const sitesRelations = relations(sites, ({ many }) => ({
  leads: many(siteLeads),
  analytics: many(siteAnalytics),
  managers: many(siteManagers),
  disclaimers: many(siteDisclaimers),
  slides: many(siteSlides),
}));

export const siteManagersRelations = relations(siteManagers, ({ one }) => ({
  site: one(sites, {
    fields: [siteManagers.siteId],
    references: [sites.siteId],
  }),
}));

export const siteLeadsRelations = relations(siteLeads, ({ one }) => ({
  site: one(sites, {
    fields: [siteLeads.siteId],
    references: [sites.siteId],
  }),
}));

export const siteAnalyticsRelations = relations(siteAnalytics, ({ one }) => ({
  site: one(sites, {
    fields: [siteAnalytics.siteId],
    references: [sites.siteId],
  }),
}));

export const legalDisclaimersRelations = relations(legalDisclaimers, ({ many }) => ({
  sites: many(siteDisclaimers),
}));

export const siteDisclaimersRelations = relations(siteDisclaimers, ({ one }) => ({
  site: one(sites, {
    fields: [siteDisclaimers.siteId],
    references: [sites.siteId],
  }),
  disclaimer: one(legalDisclaimers, {
    fields: [siteDisclaimers.disclaimerId],
    references: [legalDisclaimers.id],
  }),
}));

export const siteSlidesRelations = relations(siteSlides, ({ one }) => ({
  site: one(sites, {
    fields: [siteSlides.siteId],
    references: [sites.siteId],
  }),
}));

// Zod schemas for validation
export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteLeadSchema = createInsertSchema(siteLeads).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
  userAgent: true,
  referrer: true,
}).extend({
  email: z.string().email().max(255).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  company: z.string().max(255).optional(),
  identifier: z.string().max(255),
  identifierType: z.string().max(50).default('email'),
  formType: z.string().max(50),
  submissionCount: z.string().max(10).default('1'),
  miningAmount: z.string().max(100).optional(),
  lendingAmount: z.string().max(100).optional(),
  siteId: z.string().max(50),
});

export const insertSiteAnalyticsSchema = createInsertSchema(siteAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertSiteManagerSchema = createInsertSchema(siteManagers).omit({
  id: true,
  createdAt: true,
});

export const insertLegalDisclaimerSchema = createInsertSchema(legalDisclaimers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteDisclaimerSchema = createInsertSchema(siteDisclaimers).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSlideSchema = createInsertSchema(siteSlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalSlideSchema = createInsertSchema(globalSlides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteSectionSchema = createInsertSchema(siteSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type SiteLead = typeof siteLeads.$inferSelect;
export type InsertSiteLead = z.infer<typeof insertSiteLeadSchema>;
export type SiteAnalytics = typeof siteAnalytics.$inferSelect;
export type InsertSiteAnalytics = z.infer<typeof insertSiteAnalyticsSchema>;
export type SiteManager = typeof siteManagers.$inferSelect;
export type InsertSiteManager = z.infer<typeof insertSiteManagerSchema>;
export type LegalDisclaimer = typeof legalDisclaimers.$inferSelect;
export type InsertLegalDisclaimer = z.infer<typeof insertLegalDisclaimerSchema>;
export type SiteDisclaimer = typeof siteDisclaimers.$inferSelect;
export type InsertSiteDisclaimer = z.infer<typeof insertSiteDisclaimerSchema>;
export type SiteSlide = typeof siteSlides.$inferSelect;
export type InsertSiteSlide = z.infer<typeof insertSiteSlideSchema>;
export type GlobalSlide = typeof globalSlides.$inferSelect;
export type InsertGlobalSlide = z.infer<typeof insertGlobalSlideSchema>;
export type SiteSection = typeof siteSections.$inferSelect;
export type InsertSiteSection = z.infer<typeof insertSiteSectionSchema>;
