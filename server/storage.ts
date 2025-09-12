import { users, leads, slideSettings, accessRequests, accessList, formTemplates, fieldLibrary, formTemplateFields, landingPageTemplates, siteFormAssignments, siteLandingConfigs, siteMemberships, siteMemberProfiles, type User, type InsertUser, type Lead, type InsertLead, type SlideSetting, type InsertSlideSetting, type AccessRequest, type InsertAccessRequest, type AccessListEntry, type UpsertUser, type FormTemplate, type InsertFormTemplate, type FieldLibrary, type InsertFieldLibrary, type FormTemplateField, type InsertFormTemplateField, type LandingPageTemplate, type InsertLandingPageTemplate, type SiteFormAssignment, type InsertSiteFormAssignment, type SiteLandingConfig, type InsertSiteLandingConfig, type SiteMembership, type InsertSiteMembership, type SiteMemberProfile, type InsertSiteMemberProfile } from "@shared/schema";
import { siteLeads, sites, type SiteLead } from "@shared/site-schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from './logger';

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  checkUserAccess(email: string): Promise<boolean>;
  createLead(lead: InsertLead & { 
    foundersUnitCount?: number; 
    foundersUnitIds?: string[]; 
    hasMoreThanTenUnits?: boolean;
    lendingAmount?: string;
    formType?: string;
  }): Promise<Lead>;
  getLeads(): Promise<Lead[]>;
  getAllSiteLeads(): Promise<(SiteLead & { siteName: string })[]>;
  getSlideSettings(): Promise<SlideSetting[]>;
  updateSlideSetting(slideIndex: string, isVisible: boolean): Promise<SlideSetting>;
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequests(): Promise<AccessRequest[]>;
  updateAccessRequest(id: string, status: string, reviewedBy: string): Promise<AccessRequest>;
  getAccessList(): Promise<AccessListEntry[]>;
  addToAccessList(email: string, addedBy: string): Promise<AccessListEntry>;
  getAllUsers(): Promise<User[]>;

  // Form Template operations
  getFormTemplates(): Promise<FormTemplate[]>;
  getFormTemplate(id: string): Promise<FormTemplate | undefined>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  updateFormTemplate(id: string, updates: Partial<InsertFormTemplate>): Promise<FormTemplate>;
  deleteFormTemplate(id: string): Promise<void>;

  // Landing Page Template operations  
  getLandingPageTemplates(): Promise<LandingPageTemplate[]>;
  getLandingPageTemplate(id: string): Promise<LandingPageTemplate | undefined>;
  createLandingPageTemplate(template: InsertLandingPageTemplate): Promise<LandingPageTemplate>;
  updateLandingPageTemplate(id: string, updates: Partial<InsertLandingPageTemplate>): Promise<LandingPageTemplate>;
  deleteLandingPageTemplate(id: string): Promise<void>;

  // Site Form Assignment operations
  getSiteFormAssignments(siteId: string): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null })[]>;
  getSiteFormAssignmentById(id: string): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null }) | null>;
  assignFormToSite(assignment: InsertSiteFormAssignment): Promise<SiteFormAssignment>;
  updateSiteFormAssignment(id: string, updates: Partial<InsertSiteFormAssignment>): Promise<SiteFormAssignment>;
  removeFormFromSite(id: string): Promise<void>;

  // Site Landing Config operations
  getSiteLandingConfig(siteId: string): Promise<SiteLandingConfig | undefined>;
  createSiteLandingConfig(config: InsertSiteLandingConfig): Promise<SiteLandingConfig>;
  updateSiteLandingConfig(siteId: string, updates: Partial<InsertSiteLandingConfig>): Promise<SiteLandingConfig>;
  
  // Field Library operations
  getFieldLibrary(): Promise<FieldLibrary[]>;
  getFieldLibraryItem(id: string): Promise<FieldLibrary | undefined>;
  createFieldLibraryItem(field: InsertFieldLibrary): Promise<FieldLibrary>;
  updateFieldLibraryItem(id: string, updates: Partial<InsertFieldLibrary>): Promise<FieldLibrary>;
  deleteFieldLibraryItem(id: string): Promise<void>;
  
  // Form Template Fields operations
  getFormTemplateFields(formTemplateId: string): Promise<(FormTemplateField & { fieldLibrary: FieldLibrary })[]>;
  createFormTemplateField(field: InsertFormTemplateField): Promise<FormTemplateField>;
  updateFormTemplateField(id: string, updates: Partial<InsertFormTemplateField>): Promise<FormTemplateField>;
  deleteFormTemplateField(id: string): Promise<void>;

  // Site Membership operations
  getUserSiteMemberships(userId: string): Promise<(SiteMembership & { site: { siteId: string; name: string } })[]>;
  getSiteMemberships(siteId: string): Promise<(SiteMembership & { user: { firstName: string; lastName: string; email: string } })[]>;
  createSiteMembership(membership: InsertSiteMembership): Promise<SiteMembership>;
  updateSiteMembership(id: string, updates: Partial<InsertSiteMembership>): Promise<SiteMembership>;
  deleteSiteMembership(id: string): Promise<void>;
  
  // Site Member Profile operations
  getSiteMemberProfile(membershipId: string): Promise<SiteMemberProfile | undefined>;
  createSiteMemberProfile(profile: InsertSiteMemberProfile): Promise<SiteMemberProfile>;
  updateSiteMemberProfile(id: string, updates: Partial<InsertSiteMemberProfile>): Promise<SiteMemberProfile>;
  deleteSiteMemberProfile(id: string): Promise<void>;

}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser & { isAdmin?: boolean }): Promise<User> {
    // Check if user is bnelson523@gmail.com and make them admin (case-insensitive)
    const isAdmin = insertUser.email.toLowerCase() === "bnelson523@gmail.com" || insertUser.isAdmin || false;
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isAdmin,
      })
      .returning();
    return user;
  }

  async createLead(insertLead: InsertLead & { 
    foundersUnitCount?: number; 
    foundersUnitIds?: string[]; 
    hasMoreThanTenUnits?: boolean;
    lendingAmount?: string;
    formType?: string;
  }): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        firstName: insertLead.firstName,
        lastName: insertLead.lastName,
        email: insertLead.email,
        phone: insertLead.phone,
        interests: insertLead.interests as string[],
        foundersUnitCount: insertLead.foundersUnitCount?.toString(),
        foundersUnitIds: insertLead.foundersUnitIds as string[] | undefined,
        hasMoreThanTenUnits: insertLead.hasMoreThanTenUnits || false,
        lendingAmount: insertLead.lendingAmount,
        formType: insertLead.formType || "learn-more"
      })
      .returning();
    return lead;
  }

  async getLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(leads.createdAt);
  }

  async getAllSiteLeads(): Promise<(SiteLead & { siteName: string })[]> {
    return await db
      .select({
        id: siteLeads.id,
        siteId: siteLeads.siteId,
        siteName: sites.name,
        firstName: siteLeads.firstName,
        lastName: siteLeads.lastName,
        email: siteLeads.email,
        phone: siteLeads.phone,
        company: siteLeads.company,
        formType: siteLeads.formType,
        interests: siteLeads.interests,
        message: siteLeads.message,
        miningAmount: siteLeads.miningAmount,
        lendingAmount: siteLeads.lendingAmount,
        hubspotContactId: siteLeads.hubspotContactId,
        ipAddress: siteLeads.ipAddress,
        userAgent: siteLeads.userAgent,
        referrer: siteLeads.referrer,
        createdAt: siteLeads.createdAt,
      })
      .from(siteLeads)
      .leftJoin(sites, eq(siteLeads.siteId, sites.siteId))
      .orderBy(desc(siteLeads.createdAt));
  }

  async getSlideSettings(): Promise<SlideSetting[]> {
    return await db.select().from(slideSettings);
  }

  async updateSlideSetting(slideIndex: string, isVisible: boolean): Promise<SlideSetting> {
    const [existing] = await db.select().from(slideSettings).where(eq(slideSettings.slideIndex, slideIndex));
    
    if (existing) {
      const [updated] = await db
        .update(slideSettings)
        .set({ isVisible, updatedAt: new Date() })
        .where(eq(slideSettings.slideIndex, slideIndex))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(slideSettings)
        .values({ slideIndex, isVisible })
        .returning();
      return created;
    }
  }

  async createAccessRequest(insertRequest: InsertAccessRequest): Promise<AccessRequest> {
    const [request] = await db
      .insert(accessRequests)
      .values(insertRequest)
      .returning();
    return request;
  }

  async getAccessRequests(): Promise<AccessRequest[]> {
    return await db.select().from(accessRequests).orderBy(desc(accessRequests.requestedAt));
  }

  async updateAccessRequest(id: string, status: string, reviewedBy: string): Promise<AccessRequest> {
    const [updated] = await db
      .update(accessRequests)
      .set({ 
        status, 
        reviewedBy, 
        reviewedAt: new Date() 
      })
      .where(eq(accessRequests.id, id))
      .returning();
    return updated;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    logger.info('Upserting user with data:', userData);
    
    // Determine role based on email and access list
    let userRole = "generic"; // Default role for all users
    const hasAdminAccess = await this.checkUserAccess(userData.email);
    
    if (userData.email === "bnelson523@gmail.com") {
      userRole = "admin";
    } else if (hasAdminAccess) {
      userRole = "site_manager"; // Users in access list become site managers
    }
    
    // Ensure firstName and lastName are not null
    const userDataWithDefaults = {
      ...userData,
      firstName: userData.firstName || userData.email?.split("@")[0] || "Unknown",
      lastName: userData.lastName || "User",
      role: userRole,
      isAdmin: userData.email === "bnelson523@gmail.com" || false, // Keep for backward compatibility
    };
    
    logger.info('Final user data:', userDataWithDefaults);
    
    const [user] = await db
      .insert(users)
      .values(userDataWithDefaults)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userDataWithDefaults.firstName,
          lastName: userDataWithDefaults.lastName,
          googleId: userDataWithDefaults.googleId,
          profilePicture: userDataWithDefaults.profilePicture,
          role: userDataWithDefaults.role,
          // Don't update ID or admin status to avoid foreign key issues
        },
      })
      .returning();
    return user;
  }

  async checkUserAccess(email: string): Promise<boolean> {
    // bnelson523@gmail.com always has access (case-insensitive)
    if (email.toLowerCase() === "bnelson523@gmail.com") {
      return true;
    }

    // Check if user is in the access list (case-insensitive)
    const [accessEntry] = await db.select().from(accessList).where(sql`LOWER(${accessList.email}) = LOWER(${email})`);
    return !!accessEntry;
  }

  async getAccessList(): Promise<AccessListEntry[]> {
    return await db.select().from(accessList).orderBy(desc(accessList.addedAt));
  }

  async addToAccessList(email: string, addedBy: string): Promise<AccessListEntry> {
    // Initialize bnelson523@gmail.com as the first entry if access list is empty
    const existing = await db.select().from(accessList);
    if (existing.length === 0 && email !== "bnelson523@gmail.com") {
      await db.insert(accessList).values({
        email: "bnelson523@gmail.com",
        addedBy: null,
      });
    }

    const [entry] = await db
      .insert(accessList)
      .values({
        email,
        addedBy,
      })
      .onConflictDoNothing()
      .returning();
    
    // If entry wasn't created (conflict), fetch existing one
    if (!entry) {
      const [existing] = await db.select().from(accessList).where(eq(accessList.email, email));
      return existing;
    }
    
    return entry;
  }

  async removeFromAccessList(email: string): Promise<void> {
    // Don't allow removing bnelson523@gmail.com
    if (email === "bnelson523@gmail.com") {
      return;
    }
    
    await db.delete(accessList).where(eq(accessList.email, email));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Form Template operations
  async getFormTemplates(): Promise<FormTemplate[]> {
    // Return all templates - filtering for library selection happens in the UI
    return await db.select().from(formTemplates)
      .orderBy(desc(formTemplates.createdAt));
  }

  async getFormTemplate(id: string): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id));
    return template || undefined;
  }

  async getJoinCardTemplate(): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates)
      .where(and(
        eq(formTemplates.cardType, 'join-card'),
        eq(formTemplates.isBuiltIn, true)
      ));
    return template || undefined;
  }

  async createFormTemplate(insertTemplate: InsertFormTemplate): Promise<FormTemplate> {
    const [template] = await db.insert(formTemplates).values(insertTemplate as any).returning();
    return template;
  }

  async updateFormTemplate(id: string, updates: Partial<InsertFormTemplate>): Promise<FormTemplate> {
    const [template] = await db
      .update(formTemplates)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(formTemplates.id, id))
      .returning();
    return template;
  }

  async deleteFormTemplate(id: string): Promise<void> {
    await db.delete(formTemplates).where(eq(formTemplates.id, id));
  }

  // Field Library operations
  async getFieldLibrary(): Promise<FieldLibrary[]> {
    return await db.select().from(fieldLibrary).orderBy(fieldLibrary.category, fieldLibrary.name);
  }

  async getFieldLibraryItem(id: string): Promise<FieldLibrary | undefined> {
    const [field] = await db.select().from(fieldLibrary).where(eq(fieldLibrary.id, id));
    return field || undefined;
  }

  async createFieldLibraryItem(insertField: InsertFieldLibrary): Promise<FieldLibrary> {
    const [field] = await db.insert(fieldLibrary).values(insertField as any).returning();
    return field;
  }

  async updateFieldLibraryItem(id: string, updates: Partial<InsertFieldLibrary>): Promise<FieldLibrary> {
    const [field] = await db
      .update(fieldLibrary)
      .set(updates as any)
      .where(eq(fieldLibrary.id, id))
      .returning();
    return field;
  }

  async deleteFieldLibraryItem(id: string): Promise<void> {
    await db.delete(fieldLibrary).where(eq(fieldLibrary.id, id));
  }

  // Form Template Fields operations
  async getFormTemplateFields(formTemplateId: string): Promise<(FormTemplateField & { fieldLibrary: FieldLibrary })[]> {
    return await db
      .select({
        id: formTemplateFields.id,
        formTemplateId: formTemplateFields.formTemplateId,
        fieldLibraryId: formTemplateFields.fieldLibraryId,
        isRequired: formTemplateFields.isRequired,
        order: formTemplateFields.order,
        customValidation: formTemplateFields.customValidation,
        customLabel: formTemplateFields.customLabel,
        placeholder: formTemplateFields.placeholder,
        createdAt: formTemplateFields.createdAt,
        fieldLibrary: fieldLibrary
      })
      .from(formTemplateFields)
      .innerJoin(fieldLibrary, eq(formTemplateFields.fieldLibraryId, fieldLibrary.id))
      .where(eq(formTemplateFields.formTemplateId, formTemplateId))
      .orderBy(formTemplateFields.order);
  }

  async createFormTemplateField(insertField: InsertFormTemplateField): Promise<FormTemplateField> {
    // Check if field already exists to prevent duplicates
    const existingField = await db
      .select()
      .from(formTemplateFields)
      .where(
        and(
          eq(formTemplateFields.formTemplateId, insertField.formTemplateId),
          eq(formTemplateFields.fieldLibraryId, insertField.fieldLibraryId)
        )
      )
      .limit(1);

    if (existingField.length > 0) {
      // Field already exists, return the existing one instead of creating duplicate
      return existingField[0];
    }

    const [field] = await db.insert(formTemplateFields).values(insertField as any).returning();
    return field;
  }

  async updateFormTemplateField(id: string, updates: Partial<InsertFormTemplateField>): Promise<FormTemplateField> {
    const [field] = await db
      .update(formTemplateFields)
      .set(updates as any)
      .where(eq(formTemplateFields.id, id))
      .returning();
    return field;
  }

  async batchUpdateFieldOrders(formTemplateId: string, fieldUpdates: { id: string; order: string }[]): Promise<void> {
    // Execute all updates in parallel for better performance
    await Promise.all(
      fieldUpdates.map(update =>
        db
          .update(formTemplateFields)
          .set({ order: update.order })
          .where(eq(formTemplateFields.id, update.id))
      )
    );
  }

  async deleteFormTemplateField(id: string): Promise<void> {
    await db.delete(formTemplateFields).where(eq(formTemplateFields.id, id));
  }

  // Landing Page Template operations
  async getLandingPageTemplates(): Promise<LandingPageTemplate[]> {
    return await db.select().from(landingPageTemplates).orderBy(desc(landingPageTemplates.createdAt));
  }

  async getLandingPageTemplate(id: string): Promise<LandingPageTemplate | undefined> {
    const [template] = await db.select().from(landingPageTemplates).where(eq(landingPageTemplates.id, id));
    return template || undefined;
  }

  async createLandingPageTemplate(insertTemplate: InsertLandingPageTemplate): Promise<LandingPageTemplate> {
    const [template] = await db.insert(landingPageTemplates).values(insertTemplate as any).returning();
    return template;
  }

  async updateLandingPageTemplate(id: string, updates: Partial<InsertLandingPageTemplate>): Promise<LandingPageTemplate> {
    const [template] = await db
      .update(landingPageTemplates)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(landingPageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteLandingPageTemplate(id: string): Promise<void> {
    await db.delete(landingPageTemplates).where(eq(landingPageTemplates.id, id));
  }

  // Site Form Assignment operations
  async getSiteFormAssignments(siteId: string): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null })[]> {
    return await db
      .select({
        id: siteFormAssignments.id,
        siteId: siteFormAssignments.siteId,
        formTemplateId: siteFormAssignments.formTemplateId,
        sectionId: siteFormAssignments.sectionId,  // ✅ Added missing sectionId field
        displayOrder: siteFormAssignments.displayOrder,
        cardPosition: siteFormAssignments.cardPosition,
        isActive: siteFormAssignments.isActive,
        selectedLanguage: siteFormAssignments.selectedLanguage,  // ✅ Added missing selectedLanguage field
        overrideConfig: siteFormAssignments.overrideConfig,
        createdAt: siteFormAssignments.createdAt,
        formTemplate: formTemplates
      })
      .from(siteFormAssignments)
      .leftJoin(formTemplates, eq(siteFormAssignments.formTemplateId, formTemplates.id))
      .where(eq(siteFormAssignments.siteId, siteId));
  }

  async getSiteFormAssignmentById(id: string): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null }) | null> {
    const [assignment] = await db
      .select({
        id: siteFormAssignments.id,
        siteId: siteFormAssignments.siteId,
        formTemplateId: siteFormAssignments.formTemplateId,
        sectionId: siteFormAssignments.sectionId,
        displayOrder: siteFormAssignments.displayOrder,
        cardPosition: siteFormAssignments.cardPosition,
        isActive: siteFormAssignments.isActive,
        selectedLanguage: siteFormAssignments.selectedLanguage,
        overrideConfig: siteFormAssignments.overrideConfig,
        createdAt: siteFormAssignments.createdAt,
        formTemplate: formTemplates,
      })
      .from(siteFormAssignments)
      .leftJoin(formTemplates, eq(siteFormAssignments.formTemplateId, formTemplates.id))
      .where(eq(siteFormAssignments.id, id))
      .limit(1);

    return assignment || null;
  }

  async assignFormToSite(assignment: InsertSiteFormAssignment): Promise<SiteFormAssignment> {
    const [result] = await db.insert(siteFormAssignments).values(assignment as any).returning();
    return result;
  }

  async updateSiteFormAssignment(id: string, updates: Partial<InsertSiteFormAssignment>): Promise<SiteFormAssignment> {
    const [assignment] = await db
      .update(siteFormAssignments)
      .set(updates as any)
      .where(eq(siteFormAssignments.id, id))
      .returning();
    return assignment;
  }

  async removeFormFromSite(id: string): Promise<void> {
    await db.delete(siteFormAssignments).where(eq(siteFormAssignments.id, id));
  }

  // Site Landing Config operations
  async getSiteLandingConfig(siteId: string): Promise<SiteLandingConfig | undefined> {
    const [config] = await db.select().from(siteLandingConfigs).where(eq(siteLandingConfigs.siteId, siteId));
    return config || undefined;
  }

  async createSiteLandingConfig(insertConfig: InsertSiteLandingConfig): Promise<SiteLandingConfig> {
    const [config] = await db.insert(siteLandingConfigs).values(insertConfig as any).returning();
    return config;
  }

  async updateSiteLandingConfig(siteId: string, updates: Partial<InsertSiteLandingConfig>): Promise<SiteLandingConfig> {
    const [config] = await db
      .update(siteLandingConfigs)
      .set({ ...(updates as any), updatedAt: new Date() })
      .where(eq(siteLandingConfigs.siteId, siteId))
      .returning();
    return config;
  }

  // Site Membership operations
  async getUserSiteMemberships(userId: string): Promise<(SiteMembership & { site: { siteId: string; name: string } })[]> {
    return await db
      .select({
        id: siteMemberships.id,
        userId: siteMemberships.userId,
        siteId: siteMemberships.siteId,
        membershipStatus: siteMemberships.membershipStatus,
        membershipType: siteMemberships.membershipType,
        joinedAt: siteMemberships.joinedAt,
        expiresAt: siteMemberships.expiresAt,
        permissions: siteMemberships.permissions,
        createdAt: siteMemberships.createdAt,
        updatedAt: siteMemberships.updatedAt,
        collectiveRole: siteMemberships.collectiveRole,
        site: {
          siteId: sites.siteId,
          name: sites.name
        }
      })
      .from(siteMemberships)
      .innerJoin(sites, eq(siteMemberships.siteId, sites.siteId))
      .where(eq(siteMemberships.userId, userId));
  }

  async getSiteMemberships(siteId: string): Promise<(SiteMembership & { user: { firstName: string; lastName: string; email: string } })[]> {
    return await db
      .select({
        id: siteMemberships.id,
        userId: siteMemberships.userId,
        siteId: siteMemberships.siteId,
        membershipStatus: siteMemberships.membershipStatus,
        membershipType: siteMemberships.membershipType,
        joinedAt: siteMemberships.joinedAt,
        expiresAt: siteMemberships.expiresAt,
        permissions: siteMemberships.permissions,
        createdAt: siteMemberships.createdAt,
        updatedAt: siteMemberships.updatedAt,
        collectiveRole: siteMemberships.collectiveRole,
        user: {
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        }
      })
      .from(siteMemberships)
      .innerJoin(users, eq(siteMemberships.userId, users.id))
      .where(eq(siteMemberships.siteId, siteId));
  }

  async createSiteMembership(membership: InsertSiteMembership): Promise<SiteMembership> {
    const [result] = await db.insert(siteMemberships).values(membership).returning();
    return result;
  }

  async updateSiteMembership(id: string, updates: Partial<InsertSiteMembership>): Promise<SiteMembership> {
    const [membership] = await db
      .update(siteMemberships)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(siteMemberships.id, id))
      .returning();
    return membership;
  }

  async deleteSiteMembership(id: string): Promise<void> {
    await db.delete(siteMemberships).where(eq(siteMemberships.id, id));
  }

  // Site Member Profile operations
  async getSiteMemberProfile(membershipId: string): Promise<SiteMemberProfile | undefined> {
    const [profile] = await db.select().from(siteMemberProfiles).where(eq(siteMemberProfiles.membershipId, membershipId));
    return profile || undefined;
  }

  async createSiteMemberProfile(profile: InsertSiteMemberProfile): Promise<SiteMemberProfile> {
    const [result] = await db.insert(siteMemberProfiles).values(profile).returning();
    return result;
  }

  async updateSiteMemberProfile(id: string, updates: Partial<InsertSiteMemberProfile>): Promise<SiteMemberProfile> {
    const [profile] = await db
      .update(siteMemberProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(siteMemberProfiles.id, id))
      .returning();
    return profile;
  }

  async deleteSiteMemberProfile(id: string): Promise<void> {
    await db.delete(siteMemberProfiles).where(eq(siteMemberProfiles.id, id));
  }
}

export const storage = new DatabaseStorage();
