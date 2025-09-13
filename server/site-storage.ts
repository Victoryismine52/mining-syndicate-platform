import { sites, siteLeads, siteAnalytics, siteManagers, legalDisclaimers, siteDisclaimers, siteSlides, globalSlides, siteSections, type Site, type InsertSite, type SiteLead, type InsertSiteLead, type SiteAnalytics, type InsertSiteAnalytics, type SiteManager, type InsertSiteManager, type LegalDisclaimer, type InsertLegalDisclaimer, type SiteDisclaimer, type InsertSiteDisclaimer, type SiteSlide, type InsertSiteSlide, type GlobalSlide, type InsertGlobalSlide, type SiteSection, type InsertSiteSection } from "@shared/site-schema";
import { collectiveTasks, taskAssignments, users } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, isNull, sql } from "drizzle-orm";
import { logger } from './logger';

export interface ISiteStorage {
  // Site operations
  createSite(site: InsertSite): Promise<Site>;
  getSite(slug: string): Promise<Site | undefined>;
  getSiteById(id: string): Promise<Site | undefined>;
  updateSite(slug: string, updates: Partial<InsertSite>): Promise<Site | null>;
  updateSiteBySlug(slug: string, updates: Partial<InsertSite>): Promise<Site | null>;
  deleteSite(slug: string): Promise<void>;
  listSites(): Promise<Site[]>;

  // Lead operations (scoped to site)
  createSiteLead(lead: InsertSiteLead & { siteId: string }): Promise<SiteLead>;
  getSiteLeads(slug: string): Promise<SiteLead[]>;
  getSiteLeadsByType(slug: string, formType: string): Promise<SiteLead[]>;
  updateSiteLead(leadId: string, updates: Partial<InsertSiteLead>): Promise<SiteLead>;

  // Analytics operations
  createSiteAnalytics(analytics: InsertSiteAnalytics & { siteId: string }): Promise<SiteAnalytics>;
  getSiteAnalytics(slug: string, limit?: number): Promise<SiteAnalytics[]>;

  // Site manager operations
  addSiteManager(slug: string, userEmail: string): Promise<SiteManager>;
  removeSiteManager(slug: string, userEmail: string): Promise<void>;
  getSiteManagers(slug: string): Promise<SiteManager[]>;
  isSiteManager(slug: string, userEmail: string): Promise<boolean>;

  // Legal disclaimer operations
  createLegalDisclaimer(disclaimer: InsertLegalDisclaimer): Promise<LegalDisclaimer>;
  getLegalDisclaimer(id: string): Promise<LegalDisclaimer | undefined>;
  updateLegalDisclaimer(id: string, updates: Partial<InsertLegalDisclaimer>): Promise<LegalDisclaimer>;
  deleteLegalDisclaimer(id: string): Promise<void>;
  listLegalDisclaimers(): Promise<LegalDisclaimer[]>;
  getAvailableDisclaimersForSiteType(siteType: string): Promise<LegalDisclaimer[]>;

  // Site disclaimer attachment operations
  attachDisclaimerToSite(slug: string, disclaimerId: string, options?: { displayOrder?: string; linkText?: string }): Promise<SiteDisclaimer>;
  detachDisclaimerFromSite(slug: string, disclaimerId: string): Promise<void>;
  getSiteDisclaimers(slug: string): Promise<Array<SiteDisclaimer & { disclaimer: LegalDisclaimer }>>;

  // Slide operations
  createSiteSlide(slide: InsertSiteSlide & { siteId: string }): Promise<SiteSlide>;
  getSiteSlides(slug: string): Promise<SiteSlide[]>;
  getSiteSlide(slideId: string): Promise<SiteSlide | undefined>;
  updateSiteSlide(slideId: string, updates: Partial<InsertSiteSlide>): Promise<SiteSlide>;
  deleteSiteSlide(slideId: string): Promise<void>;
  reorderSiteSlides(slug: string, slideOrders: Array<{ id: string; slideOrder: string }>): Promise<void>;

  // Global slide operations
  getGlobalSlides(): Promise<GlobalSlide[]>;
  getGlobalSlideByKey(slideKey: string): Promise<GlobalSlide | undefined>;
  createGlobalSlide(slideData: InsertGlobalSlide): Promise<GlobalSlide>;
  updateGlobalSlideVisibility(slideKey: string, isVisible: boolean): Promise<GlobalSlide | null>;

  // Site sections operations
  getSiteSections(slug: string): Promise<SiteSection[]>;
  getSiteSection(sectionId: string): Promise<SiteSection | undefined>;
  createSiteSection(sectionData: InsertSiteSection): Promise<SiteSection>;
  updateSiteSection(sectionId: string, updates: Partial<InsertSiteSection>): Promise<SiteSection>;
  deleteSiteSection(sectionId: string): Promise<void>;

  // Site membership operations
  getUserMemberships(userId: string): Promise<any[]>;
  getSiteMemberships(siteId: string): Promise<any[]>;
  createSiteMembership(membershipData: any): Promise<any>;
  updateSiteMembership(siteId: string, userId: string, updates: any): Promise<any>;
  deleteSiteMembership(siteId: string, userId: string): Promise<boolean>;

  // Access control
  checkSiteAccess(slug: string, userEmail: string, isAdmin: boolean): Promise<boolean>;
}

export class DatabaseSiteStorage implements ISiteStorage {
  // Site operations
  async createSite(siteData: InsertSite): Promise<Site> {
    const [site] = await db
      .insert(sites)
      .values([siteData as any])
      .returning();
    return site;
  }

  async getSite(slug: string): Promise<Site | undefined> {
    // Runtime debug: Check if sites.slug is undefined
    if (!slug) {
      logger.error('getSite called with falsy slug:', slug);
      return undefined;
    }
    
    // Use raw SQL to avoid undefined column reference
    const [site] = await db
      .select()
      .from(sites)
      .where(sql`sites.site_id = ${slug}`);
    return site;
  }

  async getSiteById(id: string): Promise<Site | undefined> {
    const [site] = await db
      .select()
      .from(sites)
      .where(eq(sites.id, id));
    return site;
  }

  async updateSite(slug: string, updates: Partial<InsertSite>): Promise<Site | null> {
    try {
      // First get the current site using the slug
      const currentSite = await this.getSite(slug);
      if (!currentSite) {
        logger.error(`Site not found with slug: ${slug}`);
        return null;
      }

      logger.info(`Updating site ${currentSite.id} (slug: ${slug}) with updates:`, updates);

      // Update the site using the permanent ID
      const [updatedSite] = await db
        .update(sites)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(sites.id, currentSite.id)) // Use permanent ID for the update
        .returning();

      if (!updatedSite) {
        logger.error(`Failed to update site ${currentSite.id}`);
        return null;
      }

      logger.info(`Successfully updated site ${currentSite.id}:`, updatedSite);
      return updatedSite;
    } catch (error) {
      logger.error('Error updating site:', error);
      return null;
    }
  }

  async updateSiteBySlug(slug: string, updates: Partial<InsertSite>): Promise<Site | null> {
    return this.updateSite(slug, updates);
  }

  async deleteSite(slug: string): Promise<void> {
    await db.delete(sites).where(eq(sites.slug, slug));
  }

  async listSites(): Promise<Site[]> {
    return await db
      .select()
      .from(sites)
      .orderBy(desc(sites.createdAt));
  }

  // Lead operations
  async createSiteLead(leadData: InsertSiteLead & { siteId: string }): Promise<SiteLead> {
    const [lead] = await db
      .insert(siteLeads)
      .values([leadData as any])
      .returning();
    return lead;
  }

  async getSiteLeads(slug: string): Promise<SiteLead[]> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    return await db
      .select()
      .from(siteLeads)
      .where(eq(siteLeads.siteId, site.id))
      .orderBy(desc(siteLeads.createdAt));
  }

  async getSiteLeadsByType(slug: string, formType: string): Promise<SiteLead[]> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    return await db
      .select()
      .from(siteLeads)
      .where(and(eq(siteLeads.siteId, site.id), eq(siteLeads.formType, formType)))
      .orderBy(desc(siteLeads.createdAt));
  }

  async updateSiteLead(leadId: string, updates: Partial<InsertSiteLead>): Promise<SiteLead> {
    const [lead] = await db
      .update(siteLeads)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(siteLeads.id, leadId))
      .returning();
    return lead;
  }

  // Analytics operations
  async createSiteAnalytics(analyticsData: InsertSiteAnalytics & { siteId: string }): Promise<SiteAnalytics> {
    const [analytics] = await db
      .insert(siteAnalytics)
      .values(analyticsData)
      .returning();
    return analytics;
  }

  async getSiteAnalytics(slug: string, limit: number = 100): Promise<SiteAnalytics[]> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    return await db
      .select()
      .from(siteAnalytics)
      .where(eq(siteAnalytics.siteId, site.id))
      .orderBy(desc(siteAnalytics.createdAt))
      .limit(limit);
  }

  // Site manager operations
  async addSiteManager(slug: string, userEmail: string): Promise<SiteManager> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      throw new Error(`Site not found with slug: ${slug}`);
    }


    // Check if manager already exists (case-insensitive)
    const existingManager = await db
      .select()
      .from(siteManagers)
      .where(and(
        eq(siteManagers.siteId, site.slug),
        sql`LOWER(${siteManagers.userEmail}) = LOWER(${userEmail})`
      ))
      .limit(1);
    
    if (existingManager.length > 0) {
      throw new Error('User is already a site manager');
    }

    // Normalize email to lowercase before insertion
    const [manager] = await db
      .insert(siteManagers)
      .values({ siteId: site.slug, userEmail: userEmail.toLowerCase() })
      .returning();
    return manager;
  }

  async removeSiteManager(slug: string, userEmail: string): Promise<void> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      throw new Error(`Site not found with slug: ${slug}`);
    }

    await db
      .delete(siteManagers)
      .where(and(
        eq(siteManagers.siteId, site.slug),
        sql`LOWER(${siteManagers.userEmail}) = LOWER(${userEmail})`
      ));
  }

  async getSiteManagers(slug: string): Promise<SiteManager[]> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    return await db
      .select()
      .from(siteManagers)
      .where(eq(siteManagers.siteId, site.slug));
  }

  async isSiteManager(slug: string, userEmail: string): Promise<boolean> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return false;
    }

    const [manager] = await db
      .select()
      .from(siteManagers)
      .where(and(
        eq(siteManagers.siteId, site.slug),
        sql`LOWER(${siteManagers.userEmail}) = LOWER(${userEmail})`
      ));
    return !!manager;
  }

  // Legal disclaimer operations
  async createLegalDisclaimer(disclaimerData: InsertLegalDisclaimer): Promise<LegalDisclaimer> {
    const [disclaimer] = await db
      .insert(legalDisclaimers)
      .values(disclaimerData)
      .returning();
    return disclaimer;
  }

  async getLegalDisclaimer(id: string): Promise<LegalDisclaimer | undefined> {
    const [disclaimer] = await db
      .select()
      .from(legalDisclaimers)
      .where(eq(legalDisclaimers.id, id));
    return disclaimer;
  }

  async updateLegalDisclaimer(id: string, updates: Partial<InsertLegalDisclaimer>): Promise<LegalDisclaimer> {
    const [disclaimer] = await db
      .update(legalDisclaimers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(legalDisclaimers.id, id))
      .returning();
    return disclaimer;
  }

  async deleteLegalDisclaimer(id: string): Promise<void> {
    await db.delete(legalDisclaimers).where(eq(legalDisclaimers.id, id));
  }

  async listLegalDisclaimers(): Promise<LegalDisclaimer[]> {
    return await db
      .select()
      .from(legalDisclaimers)
      .where(eq(legalDisclaimers.isActive, true))
      .orderBy(desc(legalDisclaimers.createdAt));
  }

  async getAvailableDisclaimersForSiteType(siteType: string): Promise<LegalDisclaimer[]> {
    return await db
      .select()
      .from(legalDisclaimers)
      .where(and(
        eq(legalDisclaimers.isActive, true),
        or(
          isNull(legalDisclaimers.siteType), // Global disclaimers (siteType is null)
          eq(legalDisclaimers.siteType, siteType) // Site-type specific disclaimers
        )
      ))
      .orderBy(desc(legalDisclaimers.createdAt));
  }

  // Site disclaimer attachment operations
  async attachDisclaimerToSite(
    slug: string,
    disclaimerId: string,
    options?: { displayOrder?: string; linkText?: string }
  ): Promise<SiteDisclaimer> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      throw new Error(`Site not found with slug: ${slug}`);
    }

    const [attachment] = await db
      .insert(siteDisclaimers)
      .values({
        siteId: site.id,
        disclaimerId,
        displayOrder: options?.displayOrder || '1',
        linkText: options?.linkText,
      })
      .returning();
    return attachment;
  }

  async detachDisclaimerFromSite(slug: string, disclaimerId: string): Promise<void> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      throw new Error(`Site not found with slug: ${slug}`);
    }

    await db
      .delete(siteDisclaimers)
      .where(and(
        eq(siteDisclaimers.siteId, site.id),
        eq(siteDisclaimers.disclaimerId, disclaimerId)
      ));
  }

  async getSiteDisclaimers(slug: string): Promise<Array<SiteDisclaimer & { disclaimer: LegalDisclaimer }>> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    return await db
      .select({
        id: siteDisclaimers.id,
        siteId: siteDisclaimers.siteId,
        disclaimerId: siteDisclaimers.disclaimerId,
        displayOrder: siteDisclaimers.displayOrder,
        linkText: siteDisclaimers.linkText,
        createdAt: siteDisclaimers.createdAt,
        disclaimer: legalDisclaimers,
      })
      .from(siteDisclaimers)
      .innerJoin(legalDisclaimers, eq(siteDisclaimers.disclaimerId, legalDisclaimers.id))
      .where(eq(siteDisclaimers.siteId, site.id))
      .orderBy(siteDisclaimers.displayOrder);
  }

  // Slide operations
  async createSiteSlide(slideData: InsertSiteSlide & { siteId: string }): Promise<SiteSlide> {
    const [slide] = await db
      .insert(siteSlides)
      .values(slideData)
      .returning();
    return slide;
  }

  async getSiteSlides(slug: string): Promise<SiteSlide[]> {
    // Direct column reference using the mapped field from schema
    // The siteSlides.siteId field maps to the site_id database column
    return await db
      .select()
      .from(siteSlides)
      .where(eq(siteSlides.siteId, slug))
      .orderBy(siteSlides.slideOrder);
  }

  async getSiteSlide(slideId: string): Promise<SiteSlide | undefined> {
    const [slide] = await db
      .select()
      .from(siteSlides)
      .where(eq(siteSlides.id, slideId));
    return slide;
  }

  async updateSiteSlide(slideId: string, updates: Partial<InsertSiteSlide>): Promise<SiteSlide> {
    const [slide] = await db
      .update(siteSlides)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(siteSlides.id, slideId))
      .returning();
    return slide;
  }

  async deleteSiteSlide(slideId: string): Promise<void> {
    await db.delete(siteSlides).where(eq(siteSlides.id, slideId));
  }

  async reorderSiteSlides(slug: string, slideOrders: Array<{ id: string; slideOrder: string }>): Promise<void> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      throw new Error(`Site not found with slug: ${slug}`);
    }

    // Update each slide's order in a transaction
    await db.transaction(async (tx) => {
      for (const { id, slideOrder } of slideOrders) {
        await tx
          .update(siteSlides)
          .set({ slideOrder, updatedAt: new Date() })
          .where(and(eq(siteSlides.id, id), eq(siteSlides.siteId, site.id)));
      }
    });
  }

  // Global slide operations
  async getGlobalSlides(): Promise<GlobalSlide[]> {
    return await db
      .select()
      .from(globalSlides)
      .orderBy(globalSlides.displayPosition, globalSlides.createdAt);
  }

  async getGlobalSlideByKey(slideKey: string): Promise<GlobalSlide | undefined> {
    const [slide] = await db
      .select()
      .from(globalSlides)
      .where(eq(globalSlides.slideKey, slideKey));
    return slide;
  }

  async createGlobalSlide(slideData: InsertGlobalSlide): Promise<GlobalSlide> {
    const [slide] = await db
      .insert(globalSlides)
      .values([slideData as any])
      .returning();
    return slide;
  }

  async updateGlobalSlideVisibility(slideKey: string, isVisible: boolean): Promise<GlobalSlide | null> {
    const [slide] = await db
      .update(globalSlides)
      .set({
        isVisible,
        updatedAt: new Date(),
      })
      .where(eq(globalSlides.slideKey, slideKey))
      .returning();
    return slide || null;
  }

  async deleteGlobalSlide(slideKey: string): Promise<boolean> {
    const result = await db
      .delete(globalSlides)
      .where(eq(globalSlides.slideKey, slideKey));

    return (result.rowCount ?? 0) > 0;
  }

  async updateGlobalSlideOrder(slideKey: string, order: number): Promise<GlobalSlide | null> {
    const [slide] = await db
      .update(globalSlides)
      .set({
        createdAt: new Date(Date.now() + order * 1000), // Use createdAt for ordering
        updatedAt: new Date()
      })
      .where(eq(globalSlides.slideKey, slideKey))
      .returning();

    return slide || null;
  }

  // Site sections operations
  async getSiteSections(slug: string): Promise<SiteSection[]> {
    // First get the site to get the permanent ID
    const site = await this.getSite(slug);
    if (!site) {
      return [];
    }

    const sections = await db
      .select()
      .from(siteSections)
      .where(eq(siteSections.siteId, site.id))
      .orderBy(siteSections.displayOrder, siteSections.createdAt);
    return sections;
  }

  async getSiteSection(sectionId: string): Promise<SiteSection | undefined> {
    const [section] = await db
      .select()
      .from(siteSections)
      .where(eq(siteSections.id, sectionId));
    return section;
  }

  async createSiteSection(sectionData: InsertSiteSection): Promise<SiteSection> {
    // sectionData.siteId should now always be a permanent UUID ID
    const [section] = await db
      .insert(siteSections)
      .values([sectionData as any])
      .returning();
    return section;
  }

  async updateSiteSection(sectionId: string, updates: Partial<InsertSiteSection>): Promise<SiteSection> {
    const [section] = await db
      .update(siteSections)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(siteSections.id, sectionId))
      .returning();
    return section;
  }

  async deleteSiteSection(sectionId: string): Promise<void> {
    await db
      .delete(siteSections)
      .where(eq(siteSections.id, sectionId));
  }

  // Site membership operations
  async getUserMemberships(userId: string): Promise<any[]> {
    try {
      const { siteMemberships } = await import("@shared/schema");
      const memberships = await db
        .select()
        .from(siteMemberships)
        .where(eq(siteMemberships.userId, userId));
      return memberships;
    } catch (error) {
      logger.error('Error getting user memberships:', error);
      return [];
    }
  }

  async getSiteMemberships(siteId: string): Promise<any[]> {
    try {
      const { siteMemberships, users } = await import("@shared/schema");
      const memberships = await db
        .select({
          id: siteMemberships.id,
          userId: siteMemberships.userId,
          siteId: siteMemberships.siteId,
          membershipStatus: siteMemberships.membershipStatus,
          membershipType: siteMemberships.membershipType,
          collectiveRole: siteMemberships.collectiveRole,
          joinedAt: siteMemberships.joinedAt,
          permissions: siteMemberships.permissions,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profilePicture: users.profilePicture
        })
        .from(siteMemberships)
        .leftJoin(users, eq(siteMemberships.userId, users.id))
        .where(eq(siteMemberships.siteId, siteId));
      return memberships;
    } catch (error) {
      logger.error('Error getting site memberships:', error);
      return [];
    }
  }

  async createSiteMembership(membershipData: any): Promise<any> {
    try {
      const { siteMemberships } = await import("@shared/schema");
      const [membership] = await db
        .insert(siteMemberships)
        .values({
          userId: membershipData.userId,
          siteId: membershipData.siteId,
          membershipStatus: membershipData.membershipStatus || 'active',
          membershipType: membershipData.membershipType || 'standard',
          collectiveRole: membershipData.collectiveRole || 'member',
          permissions: membershipData.permissions || {}
        })
        .returning();
      return membership;
    } catch (error) {
      logger.error('Error creating site membership:', error);
      throw error;
    }
  }

  async updateSiteMembership(siteId: string, userId: string, updates: any): Promise<any> {
    try {
      const { siteMemberships } = await import("@shared/schema");
      const [membership] = await db
        .update(siteMemberships)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(siteMemberships.siteId, siteId),
          eq(siteMemberships.userId, userId)
        ))
        .returning();
      return membership;
    } catch (error) {
      logger.error('Error updating site membership:', error);
      throw error;
    }
  }

  async deleteSiteMembership(siteId: string, userId: string): Promise<boolean> {
    try {
      const { siteMemberships } = await import("@shared/schema");
      const result = await db
        .delete(siteMemberships)
        .where(and(
          eq(siteMemberships.siteId, siteId),
          eq(siteMemberships.userId, userId)
        ));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      logger.error('Error deleting site membership:', error);
      return false;
    }
  }

  // Access control
  async checkSiteAccess(slug: string, userEmail: string, isAdmin: boolean): Promise<boolean> {
    // Global admins have access to all sites
    if (isAdmin) {
      return true;
    }

    // Check if user is a site manager
    return await this.isSiteManager(slug, userEmail);
  }

  // Collective Messages Methods
  async getCollectiveMessages(siteId: string, options: { limit: number; offset: number }): Promise<any[]> {
    try {
      const { collectiveMessages, users } = await import("@shared/schema");
      const messages = await db
        .select({
          id: collectiveMessages.id,
          siteId: collectiveMessages.siteId,
          senderId: collectiveMessages.senderId,
          messageType: collectiveMessages.messageType,
          content: collectiveMessages.content,
          messageData: collectiveMessages.messageData,
          isEdited: collectiveMessages.isEdited,
          isDeleted: collectiveMessages.isDeleted,
          editedAt: collectiveMessages.editedAt,
          createdAt: collectiveMessages.createdAt,
          // Sender info
          senderFirstName: users.firstName,
          senderLastName: users.lastName,
          senderEmail: users.email,
          senderProfilePicture: users.profilePicture,
        })
        .from(collectiveMessages)
        .leftJoin(users, eq(collectiveMessages.senderId, users.id))
        .where(and(
          eq(collectiveMessages.siteId, siteId),
          eq(collectiveMessages.isDeleted, false)
        ))
        .orderBy(desc(collectiveMessages.createdAt))
        .limit(options.limit)
        .offset(options.offset);

      return messages;
    } catch (error) {
      logger.error('Error getting collective messages:', error);
      throw error;
    }
  }

  async createCollectiveMessage(messageData: any): Promise<any> {
    try {
      const { collectiveMessages } = await import("@shared/schema");
      const [message] = await db
        .insert(collectiveMessages)
        .values({
          siteId: messageData.siteId,
          senderId: messageData.senderId,
          content: messageData.content,
          messageType: messageData.messageType || 'text',
          messageData: messageData.messageData || {}
        })
        .returning();
      return message;
    } catch (error) {
      logger.error('Error creating collective message:', error);
      throw error;
    }
  }

  async getCollectiveMessageWithSender(messageId: string): Promise<any> {
    try {
      const { collectiveMessages, users } = await import("@shared/schema");
      const [message] = await db
        .select({
          id: collectiveMessages.id,
          siteId: collectiveMessages.siteId,
          senderId: collectiveMessages.senderId,
          messageType: collectiveMessages.messageType,
          content: collectiveMessages.content,
          messageData: collectiveMessages.messageData,
          isEdited: collectiveMessages.isEdited,
          isDeleted: collectiveMessages.isDeleted,
          editedAt: collectiveMessages.editedAt,
          createdAt: collectiveMessages.createdAt,
          // Sender info
          senderFirstName: users.firstName,
          senderLastName: users.lastName,
          senderEmail: users.email,
          senderProfilePicture: users.profilePicture,
        })
        .from(collectiveMessages)
        .leftJoin(users, eq(collectiveMessages.senderId, users.id))
        .where(eq(collectiveMessages.id, messageId));

      return message;
    } catch (error) {
      logger.error('Error getting collective message with sender:', error);
      throw error;
    }
  }

  // ===== COLLECTIVE BLOG POSTS METHODS =====

  async getCollectiveBlogPosts(siteId: string, options: {
    status?: string;
    userRole?: string;
    limit?: number;
    offset?: number
  }): Promise<any[]> {
    try {
      const { collectiveBlogPosts, users } = await import("@shared/schema");

      // Build the where conditions
      let whereConditions = [eq(collectiveBlogPosts.siteId, siteId)];

      // Apply status filter
      if (options.status) {
        whereConditions.push(eq(collectiveBlogPosts.status, options.status));
      }

      // Apply visibility filter based on user role
      if (options.userRole === 'member') {
        whereConditions.push(
          eq(collectiveBlogPosts.visibility, 'members_only'),
          eq(collectiveBlogPosts.status, 'published')
        );
      } else if (options.userRole === 'brehon') {
        whereConditions.push(
          or(
            eq(collectiveBlogPosts.visibility, 'members_only'),
            eq(collectiveBlogPosts.visibility, 'brehons_only'),
            eq(collectiveBlogPosts.visibility, 'public')
          )
        );
      }
      // site_managers and admins can see all posts (no additional filter)

      const posts = await db
        .select({
          id: collectiveBlogPosts.id,
          siteId: collectiveBlogPosts.siteId,
          title: collectiveBlogPosts.title,
          content: collectiveBlogPosts.content,
          excerpt: collectiveBlogPosts.excerpt,
          slug: collectiveBlogPosts.slug,
          authorId: collectiveBlogPosts.authorId,
          status: collectiveBlogPosts.status,
          visibility: collectiveBlogPosts.visibility,
          featuredImageUrl: collectiveBlogPosts.featuredImageUrl,
          tags: collectiveBlogPosts.tags,
          viewCount: collectiveBlogPosts.viewCount,
          likeCount: collectiveBlogPosts.likeCount,
          commentCount: collectiveBlogPosts.commentCount,
          publishedAt: collectiveBlogPosts.publishedAt,
          lastEditedBy: collectiveBlogPosts.lastEditedBy,
          lastEditedAt: collectiveBlogPosts.lastEditedAt,
          createdAt: collectiveBlogPosts.createdAt,
          updatedAt: collectiveBlogPosts.updatedAt,
          // Author info
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          authorEmail: users.email,
          authorProfilePicture: users.profilePicture,
        })
        .from(collectiveBlogPosts)
        .leftJoin(users, eq(collectiveBlogPosts.authorId, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(collectiveBlogPosts.publishedAt), desc(collectiveBlogPosts.createdAt))
        .limit(options.limit || 20)
        .offset(options.offset || 0);

      return posts;
    } catch (error) {
      logger.error('Error getting collective blog posts:', error);
      throw error;
    }
  }

  async getCollectiveBlogPostById(postId: string): Promise<any> {
    try {
      const { collectiveBlogPosts, users } = await import("@shared/schema");
      const [post] = await db
        .select({
          id: collectiveBlogPosts.id,
          siteId: collectiveBlogPosts.siteId,
          title: collectiveBlogPosts.title,
          content: collectiveBlogPosts.content,
          excerpt: collectiveBlogPosts.excerpt,
          slug: collectiveBlogPosts.slug,
          authorId: collectiveBlogPosts.authorId,
          status: collectiveBlogPosts.status,
          visibility: collectiveBlogPosts.visibility,
          featuredImageUrl: collectiveBlogPosts.featuredImageUrl,
          tags: collectiveBlogPosts.tags,
          viewCount: collectiveBlogPosts.viewCount,
          likeCount: collectiveBlogPosts.likeCount,
          commentCount: collectiveBlogPosts.commentCount,
          publishedAt: collectiveBlogPosts.publishedAt,
          lastEditedBy: collectiveBlogPosts.lastEditedBy,
          lastEditedAt: collectiveBlogPosts.lastEditedAt,
          createdAt: collectiveBlogPosts.createdAt,
          updatedAt: collectiveBlogPosts.updatedAt,
          // Author info
          authorFirstName: users.firstName,
          authorLastName: users.lastName,
          authorEmail: users.email,
          authorProfilePicture: users.profilePicture,
        })
        .from(collectiveBlogPosts)
        .leftJoin(users, eq(collectiveBlogPosts.authorId, users.id))
        .where(eq(collectiveBlogPosts.id, postId));

      return post;
    } catch (error) {
      logger.error('Error getting collective blog post by ID:', error);
      throw error;
    }
  }

  async createCollectiveBlogPost(postData: any): Promise<any> {
    try {
      const { collectiveBlogPosts } = await import("@shared/schema");
      const [post] = await db
        .insert(collectiveBlogPosts)
        .values({
          siteId: postData.siteId,
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          slug: postData.slug,
          authorId: postData.authorId,
          status: postData.status || 'draft',
          visibility: postData.visibility || 'members',
          featuredImageUrl: postData.featuredImageUrl,
          tags: postData.tags || [],
          publishedAt: postData.publishedAt
        })
        .returning();
      return post;
    } catch (error) {
      logger.error('Error creating collective blog post:', error);
      throw error;
    }
  }

  async updateCollectiveBlogPost(postId: string, updates: any): Promise<any> {
    try {
      const { collectiveBlogPosts } = await import("@shared/schema");
      const [post] = await db
        .update(collectiveBlogPosts)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(collectiveBlogPosts.id, postId))
        .returning();
      return post;
    } catch (error) {
      logger.error('Error updating collective blog post:', error);
      throw error;
    }
  }

  async deleteCollectiveBlogPost(postId: string): Promise<void> {
    try {
      const { collectiveBlogPosts } = await import("@shared/schema");
      await db
        .delete(collectiveBlogPosts)
        .where(eq(collectiveBlogPosts.id, postId));
    } catch (error) {
      logger.error('Error deleting collective blog post:', error);
      throw error;
    }
  }

  async incrementBlogPostViewCount(postId: string): Promise<void> {
    try {
      const { collectiveBlogPosts } = await import("@shared/schema");
      await db
        .update(collectiveBlogPosts)
        .set({
          viewCount: sql`COALESCE(CAST(${collectiveBlogPosts.viewCount} AS INTEGER), 0) + 1`,
          updatedAt: new Date()
        })
        .where(eq(collectiveBlogPosts.id, postId));
    } catch (error) {
      logger.error('Error incrementing blog post view count:', error);
      // Don't throw error for view count - it's not critical
    }
  }

  // ===== COLLECTIVE TASKS METHODS =====

  async getCollectiveTasks(siteId: string, options: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      const { collectiveTasks, users } = await import("@shared/schema");

      let whereConditions = [eq(collectiveTasks.siteId, siteId)];

      if (options.status) {
        whereConditions.push(eq(collectiveTasks.status, options.status));
      }

      const tasks = await db
        .select({
          id: collectiveTasks.id,
          siteId: collectiveTasks.siteId,
          title: collectiveTasks.title,
          description: collectiveTasks.description,
          status: collectiveTasks.status,
          priority: collectiveTasks.priority,
          dueDate: collectiveTasks.dueDate,
          createdById: collectiveTasks.createdById,
          completedAt: collectiveTasks.completedAt,
          createdAt: collectiveTasks.createdAt,
          updatedAt: collectiveTasks.updatedAt,
          // Creator info
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfilePicture: users.profilePicture,
        })
        .from(collectiveTasks)
        .leftJoin(users, eq(collectiveTasks.createdBy, users.id))
        .where(and(...whereConditions))
        .orderBy(desc(collectiveTasks.createdAt))
        .limit(options.limit || 50)
        .offset(options.offset || 0);

      return tasks;
    } catch (error) {
      logger.error('Error getting collective tasks:', error);
      throw error;
    }
  }

  async getCollectiveTaskById(taskId: string): Promise<any> {
    try {
      const { collectiveTasks, users } = await import("@shared/schema");
      const [task] = await db
        .select({
          id: collectiveTasks.id,
          siteId: collectiveTasks.siteId,
          title: collectiveTasks.title,
          description: collectiveTasks.description,
          status: collectiveTasks.status,
          priority: collectiveTasks.priority,
          dueDate: collectiveTasks.dueDate,
          createdById: collectiveTasks.createdById,
          completedAt: collectiveTasks.completedAt,
          createdAt: collectiveTasks.createdAt,
          updatedAt: collectiveTasks.updatedAt,
          // Creator info
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfilePicture: users.profilePicture,
        })
        .from(collectiveTasks)
        .leftJoin(users, eq(collectiveTasks.createdBy, users.id))
        .where(eq(collectiveTasks.id, taskId));

      return task;
    } catch (error) {
      logger.error('Error getting collective task by ID:', error);
      throw error;
    }
  }

  async createCollectiveTask(taskData: any): Promise<any> {
    try {
      const { collectiveTasks } = await import("@shared/schema");
      const [task] = await db
        .insert(collectiveTasks)
        .values({
          siteId: taskData.siteId,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status || 'pending',
          priority: taskData.priority || 'medium',
          dueDate: taskData.dueDate,
          createdById: taskData.createdById
        })
        .returning();
      return task;
    } catch (error) {
      logger.error('Error creating collective task:', error);
      throw error;
    }
  }

  async updateCollectiveTask(taskId: string, updates: any): Promise<any> {
    try {
      const { collectiveTasks } = await import("@shared/schema");
      const [task] = await db
        .update(collectiveTasks)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(collectiveTasks.id, taskId))
        .returning();
      return task;
    } catch (error) {
      logger.error('Error updating collective task:', error);
      throw error;
    }
  }

  async deleteCollectiveTask(taskId: string): Promise<void> {
    try {
      const { collectiveTasks } = await import("@shared/schema");
      await db
        .delete(collectiveTasks)
        .where(eq(collectiveTasks.id, taskId));
    } catch (error) {
      logger.error('Error deleting collective task:', error);
      throw error;
    }
  }

  async getUserTasks(siteId: string, userId: string): Promise<any[]> {
    try {
      logger.info(`getUserTasks called with siteId: ${siteId}, userId: ${userId}`);

      // Use raw SQL to avoid Drizzle schema import issues
      const result = await db.execute(sql`
        SELECT
          ct.id,
          ct.site_id as "siteId",
          ct.title,
          ct.description,
          ct.status,
          ct.priority,
          ct.task_type,
          ct.task_config,
          ct.due_date,
          ct.created_by,
          ct.created_at,
          ct.updated_at,
          ct.estimated_duration,
          ct.assigned_to_role,
          ct.max_assignments,
          -- Assignment info
          ta.id as "assignmentId",
          ta.created_at as "assignedAt",
          ta.status as "assignmentStatus",
          ta.completed_at,
          -- Creator info
          u.first_name as "creatorFirstName",
          u.last_name as "creatorLastName",
          u.email as "creatorEmail",
          u.profile_picture as "creatorProfilePicture"
        FROM task_assignments ta
        INNER JOIN collective_tasks ct ON ta.task_id = ct.id
        LEFT JOIN users u ON ct.created_by = u.id
        WHERE ta.user_id = ${userId} AND ct.site_id = ${siteId}
        ORDER BY ta.created_at DESC
      `);

      logger.info(`Query executed successfully, found ${result.rows.length} tasks for user ${userId}`);

      // Transform the raw database results to match the expected format
      const tasks = result.rows.map((row: any) => ({
        id: row.id,
        siteId: row.siteId,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        task_type: row.task_type,
        task_config: row.task_config,
        due_date: row.due_date,
        created_by: row.created_by,
        completed_at: row.completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        estimated_duration: row.estimated_duration,
        assigned_to_role: row.assigned_to_role,
        max_assignments: row.max_assignments,
        assignmentId: row.assignmentId,
        assignedAt: row.assignedAt,
        assignmentStatus: row.assignmentStatus,
        creatorFirstName: row.creatorFirstName,
        creatorLastName: row.creatorLastName,
        creatorEmail: row.creatorEmail,
        creatorProfilePicture: row.creatorProfilePicture,
      }));

      logger.info('Sample task data:', tasks[0] ? JSON.stringify(tasks[0], null, 2) : 'No tasks found');
      return tasks;
    } catch (error) {
      logger.error('Error getting user tasks:', error);
      throw error;
    }
  }

  async assignTaskToUser(taskId: string, userId: string, assignedById: string): Promise<any> {
    try {
      const [assignment] = await db
        .insert(taskAssignments)
        .values({
          taskId,
          userId,
          assignedBy: assignedById
        })
        .returning();
      return assignment;
    } catch (error) {
      logger.error('Error assigning task to user:', error);
      throw error;
    }
  }

  async unassignTaskFromUser(taskId: string, userId: string): Promise<void> {
    try {
      const { taskAssignments } = await import("@shared/schema");
      await db
        .delete(taskAssignments)
        .where(and(
          eq(taskAssignments.taskId, taskId),
          eq(taskAssignments.userId, userId)
        ));
    } catch (error) {
      logger.error('Error unassigning task from user:', error);
      throw error;
    }
  }

  async getTaskAssignments(taskId: string): Promise<any[]> {
    try {
      const { taskAssignments, users } = await import("@shared/schema");

      const assignments = await db
        .select({
          id: taskAssignments.id,
          taskId: taskAssignments.taskId,
          userId: taskAssignments.userId,
          assignedById: taskAssignments.assignedById,
          assignedAt: taskAssignments.assignedAt,
          // User info
          userFirstName: users.firstName,
          userLastName: users.lastName,
          userEmail: users.email,
          userProfilePicture: users.profilePicture,
        })
        .from(taskAssignments)
        .leftJoin(users, eq(taskAssignments.userId, users.id))
        .where(eq(taskAssignments.taskId, taskId))
        .orderBy(desc(taskAssignments.createdAt));

      return assignments;
    } catch (error) {
      logger.error('Error getting task assignments:', error);
      throw error;
    }
  }
}

export let siteStorage: ISiteStorage = new DatabaseSiteStorage();

export function setSiteStorage(storage: ISiteStorage) {
  siteStorage = storage;
}

export async function updateSiteLead(
  leadId: string,
  hubspotContactId: string
) {
  return siteStorage.updateSiteLead(leadId, { hubspotContactId });
}