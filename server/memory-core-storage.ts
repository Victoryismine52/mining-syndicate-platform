import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  type User,
  type InsertUser,
  type Lead,
  type InsertLead,
  type SlideSetting,
  type InsertSlideSetting,
  type AccessRequest,
  type InsertAccessRequest,
  type AccessListEntry,
  type UpsertUser,
  type FormTemplate,
  type InsertFormTemplate,
  type FieldLibrary,
  type InsertFieldLibrary,
  type FormTemplateField,
  type InsertFormTemplateField,
  type LandingPageTemplate,
  type InsertLandingPageTemplate,
  type SiteFormAssignment,
  type InsertSiteFormAssignment,
  type SiteLandingConfig,
  type InsertSiteLandingConfig,
  type SiteMembership,
  type InsertSiteMembership,
  type SiteMemberProfile,
  type InsertSiteMemberProfile,
} from "@shared/schema";
import { type SiteLead, type Site } from "@shared/site-schema";
import type { IStorage } from "./storage";

interface SeedData {
  users: User[];
  leads: Lead[];
  slideSettings: SlideSetting[];
  accessRequests: AccessRequest[];
  accessList: AccessListEntry[];
  formTemplates: FormTemplate[];
  fieldLibrary: FieldLibrary[];
  formTemplateFields: FormTemplateField[];
  landingPageTemplates: LandingPageTemplate[];
  siteFormAssignments: SiteFormAssignment[];
  siteLandingConfigs: SiteLandingConfig[];
  siteMemberships: SiteMembership[];
  siteMemberProfiles: SiteMemberProfile[];
  sites: Site[];
  siteLeads: SiteLead[];
}

function loadSeed(): SeedData {
  const seedPath = path.join(__dirname, "data", "core-seed.json");
  try {
    const raw = fs.readFileSync(seedPath, "utf-8");
    return JSON.parse(raw) as SeedData;
  } catch {
    return {
      users: [],
      leads: [],
      slideSettings: [],
      accessRequests: [],
      accessList: [],
      formTemplates: [],
      fieldLibrary: [],
      formTemplateFields: [],
      landingPageTemplates: [],
      siteFormAssignments: [],
      siteLandingConfigs: [],
      siteMemberships: [],
      siteMemberProfiles: [],
      sites: [],
      siteLeads: [],
    };
  }
}

function saveSeed(data: SeedData) {
  const seedPath = path.join(__dirname, "data", "core-seed.json");
  fs.writeFileSync(seedPath, JSON.stringify(data, null, 2));
}

export class MemoryStorage implements IStorage {
  private data: SeedData;

  constructor(seedData?: SeedData) {
    this.data = seedData ?? loadSeed();
  }

  persist(): void {
    if (process.env.MEMORY_PERSIST === "true") {
      saveSeed(this.data);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.googleId === googleId);
  }

  async createUser(user: InsertUser & { isAdmin?: boolean }): Promise<User> {
    const isAdmin =
      user.email === "bnelson523@gmail.com" || (user as any).isAdmin || false;
    const newUser: User = {
      ...(user as any),
      id: randomUUID(),
      createdAt: new Date(),
      isAdmin,
    } as User;
    this.data.users.push(newUser);
    return newUser;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existing = this.data.users.find((u) => u.email === (user as any).email);
    if (existing) {
      Object.assign(existing as any, user);
      return existing;
    }
    return this.createUser(user as any);
  }

  async checkUserAccess(email: string): Promise<boolean> {
    if (email === "bnelson523@gmail.com") return true;
    return this.data.accessList.some((e) => e.email === email);
  }

  async createLead(
    lead: InsertLead & {
      foundersUnitCount?: number;
      foundersUnitIds?: string[];
      hasMoreThanTenUnits?: boolean;
      lendingAmount?: string;
      formType?: string;
    }
  ): Promise<Lead> {
    const newLead: Lead = {
      ...(lead as any),
      id: randomUUID(),
      createdAt: new Date(),
    } as Lead;
    this.data.leads.push(newLead);
    return newLead;
  }

  async getLeads(): Promise<Lead[]> {
    return [...this.data.leads];
  }

  async getAllSiteLeads(): Promise<(SiteLead & { siteName: string })[]> {
    return this.data.siteLeads
      .map((l) => ({
        ...l,
        siteName: this.data.sites.find((s) => s.siteId === l.siteId)?.name || "",
      }))
      .sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
  }

  async getSlideSettings(): Promise<SlideSetting[]> {
    return [...this.data.slideSettings];
  }

  async updateSlideSetting(
    slideIndex: string,
    isVisible: boolean
  ): Promise<SlideSetting> {
    let setting = this.data.slideSettings.find((s) => s.slideIndex === slideIndex);
    if (setting) {
      Object.assign(setting as any, { isVisible, updatedAt: new Date() });
    } else {
      setting = {
        id: randomUUID(),
        slideIndex,
        isVisible,
        updatedAt: new Date(),
      } as SlideSetting;
      this.data.slideSettings.push(setting);
    }
    return setting;
  }

  async createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest> {
    const entry: AccessRequest = {
      ...(request as any),
      id: randomUUID(),
      requestedAt: new Date(),
      status: (request as any).status ?? "pending",
    } as AccessRequest;
    this.data.accessRequests.push(entry);
    return entry;
  }

  async getAccessRequests(): Promise<AccessRequest[]> {
    return [...this.data.accessRequests];
  }

  async updateAccessRequest(
    id: string,
    status: string,
    reviewedBy: string
  ): Promise<AccessRequest> {
    const req = this.data.accessRequests.find((r) => r.id === id);
    if (!req) throw new Error("Request not found");
    Object.assign(req as any, { status, reviewedBy, reviewedAt: new Date() });
    return req;
  }

  async getAccessList(): Promise<AccessListEntry[]> {
    return [...this.data.accessList];
  }

  async addToAccessList(email: string, addedBy: string): Promise<AccessListEntry> {
    if (this.data.accessList.length === 0 && email !== "bnelson523@gmail.com") {
      this.data.accessList.push({
        id: randomUUID(),
        email: "bnelson523@gmail.com",
        addedBy: null as any,
        addedAt: new Date(),
      } as AccessListEntry);
    }
    let entry = this.data.accessList.find((e) => e.email === email);
    if (entry) return entry;
    entry = {
      id: randomUUID(),
      email,
      addedBy,
      addedAt: new Date(),
    } as AccessListEntry;
    this.data.accessList.push(entry);
    return entry;
  }

  async removeFromAccessList(email: string): Promise<void> {
    if (email === "bnelson523@gmail.com") return;
    this.data.accessList = this.data.accessList.filter((e) => e.email !== email);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.data.users];
  }

  // Form Template operations
  async getFormTemplates(): Promise<FormTemplate[]> {
    return [...this.data.formTemplates];
  }

  async getFormTemplate(id: string): Promise<FormTemplate | undefined> {
    return this.data.formTemplates.find((t) => t.id === id);
  }

  async getJoinCardTemplate(): Promise<FormTemplate | undefined> {
    return this.data.formTemplates.find(
      (t: any) => t.cardType === "join-card" && t.isBuiltIn
    );
  }

  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    const newTemplate: FormTemplate = {
      ...(template as any),
      id: randomUUID(),
      createdAt: new Date(),
    } as FormTemplate;
    this.data.formTemplates.push(newTemplate);
    return newTemplate;
  }

  async updateFormTemplate(
    id: string,
    updates: Partial<InsertFormTemplate>
  ): Promise<FormTemplate> {
    const template = this.data.formTemplates.find((t) => t.id === id);
    if (!template) throw new Error("Form template not found");
    Object.assign(template as any, updates, { updatedAt: new Date() });
    return template;
  }

  async deleteFormTemplate(id: string): Promise<void> {
    this.data.formTemplates = this.data.formTemplates.filter((t) => t.id !== id);
  }

  // Landing Page Template operations
  async getLandingPageTemplates(): Promise<LandingPageTemplate[]> {
    return [...this.data.landingPageTemplates];
  }

  async getLandingPageTemplate(
    id: string
  ): Promise<LandingPageTemplate | undefined> {
    return this.data.landingPageTemplates.find((t) => t.id === id);
  }

  async createLandingPageTemplate(
    template: InsertLandingPageTemplate
  ): Promise<LandingPageTemplate> {
    const tpl: LandingPageTemplate = {
      ...(template as any),
      id: randomUUID(),
      createdAt: new Date(),
    } as LandingPageTemplate;
    this.data.landingPageTemplates.push(tpl);
    return tpl;
  }

  async updateLandingPageTemplate(
    id: string,
    updates: Partial<InsertLandingPageTemplate>
  ): Promise<LandingPageTemplate> {
    const tpl = this.data.landingPageTemplates.find((t) => t.id === id);
    if (!tpl) throw new Error("Template not found");
    Object.assign(tpl as any, updates, { updatedAt: new Date() });
    return tpl;
  }

  async deleteLandingPageTemplate(id: string): Promise<void> {
    this.data.landingPageTemplates = this.data.landingPageTemplates.filter(
      (t) => t.id !== id
    );
  }

  // Site Form Assignment operations
  async getSiteFormAssignments(
    siteId: string
  ): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null })[]> {
    return this.data.siteFormAssignments
      .filter((a) => a.siteId === siteId)
      .map((a) => ({
        ...a,
        formTemplate:
          this.data.formTemplates.find((t) => t.id === a.formTemplateId) || null,
      }));
  }

  async getSiteFormAssignmentById(
    id: string
  ): Promise<(SiteFormAssignment & { formTemplate: FormTemplate | null }) | null> {
    const assignment = this.data.siteFormAssignments.find((a) => a.id === id);
    if (!assignment) return null;
    return {
      ...assignment,
      formTemplate:
        this.data.formTemplates.find((t) => t.id === assignment.formTemplateId) || null,
    };
  }

  async assignFormToSite(
    assignment: InsertSiteFormAssignment
  ): Promise<SiteFormAssignment> {
    const newAssignment: SiteFormAssignment = {
      ...(assignment as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteFormAssignment;
    this.data.siteFormAssignments.push(newAssignment);
    return newAssignment;
  }

  async updateSiteFormAssignment(
    id: string,
    updates: Partial<InsertSiteFormAssignment>
  ): Promise<SiteFormAssignment> {
    const assignment = this.data.siteFormAssignments.find((a) => a.id === id);
    if (!assignment) throw new Error("Assignment not found");
    Object.assign(assignment as any, updates, { updatedAt: new Date() });
    return assignment;
  }

  async removeFormFromSite(id: string): Promise<void> {
    this.data.siteFormAssignments = this.data.siteFormAssignments.filter(
      (a) => a.id !== id
    );
  }

  // Site Landing Config operations
  async getSiteLandingConfig(
    siteId: string
  ): Promise<SiteLandingConfig | undefined> {
    return this.data.siteLandingConfigs.find((c) => c.siteId === siteId);
  }

  async createSiteLandingConfig(
    config: InsertSiteLandingConfig
  ): Promise<SiteLandingConfig> {
    const cfg: SiteLandingConfig = {
      ...(config as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteLandingConfig;
    this.data.siteLandingConfigs.push(cfg);
    return cfg;
  }

  async updateSiteLandingConfig(
    siteId: string,
    updates: Partial<InsertSiteLandingConfig>
  ): Promise<SiteLandingConfig> {
    const cfg = this.data.siteLandingConfigs.find((c) => c.siteId === siteId);
    if (!cfg) throw new Error("Site landing config not found");
    Object.assign(cfg as any, updates, { updatedAt: new Date() });
    return cfg;
  }

  // Field Library operations
  async getFieldLibrary(): Promise<FieldLibrary[]> {
    return [...this.data.fieldLibrary];
  }

  async getFieldLibraryItem(id: string): Promise<FieldLibrary | undefined> {
    return this.data.fieldLibrary.find((f) => f.id === id);
  }

  async createFieldLibraryItem(field: InsertFieldLibrary): Promise<FieldLibrary> {
    const newField: FieldLibrary = {
      ...(field as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FieldLibrary;
    this.data.fieldLibrary.push(newField);
    return newField;
  }

  async updateFieldLibraryItem(
    id: string,
    updates: Partial<InsertFieldLibrary>
  ): Promise<FieldLibrary> {
    const field = this.data.fieldLibrary.find((f) => f.id === id);
    if (!field) throw new Error("Field not found");
    Object.assign(field as any, updates, { updatedAt: new Date() });
    return field;
  }

  async deleteFieldLibraryItem(id: string): Promise<void> {
    this.data.fieldLibrary = this.data.fieldLibrary.filter((f) => f.id !== id);
  }

  // Form Template Fields operations
  async getFormTemplateFields(
    formTemplateId: string
  ): Promise<(FormTemplateField & { fieldLibrary: FieldLibrary })[]> {
    return this.data.formTemplateFields
      .filter((f) => f.formTemplateId === formTemplateId)
      .map((f) => ({
        ...f,
        fieldLibrary: this.data.fieldLibrary.find(
          (fl) => fl.id === f.fieldLibraryId
        )!,
      }));
  }

  async createFormTemplateField(
    field: InsertFormTemplateField
  ): Promise<FormTemplateField> {
    const newField: FormTemplateField = {
      ...(field as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FormTemplateField;
    this.data.formTemplateFields.push(newField);
    return newField;
  }

  async updateFormTemplateField(
    id: string,
    updates: Partial<InsertFormTemplateField>
  ): Promise<FormTemplateField> {
    const fld = this.data.formTemplateFields.find((f) => f.id === id);
    if (!fld) throw new Error("Form template field not found");
    Object.assign(fld as any, updates, { updatedAt: new Date() });
    return fld;
  }

  async deleteFormTemplateField(id: string): Promise<void> {
    this.data.formTemplateFields = this.data.formTemplateFields.filter(
      (f) => f.id !== id
    );
  }

  // Site Membership operations
  async getUserSiteMemberships(
    userId: string
  ): Promise<
    (SiteMembership & { site: { siteId: string; name: string } })[]
  > {
    return this.data.siteMemberships
      .filter((m) => m.userId === userId)
      .map((m) => {
        const site = this.data.sites.find((s) => s.siteId === m.siteId);
        return {
          ...m,
          site: site
            ? { siteId: site.siteId, name: site.name }
            : { siteId: m.siteId, name: "" },
        };
      });
  }

  async getSiteMemberships(
    siteId: string
  ): Promise<
    (SiteMembership & {
      user: { firstName: string; lastName: string; email: string };
    })[]
  > {
    return this.data.siteMemberships
      .filter((m) => m.siteId === siteId)
      .map((m) => {
        const user = this.data.users.find((u) => u.id === m.userId);
        return {
          ...m,
          user: user
            ? {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
              }
            : { firstName: "", lastName: "", email: "" },
        };
      });
  }

  async createSiteMembership(
    membership: InsertSiteMembership
  ): Promise<SiteMembership> {
    const mem: SiteMembership = {
      ...(membership as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteMembership;
    this.data.siteMemberships.push(mem);
    return mem;
  }

  async updateSiteMembership(
    id: string,
    updates: Partial<InsertSiteMembership>
  ): Promise<SiteMembership> {
    const mem = this.data.siteMemberships.find((m) => m.id === id);
    if (!mem) throw new Error("Membership not found");
    Object.assign(mem as any, updates, { updatedAt: new Date() });
    return mem;
  }

  async deleteSiteMembership(id: string): Promise<void> {
    this.data.siteMemberships = this.data.siteMemberships.filter(
      (m) => m.id !== id
    );
  }

  // Site Member Profile operations
  async getSiteMemberProfile(
    membershipId: string
  ): Promise<SiteMemberProfile | undefined> {
    return this.data.siteMemberProfiles.find(
      (p) => p.membershipId === membershipId
    );
  }

  async createSiteMemberProfile(
    profile: InsertSiteMemberProfile
  ): Promise<SiteMemberProfile> {
    const prof: SiteMemberProfile = {
      ...(profile as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteMemberProfile;
    this.data.siteMemberProfiles.push(prof);
    return prof;
  }

  async updateSiteMemberProfile(
    id: string,
    updates: Partial<InsertSiteMemberProfile>
  ): Promise<SiteMemberProfile> {
    const prof = this.data.siteMemberProfiles.find((p) => p.id === id);
    if (!prof) throw new Error("Profile not found");
    Object.assign(prof as any, updates, { updatedAt: new Date() });
    return prof;
  }

  async deleteSiteMemberProfile(id: string): Promise<void> {
    this.data.siteMemberProfiles = this.data.siteMemberProfiles.filter(
      (p) => p.id !== id
    );
  }
}

export const memoryStorage = new MemoryStorage();

if (process.env.MEMORY_PERSIST === "true") {
  const handler = () => memoryStorage.persist();
  process.on("beforeExit", handler);
  process.on("SIGINT", handler);
  process.on("SIGTERM", handler);
}
