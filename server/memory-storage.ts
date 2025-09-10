import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import {
  type Site,
  type InsertSite,
  type SiteLead,
  type InsertSiteLead,
  type SiteAnalytics,
  type InsertSiteAnalytics,
  type SiteManager,
  type InsertSiteManager,
  type LegalDisclaimer,
  type InsertLegalDisclaimer,
  type SiteDisclaimer,
  type InsertSiteDisclaimer,
  type SiteSlide,
  type InsertSiteSlide,
  type GlobalSlide,
  type InsertGlobalSlide,
  type SiteSection,
  type InsertSiteSection,
} from "@shared/site-schema";
import type { ISiteStorage } from "./site-storage";

interface SeedData {
  sites: Site[];
  siteLeads: SiteLead[];
  siteAnalytics: SiteAnalytics[];
  siteManagers: SiteManager[];
  legalDisclaimers: LegalDisclaimer[];
  siteDisclaimers: SiteDisclaimer[];
  siteSlides: SiteSlide[];
  globalSlides: GlobalSlide[];
  siteSections: SiteSection[];
  siteMemberships: any[];
  collectiveTasks: any[];
  taskAssignments: any[];
  collectiveMessages: any[];
  collectiveBlogPosts: any[];
  users: any[];
}

function loadSeed(): SeedData {
  const seedPath = path.join(__dirname, "data", "seed.json");
  try {
    const raw = fs.readFileSync(seedPath, "utf-8");
    return JSON.parse(raw) as SeedData;
  } catch {
    return {
      sites: [],
      siteLeads: [],
      siteAnalytics: [],
      siteManagers: [],
      legalDisclaimers: [],
      siteDisclaimers: [],
      siteSlides: [],
      globalSlides: [],
      siteSections: [],
      siteMemberships: [],
      collectiveTasks: [],
      taskAssignments: [],
      collectiveMessages: [],
      collectiveBlogPosts: [],
      users: [],
    };
  }
}

export class MemorySiteStorage implements ISiteStorage {
  private data: SeedData;

  constructor() {
    this.data = loadSeed();
  }

  // Site operations
  async createSite(site: InsertSite): Promise<Site> {
    const newSite: Site = {
      ...(site as any),
      // Default to not launched unless explicitly set
      isLaunched: (site as any).isLaunched ?? false,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.sites.push(newSite);
    return newSite;
  }

  async getSite(siteId: string): Promise<Site | undefined> {
    return this.data.sites.find((s) => s.siteId === siteId);
  }

  async getSiteById(id: string): Promise<Site | undefined> {
    return this.data.sites.find((s) => (s as any).id === id);
  }

  async updateSite(siteId: string, updates: Partial<InsertSite>): Promise<Site> {
    const site = await this.getSite(siteId);
    if (!site) throw new Error("Site not found");
    Object.assign(site as any, updates, { updatedAt: new Date() });
    return site;
  }

  async deleteSite(siteId: string): Promise<void> {
    this.data.sites = this.data.sites.filter((s) => s.siteId !== siteId);
  }

  async listSites(): Promise<Site[]> {
    return [...this.data.sites];
  }

  // Lead operations
  async createSiteLead(lead: InsertSiteLead & { siteId: string }): Promise<SiteLead> {
    const newLead: SiteLead = {
      ...(lead as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.siteLeads.push(newLead);
    return newLead;
  }

  async getSiteLeads(siteId: string): Promise<SiteLead[]> {
    return this.data.siteLeads.filter((l) => l.siteId === siteId);
  }

  async getSiteLeadsByType(siteId: string, formType: string): Promise<SiteLead[]> {
    return this.data.siteLeads.filter(
      (l) => l.siteId === siteId && l.formType === formType
    );
  }

  async updateSiteLead(
    leadId: string,
    updates: Partial<InsertSiteLead>
  ): Promise<SiteLead> {
    const lead = this.data.siteLeads.find((l) => (l as any).id === leadId);
    if (!lead) throw new Error("Lead not found");
    Object.assign(lead as any, updates, { updatedAt: new Date() });
    return lead;
  }

  // Analytics operations
  async createSiteAnalytics(
    analytics: InsertSiteAnalytics & { siteId: string }
  ): Promise<SiteAnalytics> {
    const newEntry: SiteAnalytics = {
      ...(analytics as any),
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.data.siteAnalytics.push(newEntry);
    return newEntry;
  }

  async getSiteAnalytics(
    siteId: string,
    limit: number = 100
  ): Promise<SiteAnalytics[]> {
    return this.data.siteAnalytics
      .filter((a) => a.siteId === siteId)
      .slice(-limit)
      .reverse();
  }

  // Site manager operations
  async addSiteManager(siteId: string, userEmail: string): Promise<SiteManager> {
    const manager: SiteManager = {
      id: randomUUID(),
      siteId,
      userEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.data.siteManagers.push(manager);
    return manager;
  }

  async removeSiteManager(siteId: string, userEmail: string): Promise<void> {
    this.data.siteManagers = this.data.siteManagers.filter(
      (m) => !(m.siteId === siteId && m.userEmail === userEmail)
    );
  }

  async getSiteManagers(siteId: string): Promise<SiteManager[]> {
    return this.data.siteManagers.filter((m) => m.siteId === siteId);
  }

  async isSiteManager(siteId: string, userEmail: string): Promise<boolean> {
    return this.data.siteManagers.some(
      (m) => m.siteId === siteId && m.userEmail === userEmail
    );
  }

  // Legal disclaimer operations
  async createLegalDisclaimer(
    disclaimer: InsertLegalDisclaimer
  ): Promise<LegalDisclaimer> {
    const newDisclaimer: LegalDisclaimer = {
      ...(disclaimer as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.legalDisclaimers.push(newDisclaimer);
    return newDisclaimer;
  }

  async getLegalDisclaimer(id: string): Promise<LegalDisclaimer | undefined> {
    return this.data.legalDisclaimers.find((d) => (d as any).id === id);
  }

  async updateLegalDisclaimer(
    id: string,
    updates: Partial<InsertLegalDisclaimer>
  ): Promise<LegalDisclaimer> {
    const disclaimer = await this.getLegalDisclaimer(id);
    if (!disclaimer) throw new Error("Disclaimer not found");
    Object.assign(disclaimer as any, updates, { updatedAt: new Date() });
    return disclaimer;
  }

  async deleteLegalDisclaimer(id: string): Promise<void> {
    this.data.legalDisclaimers = this.data.legalDisclaimers.filter(
      (d) => (d as any).id !== id
    );
  }

  async listLegalDisclaimers(): Promise<LegalDisclaimer[]> {
    return [...this.data.legalDisclaimers];
  }

  async getAvailableDisclaimersForSiteType(
    _siteType: string
  ): Promise<LegalDisclaimer[]> {
    return [...this.data.legalDisclaimers];
  }

  // Site disclaimer attachment operations
  async attachDisclaimerToSite(
    siteId: string,
    disclaimerId: string,
    options?: { displayOrder?: string; linkText?: string }
  ): Promise<SiteDisclaimer> {
    const attach: SiteDisclaimer = {
      id: randomUUID(),
      siteId,
      disclaimerId,
      displayOrder: options?.displayOrder || "0",
      linkText: options?.linkText || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
    this.data.siteDisclaimers.push(attach);
    return attach;
  }

  async detachDisclaimerFromSite(
    siteId: string,
    disclaimerId: string
  ): Promise<void> {
    this.data.siteDisclaimers = this.data.siteDisclaimers.filter(
      (d) => !(d.siteId === siteId && d.disclaimerId === disclaimerId)
    );
  }

  async getSiteDisclaimers(
    siteId: string
  ): Promise<Array<SiteDisclaimer & { disclaimer: LegalDisclaimer }>> {
    return this.data.siteDisclaimers
      .filter((d) => d.siteId === siteId)
      .map((d) => ({
        ...d,
        disclaimer: this.data.legalDisclaimers.find(
          (l) => l.id === d.disclaimerId
        )!,
      }));
  }

  // Slide operations
  async createSiteSlide(
    slide: InsertSiteSlide & { siteId: string }
  ): Promise<SiteSlide> {
    const newSlide: SiteSlide = {
      ...(slide as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.siteSlides.push(newSlide);
    return newSlide;
  }

  async getSiteSlides(siteId: string): Promise<SiteSlide[]> {
    return this.data.siteSlides.filter((s) => s.siteId === siteId);
  }

  async getSiteSlide(slideId: string): Promise<SiteSlide | undefined> {
    return this.data.siteSlides.find((s) => (s as any).id === slideId);
  }

  async updateSiteSlide(
    slideId: string,
    updates: Partial<InsertSiteSlide>
  ): Promise<SiteSlide> {
    const slide = await this.getSiteSlide(slideId);
    if (!slide) throw new Error("Slide not found");
    Object.assign(slide as any, updates, { updatedAt: new Date() });
    return slide;
  }

  async deleteSiteSlide(slideId: string): Promise<void> {
    this.data.siteSlides = this.data.siteSlides.filter(
      (s) => (s as any).id !== slideId
    );
  }

  async reorderSiteSlides(
    siteId: string,
    slideOrders: Array<{ id: string; slideOrder: string }>
  ): Promise<void> {
    const slides = this.data.siteSlides.filter((s) => s.siteId === siteId);
    slideOrders.forEach(({ id, slideOrder }) => {
      const slide = slides.find((s) => (s as any).id === id);
      if (slide) (slide as any).slideOrder = slideOrder;
    });
  }

  // Global slide operations
  async getGlobalSlides(): Promise<GlobalSlide[]> {
    return [...this.data.globalSlides];
  }

  async getGlobalSlideByKey(slideKey: string): Promise<GlobalSlide | undefined> {
    return this.data.globalSlides.find((g) => (g as any).slideKey === slideKey);
  }

  async createGlobalSlide(slideData: InsertGlobalSlide): Promise<GlobalSlide> {
    const slide: GlobalSlide = {
      ...(slideData as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.globalSlides.push(slide);
    return slide;
  }

  async updateGlobalSlideVisibility(
    slideKey: string,
    isVisible: boolean
  ): Promise<GlobalSlide | null> {
    const slide = await this.getGlobalSlideByKey(slideKey);
    if (!slide) return null;
    (slide as any).isVisible = isVisible;
    (slide as any).updatedAt = new Date();
    return slide;
  }

  // Site sections operations
  async getSiteSections(siteId: string): Promise<SiteSection[]> {
    return this.data.siteSections.filter((s) => s.siteId === siteId);
  }

  async getSiteSection(sectionId: string): Promise<SiteSection | undefined> {
    return this.data.siteSections.find((s) => (s as any).id === sectionId);
  }

  async createSiteSection(sectionData: InsertSiteSection): Promise<SiteSection> {
    const section: SiteSection = {
      ...(sectionData as any),
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.siteSections.push(section);
    return section;
  }

  async updateSiteSection(
    sectionId: string,
    updates: Partial<InsertSiteSection>
  ): Promise<SiteSection> {
    const section = await this.getSiteSection(sectionId);
    if (!section) throw new Error("Section not found");
    Object.assign(section as any, updates, { updatedAt: new Date() });
    return section;
  }

  async deleteSiteSection(sectionId: string): Promise<void> {
    this.data.siteSections = this.data.siteSections.filter(
      (s) => (s as any).id !== sectionId
    );
  }

  // Site membership operations (simplified)
  async getUserMemberships(userId: string): Promise<any[]> {
    return this.data.siteMemberships.filter((m) => m.userId === userId);
  }

  async getSiteMemberships(siteId: string): Promise<any[]> {
    return this.data.siteMemberships.filter((m) => m.siteId === siteId);
  }

  async createSiteMembership(membershipData: any): Promise<any> {
    const membership = {
      ...membershipData,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.siteMemberships.push(membership);
    return membership;
  }

  async updateSiteMembership(
    siteId: string,
    userId: string,
    updates: any
  ): Promise<any> {
    const membership = this.data.siteMemberships.find(
      (m) => m.siteId === siteId && m.userId === userId
    );
    if (!membership) return null;
    Object.assign(membership, updates, { updatedAt: new Date() });
    return membership;
  }

  async deleteSiteMembership(siteId: string, userId: string): Promise<boolean> {
    const before = this.data.siteMemberships.length;
    this.data.siteMemberships = this.data.siteMemberships.filter(
      (m) => !(m.siteId === siteId && m.userId === userId)
    );
    return this.data.siteMemberships.length < before;
  }

  // ===== COLLECTIVE MESSAGES METHODS =====
  async getCollectiveMessages(
    siteId: string,
    options: { limit: number; offset: number }
  ): Promise<any[]> {
    const messages = this.data.collectiveMessages
      .filter((m) => m.siteId === siteId && !m.isDeleted)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(options.offset, options.offset + options.limit)
      .map((m) => {
        const sender = this.data.users.find((u) => u.id === m.senderId) || {};
        return {
          ...m,
          senderFirstName: sender.firstName || null,
          senderLastName: sender.lastName || null,
          senderEmail: sender.email || null,
          senderProfilePicture: sender.profilePicture || null,
        };
      });
    return messages;
  }

  async createCollectiveMessage(messageData: any): Promise<any> {
    const message = {
      id: randomUUID(),
      siteId: messageData.siteId,
      senderId: messageData.senderId,
      messageType: messageData.messageType || "text",
      content: messageData.content,
      messageData: messageData.messageData || {},
      isEdited: false,
      isDeleted: false,
      editedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.collectiveMessages.push(message);
    return message;
  }

  async getCollectiveMessageWithSender(messageId: string): Promise<any> {
    const message = this.data.collectiveMessages.find((m) => m.id === messageId);
    if (!message) return undefined;
    const sender = this.data.users.find((u) => u.id === message.senderId) || {};
    return {
      ...message,
      senderFirstName: sender.firstName || null,
      senderLastName: sender.lastName || null,
      senderEmail: sender.email || null,
      senderProfilePicture: sender.profilePicture || null,
    };
  }

  // ===== COLLECTIVE BLOG POSTS METHODS =====
  async getCollectiveBlogPosts(
    siteId: string,
    options: { status?: string; userRole?: string; limit?: number; offset?: number }
  ): Promise<any[]> {
    let posts = this.data.collectiveBlogPosts.filter((p) => p.siteId === siteId);
    if (options.status) {
      posts = posts.filter((p) => p.status === options.status);
    }
    if (options.userRole === "member") {
      posts = posts.filter((p) => p.visibility !== "brehons");
    }
    posts = posts
      .sort((a, b) => {
        const aDate = new Date(a.publishedAt || a.createdAt).getTime();
        const bDate = new Date(b.publishedAt || b.createdAt).getTime();
        return bDate - aDate;
      })
      .slice(options.offset || 0, (options.offset || 0) + (options.limit || posts.length))
      .map((p) => {
        const author = this.data.users.find((u) => u.id === p.authorId) || {};
        return {
          ...p,
          authorFirstName: author.firstName || null,
          authorLastName: author.lastName || null,
          authorEmail: author.email || null,
          authorProfilePicture: author.profilePicture || null,
        };
      });
    return posts;
  }

  async getCollectiveBlogPostById(postId: string): Promise<any> {
    const post = this.data.collectiveBlogPosts.find((p) => p.id === postId);
    if (!post) return undefined;
    const author = this.data.users.find((u) => u.id === post.authorId) || {};
    return {
      ...post,
      authorFirstName: author.firstName || null,
      authorLastName: author.lastName || null,
      authorEmail: author.email || null,
      authorProfilePicture: author.profilePicture || null,
    };
  }

  async createCollectiveBlogPost(postData: any): Promise<any> {
    const post = {
      id: randomUUID(),
      siteId: postData.siteId,
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || null,
      slug: postData.slug,
      authorId: postData.authorId,
      status: postData.status || "draft",
      visibility: postData.visibility || "members",
      featuredImageUrl: postData.featuredImageUrl || null,
      tags: postData.tags || [],
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      publishedAt: postData.publishedAt || null,
      lastEditedBy: postData.lastEditedBy || null,
      lastEditedAt: postData.lastEditedAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.collectiveBlogPosts.push(post);
    return post;
  }

  async updateCollectiveBlogPost(postId: string, updates: any): Promise<any> {
    const post = this.data.collectiveBlogPosts.find((p) => p.id === postId);
    if (!post) throw new Error("Post not found");
    Object.assign(post, updates, { updatedAt: new Date() });
    return post;
  }

  async deleteCollectiveBlogPost(postId: string): Promise<void> {
    this.data.collectiveBlogPosts = this.data.collectiveBlogPosts.filter(
      (p) => p.id !== postId
    );
  }

  async incrementBlogPostViewCount(postId: string): Promise<void> {
    const post = this.data.collectiveBlogPosts.find((p) => p.id === postId);
    if (post) {
      post.viewCount = (post.viewCount || 0) + 1;
    }
  }

  // ===== COLLECTIVE TASKS METHODS =====
  async getCollectiveTasks(
    siteId: string,
    options: { status?: string; limit?: number; offset?: number }
  ): Promise<any[]> {
    let tasks = this.data.collectiveTasks.filter((t) => t.siteId === siteId);
    if (options.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }
    tasks = tasks
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(options.offset || 0, (options.offset || 0) + (options.limit || tasks.length))
      .map((t) => {
        const creator = this.data.users.find((u) => u.id === t.createdBy) || {};
        return {
          ...t,
          creatorFirstName: creator.firstName || null,
          creatorLastName: creator.lastName || null,
          creatorEmail: creator.email || null,
          creatorProfilePicture: creator.profilePicture || null,
        };
      });
    return tasks;
  }

  async getCollectiveTaskById(taskId: string): Promise<any> {
    const task = this.data.collectiveTasks.find((t) => t.id === taskId);
    if (!task) return undefined;
    const creator = this.data.users.find((u) => u.id === task.createdBy) || {};
    return {
      ...task,
      creatorFirstName: creator.firstName || null,
      creatorLastName: creator.lastName || null,
      creatorEmail: creator.email || null,
      creatorProfilePicture: creator.profilePicture || null,
    };
  }

  async createCollectiveTask(taskData: any): Promise<any> {
    const task = {
      id: randomUUID(),
      siteId: taskData.siteId,
      title: taskData.title,
      description: taskData.description,
      taskType: taskData.taskType || "general",
      priority: taskData.priority || "medium",
      status: taskData.status || "open",
      dueDate: taskData.dueDate || null,
      createdBy: taskData.createdBy,
      assignedToRole: taskData.assignedToRole || null,
      taskConfig: taskData.taskConfig || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    };
    this.data.collectiveTasks.push(task);
    return task;
  }

  async updateCollectiveTask(taskId: string, updates: any): Promise<any> {
    const task = this.data.collectiveTasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");
    Object.assign(task, updates, { updatedAt: new Date() });
    return task;
  }

  async deleteCollectiveTask(taskId: string): Promise<void> {
    this.data.collectiveTasks = this.data.collectiveTasks.filter(
      (t) => t.id !== taskId
    );
  }

  async getUserTasks(siteId: string, userId: string): Promise<any[]> {
    const assignments = this.data.taskAssignments.filter(
      (a) => a.userId === userId
    );
    const tasks = assignments
      .map((a) => {
        const task = this.data.collectiveTasks.find(
          (t) => t.id === a.taskId && t.siteId === siteId
        );
        if (!task) return null;
        const creator = this.data.users.find((u) => u.id === task.createdBy) || {};
        return {
          ...task,
          assignmentId: a.id,
          assignedAt: a.createdAt,
          assignmentStatus: a.status,
          creatorFirstName: creator.firstName || null,
          creatorLastName: creator.lastName || null,
          creatorEmail: creator.email || null,
          creatorProfilePicture: creator.profilePicture || null,
        };
      })
      .filter(Boolean) as any[];
    tasks.sort(
      (a, b) =>
        new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
    return tasks;
  }

  async assignTaskToUser(
    taskId: string,
    userId: string,
    assignedById: string
  ): Promise<any> {
    const assignment = {
      id: randomUUID(),
      taskId,
      userId,
      assignedBy: assignedById,
      status: "assigned",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.data.taskAssignments.push(assignment);
    return assignment;
  }

  // Access control
  async checkSiteAccess(
    _siteId: string,
    _userEmail: string,
    isAdmin: boolean
  ): Promise<boolean> {
    return isAdmin || true;
  }
}

export const memorySiteStorage = new MemorySiteStorage();

