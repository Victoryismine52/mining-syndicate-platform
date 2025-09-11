import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, index, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  googleId: text("google_id").unique(),
  profilePicture: text("profile_picture"),
  role: text("role").notNull().default("generic"), // admin, site_manager, generic
  isAdmin: boolean("is_admin").default(false), // Keep for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
});

export const accessRequests = pgTable("access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, denied
  requestedAt: timestamp("requested_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Access list table for managing who can access the admin panel
export const accessList = pgTable("access_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  addedBy: varchar("added_by").references(() => users.id),
  addedAt: timestamp("added_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  interests: jsonb("interests").$type<string[]>().notNull(),
  foundersUnitCount: text("founders_unit_count"),
  foundersUnitIds: jsonb("founders_unit_ids").$type<string[]>(),
  hasMoreThanTenUnits: boolean("has_more_than_ten_units").default(false),
  lendingAmount: text("lending_amount"),
  formType: text("form_type").default("learn-more"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const slideSettings = pgTable("slide_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slideIndex: text("slide_index").notNull().unique(),
  isVisible: boolean("is_visible").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
    primaryColor?: string;
    secondaryColor?: string;
  }>().default({}),
  
  // Form configuration
  hubspotFormIds: jsonb('hubspot_form_ids').$type<{
    learnMore?: string;
    miningPool?: string;
    lendingPool?: string;
  }>().default({}),
  
  // Site settings
  isActive: boolean('is_active').default(true),
  password: varchar('password', { length: 100 }), // Optional site-specific password
  passwordProtected: boolean('password_protected').default(false), // Toggle password protection
  
  // Site type and branding
  siteType: varchar('site_type', { length: 50 }).default('mining-syndicate-pitch'), // Site template type: 'mining-syndicate-pitch', 'pitch-site', 'collective'
  logoUrl: text('logo_url'), // Custom logo URL
  footerText: varchar('footer_text', { length: 255 }), // Custom footer text
  qrCodeUrl: text('qr_code_url'), // Generated QR code image URL
  
  // Collective-specific settings
  collectiveSettings: jsonb('collective_settings').$type<{
    joinType?: 'public' | 'private'; // Open join vs request approval
    visibility?: 'visible' | 'hidden'; // Publicly searchable vs invite only
    maxMembers?: number; // Optional member limit
    autoApprove?: boolean; // Auto-approve join requests for private collectives
    description?: string; // Collective description
    welcomeMessage?: string; // Message shown to new members
  }>().default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site-scoped leads table
export const siteLeads = pgTable('site_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Contact information
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  company: varchar('company', { length: 255 }),
  
  // Form type and interests
  formType: varchar('form_type', { length: 50 }).notNull(), // 'learn-more', 'mining-pool', 'lending-pool'
  interests: jsonb('interests').$type<string[]>().default([]),
  message: text('message'),
  
  // Investment amounts for specific forms
  miningAmount: varchar('mining_amount', { length: 100 }),
  lendingAmount: varchar('lending_amount', { length: 100 }),
  
  // Tracking
  hubspotContactId: varchar('hubspot_contact_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Site analytics table
export const siteAnalytics = pgTable('site_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
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

// Field library - predefined field types that can be used in forms
export const fieldLibrary = pgTable('field_library', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(), // e.g., 'firstName', 'email', 'phone'
  label: varchar('label', { length: 255 }).notNull(), // Display label e.g., 'First Name'
  dataType: varchar('data_type', { length: 50 }).notNull(), // 'text', 'email', 'phone', 'number', 'select', 'textarea', 'checkbox', 'radio', 'extensible_list'
  defaultPlaceholder: varchar('default_placeholder', { length: 255 }), // Default placeholder text e.g., 'John Doe'
  defaultValidation: jsonb('default_validation').$type<{
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[]; // For select and radio fields
    description?: string; // For radio fields - prompt text before options
    // Extensible list configuration
    itemType?: 'string' | 'object'; // Type of items in the list
    minItems?: number; // Minimum number of items
    maxItems?: number; // Maximum number of items (undefined = unlimited)
    itemLabel?: string; // Label for individual items (e.g., "Unit ID")
    itemPlaceholder?: string; // Placeholder for individual items
  }>().default({}),
  // Translations for multi-language support
  translations: jsonb('translations').$type<{
    [languageCode: string]: {
      label: string;
      placeholder?: string;
      description?: string; // For radio field descriptions
      options?: string[]; // Translated options for select/radio fields
      itemLabel?: string; // For extensible list item labels
      itemPlaceholder?: string; // For extensible list item placeholders
    };
  }>().default({}),
  isSystemField: boolean('is_system_field').default(true), // System fields vs custom fields
  category: varchar('category', { length: 50 }).default('general'), // 'contact', 'investment', 'preferences'
  createdAt: timestamp('created_at').defaultNow(),
});

// Card Templates table - Library of reusable card configurations (forms, hyperlinks, etc.)
export const formTemplates = pgTable('form_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).default('general'), // 'general', 'investment', 'contact', etc.
  cardType: varchar('card_type', { length: 50 }).notNull().default('form'), // 'form', 'hyperlink', 'youtube', 'join-card'
  identifierField: varchar('identifier_field', { length: 100 }).default('email'), // Primary identifier for lead aggregation (forms only)
  libraryVisibility: varchar('library_visibility', { length: 20 }).default('visible'), // 'visible', 'hidden' - controls visibility in admin card library
  
  // Card configuration - supports both form and hyperlink cards
  config: jsonb('config').$type<{
    title: string;
    subtitle?: string;
    description?: string; // Card-level description
    icon?: string;
    color?: string;
    buttonText?: string;
    successMessage?: string;
    requiresApproval?: boolean;
    hubspotFormId?: string;
    formType?: string; // 'general', 'mining-pool', 'lending-pool', etc. (forms only)
    // Hyperlink card properties
    url?: string; // Target URL for hyperlink cards
    openInNewTab?: boolean; // Whether to open in new tab/window
    logo?: string; // Logo URL for hyperlink cards
    // YouTube card properties
    youtubeVideoId?: string; // YouTube video ID for youtube cards
    vimeoVideoId?: string; // Vimeo video ID for vimeo cards
    vimeoHash?: string; // Vimeo hash parameter for private/unlisted videos
    autoplay?: boolean; // Whether to autoplay the video
    showControls?: boolean; // Whether to show video controls
    // Join card properties
    joinText?: string; // Custom text for join button (default: "Join Collective")
    joinSuccessMessage?: string; // Message shown after successful join
    joinRequiresApproval?: boolean; // Whether join requires approval (overrides collective setting)
  }>().notNull(),
  
  isActive: boolean('is_active').default(true),
  isBuiltIn: boolean('is_built_in').default(false), // System templates vs custom
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Form template fields - junction table linking forms to field library
export const formTemplateFields = pgTable('form_template_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  formTemplateId: uuid('form_template_id').notNull().references(() => formTemplates.id, { onDelete: 'cascade' }),
  fieldLibraryId: uuid('field_library_id').notNull().references(() => fieldLibrary.id, { onDelete: 'cascade' }),
  isRequired: boolean('is_required').default(false),
  order: varchar('order', { length: 10 }).notNull().default('0'), // Field display order
  customValidation: jsonb('custom_validation').$type<{
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[]; // Override default options for select fields
  }>().default({}),
  customLabel: varchar('custom_label', { length: 255 }), // Override default field label
  placeholder: varchar('placeholder', { length: 255 }), // Custom placeholder text
  createdAt: timestamp('created_at').defaultNow(),
});

// Landing Page Templates table - Predefined landing page configurations
export const landingPageTemplates = pgTable('landing_page_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 50 }).default('business'), // 'business', 'tech', 'investment', etc.
  
  // Layout configuration
  layout: jsonb('layout').$type<{
    heroStyle: 'gradient' | 'image' | 'video' | 'minimal';
    cardLayout: 'grid' | 'carousel' | 'list';
    colorScheme: 'blue' | 'purple' | 'green' | 'red' | 'custom';
    numCards: number;
  }>().notNull(),
  
  // Content configuration
  content: jsonb('content').$type<{
    hero: {
      title: string;
      subtitle: string;
      backgroundImage?: string;
      ctaText?: string;
    };
    cards: Array<{
      id: string;
      title: string;
      description: string;
      icon: string;
      buttonText: string;
      formTemplateId?: string;
    }>;
    footer?: {
      companyName: string;
      links?: Array<{ text: string; url: string }>;
    };
  }>().notNull(),
  
  isActive: boolean('is_active').default(true),
  isBuiltIn: boolean('is_built_in').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site sections - configurable sections on each site
export const siteSections = pgTable('site_sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  name: varchar('name', { length: 100 }).notNull(), // e.g., "Hero Video", "Contact Forms", "Resources"
  description: text('description'),
  displayOrder: varchar('display_order', { length: 10 }).default('1'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site Form Assignments table - Which forms are available on which sites
export const siteFormAssignments = pgTable('site_form_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  formTemplateId: uuid('form_template_id').notNull().references(() => formTemplates.id, { onDelete: 'cascade' }),
  sectionId: uuid('section_id').references(() => siteSections.id, { onDelete: 'set null' }), // NEW: assign cards to sections
  
  // Assignment configuration
  displayOrder: varchar('display_order', { length: 10 }).default('1'),
  cardPosition: varchar('card_position', { length: 20 }).default('center'), // 'left', 'center', 'right'
  isActive: boolean('is_active').default(true),
  
  // Language selection for this site
  selectedLanguage: varchar('selected_language', { length: 10 }).default('en'), // Language code for field translations
  
  // Override form config for this specific site
  overrideConfig: jsonb('override_config').$type<{
    title?: string;
    subtitle?: string;
    icon?: string;
    color?: string;
    buttonText?: string;
    includeInPresentation?: boolean;
    // Display Configuration Options
    description?: string;
    displaySize?: 'small' | 'medium' | 'large'; // Card size
    displayStyle?: 'default' | 'compact' | 'featured'; // Visual style
    showIcon?: boolean; // Whether to show the icon
    showSubtitle?: boolean; // Whether to show subtitle
    borderStyle?: 'none' | 'solid' | 'dashed' | 'gradient'; // Border style
    shadowLevel?: 'none' | 'subtle' | 'medium' | 'strong'; // Drop shadow
    customCss?: string; // Custom CSS classes
  }>().default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
});

// Site Landing Config table - Enhanced landing page configuration per site
export const siteLandingConfigs = pgTable('site_landing_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').unique().notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Template reference (optional - can customize without template)
  landingPageTemplateId: uuid('landing_page_template_id').references(() => landingPageTemplates.id),
  
  // Complete landing page configuration
  config: jsonb('config').$type<{
    hero: {
      title: string;
      subtitle: string;
      backgroundImage?: string;
      backgroundVideo?: string;
      ctaText?: string;
      ctaAction?: 'scroll' | 'presentation' | 'external';
      ctaUrl?: string;
    };
    branding: {
      primaryColor: string;
      secondaryColor: string;
      logoUrl?: string;
      companyName: string;
      companyUrl?: string;
    };
    layout: {
      heroStyle: 'gradient' | 'image' | 'video' | 'minimal';
      cardLayout: 'grid' | 'carousel' | 'list';
      showPresentationButton: boolean;
      customCss?: string;
    };
    seo: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  }>().notNull(),
  
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Site memberships - Links users to sites they're members of
export const siteMemberships = pgTable('site_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Membership metadata
  membershipStatus: varchar('membership_status', { length: 50 }).notNull().default('active'), // active, inactive, pending, suspended
  membershipType: varchar('membership_type', { length: 50 }).default('standard'), // standard, premium, vip, etc. (site-defined)
  joinedAt: timestamp('joined_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // Optional expiration for membership
  
  // Site-specific permissions (JSON for flexibility)
  permissions: jsonb('permissions').$type<{
    canViewContent?: boolean;
    canPostComments?: boolean;
    canAccessPremium?: boolean;
    customPermissions?: Record<string, any>;
  }>().default({}),
  
  // Collective role hierarchy: ard_brehon > brehon > member
  collectiveRole: varchar('collective_role', { length: 50 }).default('member'), // 'ard_brehon', 'brehon', 'member'
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Ensure unique membership per user per site
  userSiteMembershipUnique: index('user_site_membership_unique').on(table.userId, table.siteId),
}));

// Site member profiles - Site-specific user data that inherits from master account
export const siteMemberProfiles = pgTable('site_member_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  membershipId: uuid('membership_id').notNull().references(() => siteMemberships.id, { onDelete: 'cascade' }),
  
  // Override master account data (if null, inherits from users table)
  displayName: varchar('display_name', { length: 255 }), // Override for firstName + lastName
  bio: text('bio'), // Site-specific bio
  avatar: text('avatar'), // Override profilePicture from master account
  
  // Site-specific profile data
  preferences: jsonb('preferences').$type<{
    theme?: string;
    notifications?: boolean;
    privacy?: Record<string, any>;
    siteSpecificSettings?: Record<string, any>;
  }>().default({}),
  
  // Site-specific activity metadata
  lastActiveAt: timestamp('last_active_at'),
  totalPosts: varchar('total_posts', { length: 10 }).default('0'),
  reputation: varchar('reputation', { length: 10 }).default('0'),
  
  // Custom site-specific fields (JSON for flexibility)
  customFields: jsonb('custom_fields').$type<Record<string, any>>().default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Collective join requests - For private collectives that require approval
export const collectiveJoinRequests = pgTable('collective_join_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Request details
  requestMessage: text('request_message'), // Optional message from the user
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'approved', 'rejected'
  
  // Review information
  reviewedBy: varchar('reviewed_by').references(() => users.id), // Site manager or brehon who reviewed
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'), // Optional notes from reviewer
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Ensure unique request per user per collective
  userSiteRequestUnique: index('user_site_request_unique').on(table.userId, table.siteId),
}));

// Collective tasks - Core task management for collectives
export const collectiveTasks = pgTable('collective_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Task details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  taskType: varchar('task_type', { length: 50 }).notNull().default('general'), // 'document_review', 'verification', 'general', 'upload'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: varchar('status', { length: 20 }).notNull().default('open'), // 'open', 'in_progress', 'completed', 'cancelled'
  
  // Task metadata
  dueDate: timestamp('due_date'),
  estimatedDuration: varchar('estimated_duration', { length: 50 }), // e.g., "2 hours", "1 day"
  
  // Task configuration (flexible JSON for different task types)
  taskConfig: jsonb('task_config').$type<{
    // Document tasks
    documentUrl?: string; // Document to download/review
    requiresUpload?: boolean; // Whether user needs to upload response
    uploadFileTypes?: string[]; // Allowed file types for upload
    maxFileSize?: number; // Max file size in MB
    
    // Verification tasks
    verificationSteps?: string[]; // List of steps to complete
    requiresPhotos?: boolean; // Whether photos are required
    requiresSignature?: boolean; // Whether signature is required
    
    // General configuration
    instructions?: string; // Detailed instructions
    resources?: Array<{ name: string; url: string }>; // Helpful resources
    checklist?: string[]; // Tasks checklist items
  }>().default({}),
  
  // Assignment metadata
  createdBy: varchar('created_by').notNull().references(() => users.id), // Brehon who created the task
  assignedToRole: varchar('assigned_to_role', { length: 50 }), // 'all_members', 'specific_users', 'brehons'
  maxAssignments: varchar('max_assignments', { length: 10 }), // Maximum number of people who can be assigned
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Task assignments - Links tasks to specific users
export const taskAssignments = pgTable('task_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => collectiveTasks.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Assignment details
  assignedBy: varchar('assigned_by').notNull().references(() => users.id), // Brehon who made assignment
  status: varchar('status', { length: 20 }).notNull().default('assigned'), // 'assigned', 'in_progress', 'submitted', 'approved', 'rejected'
  
  // Progress tracking
  startedAt: timestamp('started_at'),
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
  
  // Submission data
  submissionData: jsonb('submission_data').$type<{
    notes?: string; // User's notes/comments
    uploadedFiles?: Array<{
      filename: string;
      url: string;
      uploadedAt: string;
    }>; // Files uploaded by user
    verificationData?: Record<string, any>; // Data from verification steps
    timeSpent?: string; // Time user spent on task
  }>().default({}),
  
  // Review information
  reviewedBy: varchar('reviewed_by').references(() => users.id), // Brehon who reviewed
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'), // Feedback from reviewer
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Ensure unique assignment per user per task
  userTaskAssignmentUnique: index('user_task_assignment_unique').on(table.userId, table.taskId),
}));

// Collective messages - Chat system for collective members
export const collectiveMessages = pgTable('collective_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Message details
  senderId: varchar('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageType: varchar('message_type', { length: 20 }).default('text'), // 'text', 'file', 'system', 'task_notification'
  content: text('content').notNull(),
  
  // Message metadata
  messageData: jsonb('message_data').$type<{
    // File messages
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    
    // Task notifications
    taskId?: string;
    taskAction?: 'created' | 'assigned' | 'completed' | 'updated';
    
    // System messages
    systemType?: 'member_joined' | 'member_left' | 'role_changed' | 'task_created';
    
    // Mentions and replies
    mentions?: string[]; // User IDs mentioned in message
    replyToId?: string; // ID of message being replied to
  }>().default({}),
  
  // Message status
  isEdited: boolean('is_edited').default(false),
  isDeleted: boolean('is_deleted').default(false),
  editedAt: timestamp('edited_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Collective blog posts - Blog system for collectives
export const collectiveBlogPosts = pgTable('collective_blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  siteId: uuid('site_id').notNull().references(() => sites.id, { onDelete: 'cascade' }), // Reference permanent ID
  
  // Post details
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'), // Short description/summary
  slug: varchar('slug', { length: 255 }).notNull(), // URL-friendly version of title
  
  // Post metadata
  authorId: varchar('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // 'draft', 'published', 'archived'
  visibility: varchar('visibility', { length: 20 }).default('members'), // 'members', 'brehons', 'public'
  
  // Post content settings
  featuredImageUrl: text('featured_image_url'), // Optional header image
  tags: jsonb('tags').$type<string[]>().default([]), // Tags for categorization
  
  // Engagement tracking
  viewCount: varchar('view_count', { length: 10 }).default('0'),
  likeCount: varchar('like_count', { length: 10 }).default('0'),
  commentCount: varchar('comment_count', { length: 10 }).default('0'),
  
  // Publishing metadata
  publishedAt: timestamp('published_at'),
  lastEditedBy: varchar('last_edited_by').references(() => users.id),
  lastEditedAt: timestamp('last_edited_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Ensure unique slug per site
  siteSlugUnique: index('site_slug_unique').on(table.siteId, table.slug),
}));

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  siteMemberships: many(siteMemberships),
  joinRequests: many(collectiveJoinRequests),
  createdTasks: many(collectiveTasks, { relationName: 'createdTasks' }),
  taskAssignments: many(taskAssignments),
  sentMessages: many(collectiveMessages),
  blogPosts: many(collectiveBlogPosts),
}));

export const sitesRelations = relations(sites, ({ many, one }) => ({
  leads: many(siteLeads),
  analytics: many(siteAnalytics),
  formAssignments: many(siteFormAssignments),
  landingConfig: one(siteLandingConfigs),
  memberships: many(siteMemberships),
  joinRequests: many(collectiveJoinRequests),
  tasks: many(collectiveTasks),
  messages: many(collectiveMessages),
  blogPosts: many(collectiveBlogPosts),
}));

export const siteMembershipsRelations = relations(siteMemberships, ({ one }) => ({
  user: one(users, {
    fields: [siteMemberships.userId],
    references: [users.id],
  }),
  site: one(sites, {
    fields: [siteMemberships.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  profile: one(siteMemberProfiles, {
    fields: [siteMemberships.id],
    references: [siteMemberProfiles.membershipId],
  }),
}));

export const siteMemberProfilesRelations = relations(siteMemberProfiles, ({ one }) => ({
  membership: one(siteMemberships, {
    fields: [siteMemberProfiles.membershipId],
    references: [siteMemberships.id],
  }),
}));

export const siteLeadsRelations = relations(siteLeads, ({ one }) => ({
  site: one(sites, {
    fields: [siteLeads.siteId],
    references: [sites.id], // Reference permanent ID
  }),
}));

export const siteAnalyticsRelations = relations(siteAnalytics, ({ one }) => ({
  site: one(sites, {
    fields: [siteAnalytics.siteId],
    references: [sites.id], // Reference permanent ID
  }),
}));

export const fieldLibraryRelations = relations(fieldLibrary, ({ many }) => ({
  formFields: many(formTemplateFields),
}));

export const formTemplatesRelations = relations(formTemplates, ({ many }) => ({
  siteAssignments: many(siteFormAssignments),
  fields: many(formTemplateFields),
}));

export const formTemplateFieldsRelations = relations(formTemplateFields, ({ one }) => ({
  formTemplate: one(formTemplates, {
    fields: [formTemplateFields.formTemplateId],
    references: [formTemplates.id],
  }),
  fieldLibrary: one(fieldLibrary, {
    fields: [formTemplateFields.fieldLibraryId],
    references: [fieldLibrary.id],
  }),
}));

export const siteFormAssignmentsRelations = relations(siteFormAssignments, ({ one }) => ({
  site: one(sites, {
    fields: [siteFormAssignments.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  formTemplate: one(formTemplates, {
    fields: [siteFormAssignments.formTemplateId],
    references: [formTemplates.id],
  }),
}));

export const siteLandingConfigsRelations = relations(siteLandingConfigs, ({ one }) => ({
  site: one(sites, {
    fields: [siteLandingConfigs.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  landingPageTemplate: one(landingPageTemplates, {
    fields: [siteLandingConfigs.landingPageTemplateId],
    references: [landingPageTemplates.id],
  }),
}));

export const landingPageTemplatesRelations = relations(landingPageTemplates, ({ many }) => ({
  siteLandingConfigs: many(siteLandingConfigs),
}));

// Collective relationships
export const collectiveJoinRequestsRelations = relations(collectiveJoinRequests, ({ one }) => ({
  site: one(sites, {
    fields: [collectiveJoinRequests.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  user: one(users, {
    fields: [collectiveJoinRequests.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [collectiveJoinRequests.reviewedBy],
    references: [users.id],
  }),
}));

export const collectiveTasksRelations = relations(collectiveTasks, ({ one, many }) => ({
  site: one(sites, {
    fields: [collectiveTasks.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  creator: one(users, {
    fields: [collectiveTasks.createdBy],
    references: [users.id],
  }),
  assignments: many(taskAssignments),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  task: one(collectiveTasks, {
    fields: [taskAssignments.taskId],
    references: [collectiveTasks.id],
  }),
  user: one(users, {
    fields: [taskAssignments.userId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [taskAssignments.assignedBy],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [taskAssignments.reviewedBy],
    references: [users.id],
  }),
}));

export const collectiveMessagesRelations = relations(collectiveMessages, ({ one }) => ({
  site: one(sites, {
    fields: [collectiveMessages.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  sender: one(users, {
    fields: [collectiveMessages.senderId],
    references: [users.id],
  }),
}));

export const collectiveBlogPostsRelations = relations(collectiveBlogPosts, ({ one }) => ({
  site: one(sites, {
    fields: [collectiveBlogPosts.siteId],
    references: [sites.id], // Reference permanent ID
  }),
  author: one(users, {
    fields: [collectiveBlogPosts.authorId],
    references: [users.id],
  }),
  lastEditor: one(users, {
    fields: [collectiveBlogPosts.lastEditedBy],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  googleId: true,
  profilePicture: true,
  role: true,
});

// Site membership types
export type SiteMembership = typeof siteMemberships.$inferSelect;
export type InsertSiteMembership = typeof siteMemberships.$inferInsert;
export type SiteMemberProfile = typeof siteMemberProfiles.$inferSelect;
export type InsertSiteMemberProfile = typeof siteMemberProfiles.$inferInsert;

// Schema for creating site memberships
export const insertSiteMembershipSchema = createInsertSchema(siteMemberships).pick({
  userId: true,
  siteId: true,
  membershipStatus: true,
  membershipType: true,
  permissions: true,
  expiresAt: true,
});

// Schema for creating site member profiles
export const insertSiteMemberProfileSchema = createInsertSchema(siteMemberProfiles).pick({
  membershipId: true,
  displayName: true,
  bio: true,
  avatar: true,
  preferences: true,
  customFields: true,
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).pick({
  email: true,
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  interests: true,
}).extend({
  firstName: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "First name can only contain letters, spaces, hyphens, apostrophes, and periods")
    .refine((name) => name.trim().length > 0, "First name cannot be empty")
    .refine((name) => !name.trim().startsWith(' ') && !name.trim().endsWith(' '), "First name cannot start or end with spaces"),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Last name can only contain letters, spaces, hyphens, apostrophes, and periods")
    .refine((name) => name.trim().length > 0, "Last name cannot be empty")
    .refine((name) => !name.trim().startsWith(' ') && !name.trim().endsWith(' '), "Last name cannot start or end with spaces"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[\d\s\-\(\)\+\.]+$/, "Please enter a valid phone number"),
});

export const insertSlideSettingSchema = createInsertSchema(slideSettings).pick({
  slideIndex: true,
  isVisible: true,
});

// Site schemas for validation
export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteLeadSchema = createInsertSchema(siteLeads).omit({
  id: true,
  createdAt: true,
  hubspotContactId: true,
  ipAddress: true,
  userAgent: true,
  referrer: true,
});

export const insertSiteAnalyticsSchema = createInsertSchema(siteAnalytics).omit({
  id: true,
  createdAt: true,
});

// Form Template schemas
export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLandingPageTemplateSchema = createInsertSchema(landingPageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSiteFormAssignmentSchema = createInsertSchema(siteFormAssignments).omit({
  id: true,
  createdAt: true,
});

export const insertSiteLandingConfigSchema = createInsertSchema(siteLandingConfigs).omit({
  id: true,
  updatedAt: true,
});

// Field Library schemas
export const insertFieldLibrarySchema = createInsertSchema(fieldLibrary).omit({
  id: true,
  createdAt: true,
});

export const insertFormTemplateFieldSchema = createInsertSchema(formTemplateFields).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type AccessListEntry = typeof accessList.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;

// Add needsApproval for temporary user objects during auth flow
export interface UserWithApproval extends User {
  needsApproval?: boolean;
}
export type InsertSlideSetting = z.infer<typeof insertSlideSettingSchema>;
export type SlideSetting = typeof slideSettings.$inferSelect;

// Site types
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type SiteLead = typeof siteLeads.$inferSelect;
export type InsertSiteLead = z.infer<typeof insertSiteLeadSchema>;
export type SiteAnalytics = typeof siteAnalytics.$inferSelect;
export type InsertSiteAnalytics = z.infer<typeof insertSiteAnalyticsSchema>;

// Form Library types
export type FormTemplate = typeof formTemplates.$inferSelect;
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type LandingPageTemplate = typeof landingPageTemplates.$inferSelect;
export type InsertLandingPageTemplate = z.infer<typeof insertLandingPageTemplateSchema>;
export type SiteFormAssignment = typeof siteFormAssignments.$inferSelect;
export type InsertSiteFormAssignment = z.infer<typeof insertSiteFormAssignmentSchema>;
export type SiteSection = typeof siteSections.$inferSelect;
export type InsertSiteSection = typeof siteSections.$inferInsert;
export type SiteLandingConfig = typeof siteLandingConfigs.$inferSelect;
export type InsertSiteLandingConfig = z.infer<typeof insertSiteLandingConfigSchema>;

// Field Library types  
export type FieldLibrary = typeof fieldLibrary.$inferSelect;
export type InsertFieldLibrary = z.infer<typeof insertFieldLibrarySchema>;
export type FormTemplateField = typeof formTemplateFields.$inferSelect;
export type InsertFormTemplateField = z.infer<typeof insertFormTemplateFieldSchema>;

// Collective types and schemas
export const insertCollectiveJoinRequestSchema = createInsertSchema(collectiveJoinRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CollectiveJoinRequest = typeof collectiveJoinRequests.$inferSelect;
export type InsertCollectiveJoinRequest = z.infer<typeof insertCollectiveJoinRequestSchema>;

export const insertCollectiveTaskSchema = createInsertSchema(collectiveTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CollectiveTask = typeof collectiveTasks.$inferSelect;
export type InsertCollectiveTask = z.infer<typeof insertCollectiveTaskSchema>;

export const insertTaskAssignmentSchema = createInsertSchema(taskAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type InsertTaskAssignment = z.infer<typeof insertTaskAssignmentSchema>;

export const insertCollectiveMessageSchema = createInsertSchema(collectiveMessages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CollectiveMessage = typeof collectiveMessages.$inferSelect;
export type InsertCollectiveMessage = z.infer<typeof insertCollectiveMessageSchema>;

export const insertCollectiveBlogPostSchema = createInsertSchema(collectiveBlogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CollectiveBlogPost = typeof collectiveBlogPosts.$inferSelect;
export type InsertCollectiveBlogPost = z.infer<typeof insertCollectiveBlogPostSchema>;

