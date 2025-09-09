import type { Express, Response } from "express";
import express from "express";
import path from "path";
import { siteStorage, updateSiteLead } from "../site-storage";
import { storage } from "../storage";
import { qrGenerator } from "../qr-generator";
import { submitToHubSpotForm } from "../hubspot";
import { createHubSpotService, type ContactData } from "../hubspot-service";
import { ObjectStorageService, ObjectNotFoundError } from "../objectStorage";
import { insertSiteSchema, insertSiteLeadSchema, insertLegalDisclaimerSchema, insertSiteDisclaimerSchema, insertSiteSlideSchema, insertGlobalSlideSchema, insertSiteAnalyticsSchema, siteManagers, type SiteManagerWithAccount } from "@shared/site-schema";
import { users } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { checkSiteAccess, requireAdmin } from "../site-access-control";
import { isAuthenticated } from "../google-auth";
import { z } from "zod";
import { registerSiteCreateRoutes } from "./site-create";
import { logger } from '../logger';
export function registerSiteRoutes(app: Express, storage?: any) {
  registerSiteCreateRoutes(app);

  // Get site by siteId (no access control for basic site info - admin panel handles its own access control)
  app.get("/api/sites/:siteId", async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      res.json(site);
    } catch (error) {
      logger.error("Error fetching site:", error);
      res.status(500).json({ error: "Failed to fetch site" });
    }
  });

  // List all sites (including main site)
  app.get("/api/sites", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user?.role === 'admin' || user?.isAdmin;

      if (isAdmin) {
        // Admins get all sites
        const sites = await siteStorage.listSites();
        // Ensure main site is always included
        const mainSiteExists = sites.some(site => site.siteId === 'main-site');
        if (!mainSiteExists) {
          const mainSite = await siteStorage.getSite('main-site');
          if (mainSite) {
            sites.unshift(mainSite); // Add to beginning of array
          }
        }
        res.json(sites);
      } else {
        // Regular users get only public sites and sites they're members of
        const allSites = await siteStorage.listSites();
        const userMemberships = await siteStorage.getUserMemberships(user.id);
        const memberSiteIds = userMemberships.map(m => m.siteId);
        
        // Filter to include only public sites or sites user is a member of
        const accessibleSites = allSites.filter(site => {
          // Include all launched sites (public access)
          if (site.isLaunched) return true;
          // Include sites user is a member of
          if (memberSiteIds.includes(site.siteId)) return true;
          return false;
        });

        res.json(accessibleSites);
      }
    } catch (error) {
      logger.error("Error listing sites:", error);
      res.status(500).json({ error: "Failed to list sites" });
    }
  });

  // Update site
  app.put("/api/sites/:siteId", async (req, res) => {
    try {
      const updates = insertSiteSchema.partial().parse(req.body);
      const site = await siteStorage.updateSite(req.params.siteId, updates);
      res.json(site);
    } catch (error) {
      logger.error("Error updating site:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update site" });
    }
  });

  // Delete site
  app.delete("/api/sites/:siteId", async (req, res) => {
    try {
      await siteStorage.deleteSite(req.params.siteId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting site:", error);
      res.status(500).json({ error: "Failed to delete site" });
    }
  });

  // Submit lead for specific site
  app.post("/api/sites/:siteId/leads", async (req, res) => {
    try {
      const siteId = req.params.siteId;
      
      // Check if site exists
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const leadData = insertSiteLeadSchema.parse(req.body);
      
      // Add tracking information
      const fullLeadData = {
        ...leadData,
        siteId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer'),
      };

      // Save to database
      const lead = await siteStorage.createSiteLead(fullLeadData);

      // Submit to HubSpot using site-level integration (new method)
      const hubspotService = createHubSpotService(site);
      if (hubspotService) {
        try {
          const contactData: ContactData = {
            firstName: leadData.firstName || undefined,
            lastName: leadData.lastName || undefined,
            email: leadData.email || undefined,
            phone: leadData.phone || undefined,
            company: leadData.company || undefined,
          };

          const result = await hubspotService.createContact(contactData);
          if (result) {
            logger.info(`Contact created/updated in HubSpot with ID: ${result.id}`);
            // Update the lead with HubSpot contact ID
            try {
              await updateSiteLead(lead.id, result.id);
              logger.info(`Lead ${lead.id} updated with HubSpot contact ID ${result.id}`);
            } catch (updateError) {
              logger.error(
                "Failed to update lead with HubSpot contact ID:",
                updateError
              );
            }
          }
        } catch (hubspotError) {
          logger.error("HubSpot contact creation failed:", hubspotError);
          // Continue - don't fail the whole request if HubSpot fails
        }
      }

      // Legacy: Submit to HubSpot with site-specific form ID (fallback for existing configurations)
      if (!hubspotService && site.hubspotFormIds) {
        const formIds = site.hubspotFormIds as any;
        let hubspotFormId = '';
        
        switch (leadData.formType) {
          case 'learn-more':
            hubspotFormId = formIds.learnMore || '';
            break;
          case 'mining-pool':
            hubspotFormId = formIds.miningPool || '';
            break;
          case 'lending-pool':
            hubspotFormId = formIds.lendingPool || '';
            break;
        }

        if (hubspotFormId) {
          try {
            await submitToHubSpotForm(hubspotFormId, {
              firstName: leadData.firstName,
              lastName: leadData.lastName,
              email: leadData.email,
              phone: leadData.phone || '',
              interests: leadData.interests || [],
              formType: leadData.formType,
              message: leadData.message,
              miningAmount: leadData.miningAmount,
              lendingAmount: leadData.lendingAmount,
              // Add site-specific qualifiers
              siteName: site.name,
              siteId: site.siteId,
              leadSource: `Site: ${site.name} (${site.siteId})`,
            });
          } catch (hubspotError) {
            logger.error("HubSpot form submission failed:", hubspotError);
            // Continue - don't fail the whole request if HubSpot fails
          }
        }
      }

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      logger.error("Error submitting site lead:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit lead" });
    }
  });

  // Track analytics events for a site
  app.post("/api/sites/:siteId/analytics", async (req, res, next) => {
    try {
      const { siteId } = req.params;
      const consentSchema = z.object({ status: z.literal('granted'), timestamp: z.number() });
      try {
        consentSchema.parse(req.body.consent);
      } catch {
        return res.status(400).json({ error: 'Missing analytics consent' });
      }
      const analyticsData = insertSiteAnalyticsSchema.parse({
        siteId,
        eventType: req.body.eventType || 'page_view',
        eventData: req.body.eventData || {},
        sessionId: req.body.sessionId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer'),
      });
      const analytics = await siteStorage.createSiteAnalytics(analyticsData);
      res.status(201).json(analytics);
    } catch (error) {
      next(error);
    }
  });

  // Get leads for specific site (protected)
  app.get("/api/sites/:siteId/leads", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeads(req.params.siteId);
      res.json(leads);
    } catch (error) {
      logger.error("Error fetching site leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get leads by type for specific site
  app.get("/api/sites/:siteId/leads/:formType", async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeadsByType(req.params.siteId, req.params.formType);
      res.json(leads);
    } catch (error) {
      logger.error("Error fetching site leads by type:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Regenerate QR code for site
  app.post("/api/sites/:siteId/qr-code", async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const siteUrl = `${req.protocol}://${req.get('host')}/site/${site.siteId}`;
      const qrCodeUrl = await qrGenerator.generateQRCode(siteUrl, site.siteId);
      
      const updatedSite = await siteStorage.updateSite(site.siteId, {
        qrCodeUrl: qrCodeUrl
      });

      res.json({ qrCodeUrl: updatedSite.qrCodeUrl });
    } catch (error) {
      logger.error("Error generating QR code:", error);
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // Site manager routes (protected)
  
  // Get site managers (admin or site managers can view)
  app.get("/api/sites/:siteId/managers", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { siteId } = req.params;
      const rows = await db
        .select({
          id: siteManagers.id,
          siteId: siteManagers.siteId,
          userEmail: siteManagers.userEmail,
          createdAt: siteManagers.createdAt,
          existingEmail: users.email,
        })
        .from(siteManagers)
        .leftJoin(users, eq(siteManagers.userEmail, users.email))
        .where(eq(siteManagers.siteId, siteId));

      const managers: SiteManagerWithAccount[] = rows.map((row) => ({
        id: row.id,
        siteId: row.siteId,
        userEmail: row.userEmail,
        createdAt: row.createdAt,
        hasAccount: !!row.existingEmail,
      }));

      res.json(managers);
    } catch (error) {
      logger.error("Error fetching site managers:", error);
      res.status(500).json({ error: "Failed to fetch site managers" });
    }
  });

  // Add site manager (admin only)
  app.post("/api/sites/:siteId/managers", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { userEmail } = req.body;
      const { siteId } = req.params;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Check if manager already exists
      const isManager = await siteStorage.isSiteManager(siteId, userEmail);
      if (isManager) {
        return res.status(400).json({ error: "User is already a site manager" });
      }

      // Add the site manager
      const manager = await siteStorage.addSiteManager(siteId, userEmail);

      // For collective sites, automatically add them as a Brehon member
      const site = await siteStorage.getSite(siteId);
      if (site && site.siteType === 'collective') {
        try {
          // Find user by email
          const users = await storage.getAllUsers();
          const user = users.find((u: any) => u.email === userEmail);
          
          if (user) {
            // Check if they're already a member
            const userMemberships = await siteStorage.getUserMemberships(user.id);
            const existingMembership = userMemberships.find(m => m.siteId === siteId);
            
            // All site managers get Brehon role, regardless of global admin status
            const targetRole = 'brehon';
            const targetMembershipType = 'brehon';
            const roleDisplayName = 'Brehon';

            if (existingMembership) {
              // Update existing membership to Brehon role if they're not already at that level
              if (existingMembership.collectiveRole !== targetRole) {
                await siteStorage.updateSiteMembership(siteId, user.id, {
                  membershipType: targetMembershipType,
                  collectiveRole: targetRole
                });
                logger.info(`Updated ${userEmail} to ${roleDisplayName} status in collective ${siteId}`);
              }
            } else {
              // Create new membership with Brehon role
              await siteStorage.createSiteMembership({
                siteId,
                userId: user.id,
                membershipType: targetMembershipType,
                collectiveRole: targetRole,
                membershipStatus: 'active'
              });
              logger.info(`Added ${userEmail} as ${roleDisplayName} member to collective ${siteId}`);
            }
          } else {
            console.warn(`User with email ${userEmail} not found for Brehon membership in collective ${siteId}`);
          }
        } catch (membershipError) {
          logger.error(`Failed to add Brehon membership for ${userEmail} in collective ${siteId}:`, membershipError);
          // Don't fail the manager addition, just log the error
        }
      }

      res.json(manager);
    } catch (error) {
      logger.error("Error adding site manager:", error);
      res.status(500).json({ error: "Failed to add site manager" });
    }
  });

  // Remove site manager (admin only)
  app.delete("/api/sites/:siteId/managers/:userEmail", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { siteId, userEmail } = req.params;
      const decodedEmail = decodeURIComponent(userEmail);

      // For collective sites, remove their Brehon membership first
      const site = await siteStorage.getSite(siteId);
      if (site && site.siteType === 'collective') {
        try {
          // Find user by email
          const users = await storage.getAllUsers();
          const user = users.find((u: any) => u.email === decodedEmail);
          
          if (user) {
            // Check if they have a Brehon membership
            const userMemberships = await siteStorage.getUserMemberships(user.id);
            const membership = userMemberships.find(m => m.siteId === siteId && m.membershipType === 'brehon');
            
            if (membership) {
              // Remove the Brehon membership entirely
              await siteStorage.deleteSiteMembership(siteId, user.id);
              logger.info(`Removed Brehon membership for ${decodedEmail} from collective ${siteId}`);
            }
          } else {
            console.warn(`User with email ${decodedEmail} not found for Brehon membership removal in collective ${siteId}`);
          }
        } catch (membershipError) {
          logger.error(`Failed to remove Brehon membership for ${decodedEmail} in collective ${siteId}:`, membershipError);
          // Don't fail the manager removal, just log the error
        }
      }

      // Remove the site manager
      await siteStorage.removeSiteManager(siteId, decodedEmail);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error removing site manager:", error);
      res.status(500).json({ error: "Failed to remove site manager" });
    }
  });

  // Protected lead routes that require site access
  app.get("/api/sites/:siteId/leads", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeads(req.params.siteId);
      res.json(leads);
    } catch (error) {
      logger.error("Error fetching site leads:", error);
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Legal disclaimer management routes
  
  // Create a new legal disclaimer
  app.post("/api/disclaimers", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertLegalDisclaimerSchema.parse(req.body);
      const disclaimer = await siteStorage.createLegalDisclaimer(validatedData);
      res.json(disclaimer);
    } catch (error) {
      logger.error("Error creating disclaimer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create disclaimer" });
    }
  });

  // Get all legal disclaimers
  app.get("/api/disclaimers", requireAdmin, async (req, res) => {
    try {
      const disclaimers = await siteStorage.listLegalDisclaimers();
      res.json(disclaimers);
    } catch (error) {
      logger.error("Error fetching disclaimers:", error);
      res.status(500).json({ error: "Failed to fetch disclaimers" });
    }
  });

  // Get available disclaimers for a specific site type (includes global disclaimers)
  app.get("/api/sites/:siteId/available-disclaimers", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const disclaimers = await siteStorage.getAvailableDisclaimersForSiteType(site.siteType || 'general');
      res.json(disclaimers);
    } catch (error) {
      logger.error("Error fetching available disclaimers:", error);
      res.status(500).json({ error: "Failed to fetch available disclaimers" });
    }
  });

  // Get a specific legal disclaimer
  app.get("/api/disclaimers/:id", async (req, res) => {
    try {
      const disclaimer = await siteStorage.getLegalDisclaimer(req.params.id);
      if (!disclaimer) {
        return res.status(404).json({ error: "Disclaimer not found" });
      }
      res.json(disclaimer);
    } catch (error) {
      logger.error("Error fetching disclaimer:", error);
      res.status(500).json({ error: "Failed to fetch disclaimer" });
    }
  });

  // Update a legal disclaimer
  app.put("/api/disclaimers/:id", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertLegalDisclaimerSchema.partial().parse(req.body);
      const disclaimer = await siteStorage.updateLegalDisclaimer(req.params.id, validatedData);
      res.json(disclaimer);
    } catch (error) {
      logger.error("Error updating disclaimer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update disclaimer" });
    }
  });

  // Delete a legal disclaimer
  app.delete("/api/disclaimers/:id", requireAdmin, async (req, res) => {
    try {
      await siteStorage.deleteLegalDisclaimer(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting disclaimer:", error);
      res.status(500).json({ error: "Failed to delete disclaimer" });
    }
  });

  // Site disclaimer attachment routes
  
  // Attach disclaimer to site
  app.post("/api/sites/:siteId/disclaimers", requireAdmin, async (req, res) => {
    try {
      const { disclaimerId, displayOrder, linkText } = insertSiteDisclaimerSchema.parse({
        siteId: req.params.siteId,
        disclaimerId: req.body.disclaimerId,
        displayOrder: req.body.displayOrder ? String(req.body.displayOrder) : "1", // Convert to string
        linkText: req.body.linkText,
      });
      
      const attachment = await siteStorage.attachDisclaimerToSite(
        req.params.siteId, 
        disclaimerId, 
        { 
          displayOrder: displayOrder || "1", 
          linkText: linkText || "Legal Disclaimer" 
        }
      );
      res.json(attachment);
    } catch (error) {
      logger.error("Error attaching disclaimer:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to attach disclaimer" });
    }
  });

  // Get site disclaimers
  app.get("/api/sites/:siteId/disclaimers", async (req, res) => {
    try {
      const disclaimers = await siteStorage.getSiteDisclaimers(req.params.siteId);
      res.json(disclaimers);
    } catch (error) {
      logger.error("Error fetching site disclaimers:", error);
      res.status(500).json({ error: "Failed to fetch site disclaimers" });
    }
  });

  // Detach disclaimer from site
  app.delete("/api/sites/:siteId/disclaimers/:disclaimerId", requireAdmin, async (req, res) => {
    try {
      await siteStorage.detachDisclaimerFromSite(req.params.siteId, req.params.disclaimerId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error detaching disclaimer:", error);
      res.status(500).json({ error: "Failed to detach disclaimer" });
    }
  });

  // Slide Management Routes
  const objectStorageService = new ObjectStorageService();

  // Get slides for a site
  app.get("/api/sites/:siteId/slides", async (req, res) => {
    try {
      // First verify the site exists
      const site = await siteStorage.getSite(req.params.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
      const slides = await siteStorage.getSiteSlides(req.params.siteId);
      res.json(slides);
    } catch (error) {
      logger.error("Error fetching site slides:", error);
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  // Get upload URL for new slide
  app.post("/api/sites/:siteId/slides/upload", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getSlideUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      logger.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Create new slide after upload
  app.post("/api/sites/:siteId/slides", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { siteId } = req.params;
      const validatedData = insertSiteSlideSchema.parse({
        ...req.body,
        siteId
      });

      // Normalize the image URL if it's from object storage
      if (validatedData.imageUrl) {
        validatedData.imageUrl = objectStorageService.normalizeSlideObjectPath(validatedData.imageUrl);
      }

      const slide = await siteStorage.createSiteSlide(validatedData);
      res.json(slide);
    } catch (error) {
      logger.error("Error creating slide:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create slide" });
    }
  });

  // Update slide
  app.put("/api/sites/:siteId/slides/:slideId", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const validatedData = insertSiteSlideSchema.partial().parse(req.body);
      
      // Normalize the image URL if it's being updated
      if (validatedData.imageUrl) {
        validatedData.imageUrl = objectStorageService.normalizeSlideObjectPath(validatedData.imageUrl);
      }

      const slide = await siteStorage.updateSiteSlide(req.params.slideId, validatedData);
      res.json(slide);
    } catch (error) {
      logger.error("Error updating slide:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update slide" });
    }
  });

  // Delete slide
  app.delete("/api/sites/:siteId/slides/:slideId", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      await siteStorage.deleteSiteSlide(req.params.slideId);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error deleting slide:", error);
      res.status(500).json({ error: "Failed to delete slide" });
    }
  });

  // Reorder slides
  app.post("/api/sites/:siteId/slides/reorder", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slideOrders } = req.body;
      
      if (!Array.isArray(slideOrders)) {
        return res.status(400).json({ error: "slideOrders must be an array" });
      }

      await siteStorage.reorderSiteSlides(req.params.siteId, slideOrders);
      res.json({ success: true });
    } catch (error) {
      logger.error("Error reordering slides:", error);
      res.status(500).json({ error: "Failed to reorder slides" });
    }
  });

  // Serve static slide images directly from the filesystem
  app.use('/static', express.static(path.join(process.cwd(), 'client/public/static')));

  // Serve slide images from object storage
  app.get('/slide-images/*', async (req, res) => {
    const objectPath = req.path.replace('/slide-images', '');
    try {
      logger.info('Serving slide image from object storage:', { objectPath });
      
      const file = await objectStorageService.getSlideFile(objectPath);
      await objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      logger.error('Error serving slide image:', { 
        error: error.message, 
        stack: error.stack, 
        objectPath,
        errorType: error.constructor.name 
      });
      
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'Slide image not found' });
      }
      res.status(500).json({ error: 'Failed to serve slide image' });
    }
  });

  // ==== GLOBAL SLIDES ROUTES ====
  
  // Get all global slides (public endpoint for presentation viewer)
  app.get("/api/global-slides", async (req, res) => {
    try {
      const globalSlides = await siteStorage.getGlobalSlides();
      res.json(globalSlides);
    } catch (error) {
      logger.error("Error fetching global slides:", error);
      res.status(500).json({ error: "Failed to fetch global slides" });
    }
  });

  // Get global slide by key
  app.get("/api/global-slides/:slideKey", async (req, res) => {
    try {
      const globalSlide = await siteStorage.getGlobalSlideByKey(req.params.slideKey);
      if (!globalSlide) {
        return res.status(404).json({ error: "Global slide not found" });
      }
      res.json(globalSlide);
    } catch (error) {
      logger.error("Error fetching global slide:", error);
      res.status(500).json({ error: "Failed to fetch global slide" });
    }
  });

  // Create global slide (admin only)
  app.post("/api/global-slides", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      let { slideKey, title, slideType, isVisible, displayPosition, imageUrl, cardConfig } = req.body;
      
      // Normalize the image URL if it's from object storage
      if (imageUrl && imageUrl.startsWith('https://storage.googleapis.com/')) {
        const objectStorageService = new ObjectStorageService();
        imageUrl = objectStorageService.normalizeSlideObjectPath(imageUrl);
      }
      
      const newSlide = await siteStorage.createGlobalSlide({
        slideKey,
        title,
        slideType,
        isVisible,
        displayPosition,
        imageUrl,
        cardConfig,
      });
      res.json(newSlide);
    } catch (error) {
      logger.error("Error creating global slide:", error);
      res.status(500).json({ error: "Failed to create global slide" });
    }
  });

  // Get upload URL for global slides (admin only)
  app.post("/api/global-slides/upload", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getSlideUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      logger.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Update global slide visibility (admin only)
  app.patch("/api/global-slides/:slideKey/visibility", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { isVisible } = req.body;
      const updatedSlide = await siteStorage.updateGlobalSlideVisibility(req.params.slideKey, isVisible);
      if (!updatedSlide) {
        return res.status(404).json({ error: "Global slide not found" });
      }
      res.json(updatedSlide);
    } catch (error) {
      logger.error("Error updating global slide visibility:", error);
      res.status(500).json({ error: "Failed to update global slide visibility" });
    }
  });

  // Delete global slide (admin only)
  app.delete("/api/global-slides/:slideKey", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slideKey } = req.params;
      
      const deleted = await siteStorage.deleteGlobalSlide(slideKey);
      if (!deleted) {
        return res.status(404).json({ error: "Global slide not found" });
      }
      res.json({ success: true, message: "Global slide deleted successfully" });
    } catch (error) {
      logger.error("Error deleting global slide:", error);
      res.status(500).json({ error: "Failed to delete global slide" });
    }
  });

  // Reorder global slides (admin only)
  app.patch("/api/global-slides/reorder", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slides } = req.body;
      
      if (!Array.isArray(slides)) {
        return res.status(400).json({ error: "Slides must be an array" });
      }

      // Update each slide's order
      for (const slideUpdate of slides) {
        await siteStorage.updateGlobalSlideOrder(slideUpdate.slideKey, slideUpdate.order);
      }

      const updatedSlides = await siteStorage.getGlobalSlides();
      res.json(updatedSlides);
    } catch (error) {
      logger.error("Error reordering global slides:", error);
      res.status(500).json({ error: "Failed to reorder global slides" });
    }
  });

  // Sections Management Endpoints
  
  // Get sections for a site
  app.get("/api/sites/:siteId/sections", async (req, res) => {
    try {
      const { siteId } = req.params;
      
      // Check if site is launched (for public access) or requires authentication
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
      // If site is launched, allow public access
      if (site.isLaunched) {
        const sections = await siteStorage.getSiteSections(siteId);
        return res.json(sections);
      }
      
      // If site is not launched, require authentication and site access
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const user = req.user as any;
      const hasAccess = await siteStorage.checkSiteAccess(siteId, user.email, user.isAdmin);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
      
      const sections = await siteStorage.getSiteSections(siteId);
      res.json(sections);
    } catch (error) {
      logger.error("Error fetching sections:", error);
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Create a new section
  app.post("/api/sites/:siteId/sections", isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const { name, description, displayOrder } = req.body;
      const user = req.user as any;
      
      // Check if user has access to this site
      const hasAccess = await siteStorage.checkSiteAccess(siteId, user.email, user.isAdmin);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
      
      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Section name is required" });
      }
      
      const sectionData = {
        siteId,
        name: name.trim(),
        description: description?.trim() || null,
        displayOrder: parseInt(displayOrder) || 1,
        isVisible: true
      };
      
      const newSection = await siteStorage.createSiteSection(sectionData);
      res.json(newSection);
    } catch (error) {
      logger.error("Error creating section:", error);
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  // Update a section
  app.put("/api/site-sections/:sectionId", isAuthenticated, async (req, res) => {
    try {
      const { sectionId } = req.params;
      const updates = req.body;
      const user = req.user as any;
      
      // Get the section to check site access
      const section = await siteStorage.getSiteSection(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      // Check if user has access to this site
      const hasAccess = await siteStorage.checkSiteAccess(section.siteId, user.email, user.isAdmin);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
      
      const updatedSection = await siteStorage.updateSiteSection(sectionId, updates);
      res.json(updatedSection);
    } catch (error) {
      logger.error("Error updating section:", error);
      res.status(500).json({ error: "Failed to update section" });
    }
  });

  // Delete a section
  app.delete("/api/site-sections/:sectionId", isAuthenticated, async (req, res) => {
    try {
      const { sectionId } = req.params;
      const user = req.user as any;
      
      // Get the section to check site access
      const section = await siteStorage.getSiteSection(sectionId);
      if (!section) {
        return res.status(404).json({ error: "Section not found" });
      }
      
      // Check if user has access to this site
      const hasAccess = await siteStorage.checkSiteAccess(section.siteId, user.email, user.isAdmin);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this site" });
      }
      
      await siteStorage.deleteSiteSection(sectionId);
      res.json({ success: true, message: "Section deleted successfully" });
    } catch (error) {
      logger.error("Error deleting section:", error);
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // Serve presentation assets from attached_assets folder via static express middleware
  app.use('/api/assets', express.static('attached_assets', {
    maxAge: '1h',
    setHeaders: (res, path) => {
      // Set proper content types for images
      const ext = path.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (ext === 'png') {
        res.setHeader('Content-Type', 'image/png');
      } else if (ext === 'gif') {
        res.setHeader('Content-Type', 'image/gif');
      } else if (ext === 'svg') {
        res.setHeader('Content-Type', 'image/svg+xml');
      }
    }
  }));


  // Site membership management routes (admin only)
  app.get("/api/sites/:siteId/memberships", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { siteId } = req.params;
      const memberships = await siteStorage.getSiteMemberships(siteId);
      res.json(memberships);
    } catch (error) {
      logger.error("Error fetching site memberships:", error);
      res.status(500).json({ error: "Failed to fetch site memberships" });
    }
  });

  app.post("/api/sites/:siteId/memberships", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { siteId } = req.params;
      const { userId, membershipType = "member", accessLevel = "read" } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const membership = await siteStorage.createSiteMembership({
        siteId,
        userId,
        membershipType,
        accessLevel,
        isActive: true
      });

      res.status(201).json(membership);
    } catch (error) {
      logger.error("Error creating site membership:", error);
      res.status(500).json({ error: "Failed to create site membership" });
    }
  });

  app.put("/api/sites/:siteId/memberships/:userId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { siteId, userId } = req.params;
      const updates = req.body;

      const membership = await siteStorage.updateSiteMembership(siteId, userId, updates);
      
      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      res.json(membership);
    } catch (error) {
      logger.error("Error updating site membership:", error);
      res.status(500).json({ error: "Failed to update site membership" });
    }
  });

  app.delete("/api/sites/:siteId/memberships/:userId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { siteId, userId } = req.params;
      
      const deleted = await siteStorage.deleteSiteMembership(siteId, userId);
      
      if (!deleted) {
        return res.status(404).json({ error: "Membership not found" });
      }

      res.json({ success: true, message: "Membership deleted successfully" });
    } catch (error) {
      logger.error("Error deleting site membership:", error);
      res.status(500).json({ error: "Failed to delete site membership" });
    }
  });

  // Get current user's memberships (authenticated only)
  app.get("/api/memberships", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const memberships = await siteStorage.getUserMemberships(user.id);
      res.json(memberships);
    } catch (error) {
      logger.error("Error fetching user memberships:", error);
      res.status(500).json({ error: "Failed to fetch user memberships" });
    }
  });

  // Member-facing endpoints (non-admin access)
  
  // Get membership status for current user
  app.get('/api/sites/:siteId/membership', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check membership in database first
      const memberships = await siteStorage.getUserMemberships(userId);
      const membership = memberships.find(m => m.siteId === siteId);
      
      if (!membership) {
        return res.json({ 
          isMember: false 
        });
      }

      return res.json({
        isMember: true,
        collectiveRole: membership.collectiveRole,
        membershipStatus: membership.membershipStatus,
        joinedAt: membership.joinedAt,
        permissions: membership.permissions
      });
    } catch (error) {
      logger.error('Error checking membership:', error);
      res.status(500).json({ error: 'Failed to check membership' });
    }
  });

  // Get site members list (for members only)
  app.get('/api/sites/:siteId/members', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if user is a member or admin
      let isMember = (req.user as any)?.isAdmin;
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        isMember = memberships.some(m => m.siteId === siteId);
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      // Get all members for this site
      const memberships = await siteStorage.getSiteMemberships(siteId);
      
      return res.json(memberships);
    } catch (error) {
      logger.error('Error getting members:', error);
      res.status(500).json({ error: 'Failed to get members' });
    }
  });

  // Join collective endpoint
  app.post('/api/sites/:siteId/join', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ error: 'Site not found' });
      }

      // Check if already a member
      const memberships = await siteStorage.getUserMemberships(userId);
      const existingMembership = memberships.find(m => m.siteId === siteId);
      
      if (existingMembership) {
        return res.json({ 
          success: true, 
          message: 'Already a member',
          membership: existingMembership,
          redirectUrl: `/site/${siteId}/home`
        });
      }

      // Create membership using the existing method
      const membership = await siteStorage.createSiteMembership({
        siteId,
        userId,
        membershipType: 'member',
        accessLevel: 'read',
        isActive: true
      });

      return res.json({ 
        success: true, 
        message: 'Successfully joined collective',
        membership,
        redirectUrl: `/site/${siteId}/home`
      });
    } catch (error) {
      logger.error('Error joining collective:', error);
      res.status(500).json({ error: 'Failed to join collective' });
    }
  });

  // Get user's tasks for a site
  app.get('/api/sites/:siteId/tasks/user', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check membership
      let isMember = (req.user as any)?.isAdmin;
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        isMember = memberships.some(m => m.siteId === siteId);
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      // Get user's assigned tasks
      const userTasks = await siteStorage.getUserTasks(siteId, userId);
      return res.json(userTasks);
    } catch (error) {
      logger.error('Error getting user tasks:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  });

  // Get all tasks for a collective (only for site managers and admins)
  app.get('/api/sites/:siteId/tasks', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { status, limit = 50, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Get all tasks
      const tasks = await siteStorage.getCollectiveTasks(siteId, {
        status: status as string,
        limit: Number(limit),
        offset: Number(offset)
      });

      return res.json(tasks);
    } catch (error) {
      logger.error('Error getting collective tasks:', error);
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  });

  // Create a new task (only for site managers and admins)
  app.post('/api/sites/:siteId/tasks', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { 
        title, 
        description, 
        priority, 
        dueDate,
        taskType,
        assignTo,
        specificUsers,
        documentUrl,
        requiresUpload,
        uploadFileTypes,
        instructions
      } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'Task description is required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Build task configuration based on task type
      const taskConfig: any = {};
      
      if (taskType === 'document_review' && documentUrl) {
        taskConfig.documentUrl = documentUrl.trim();
        taskConfig.requiresUpload = requiresUpload || false;
      }
      
      if (taskType === 'upload') {
        taskConfig.requiresUpload = true;
        taskConfig.uploadFileTypes = uploadFileTypes ? uploadFileTypes.split(',').map(t => t.trim()) : [];
      }
      
      if (instructions && instructions.trim()) {
        taskConfig.instructions = instructions.trim();
      }

      // Create the task
      const taskData = {
        siteId,
        title: title.trim(),
        description: description.trim(),
        taskType: taskType || 'general',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
        assignedToRole: assignTo || 'all_members',
        taskConfig
      };

      const task = await siteStorage.createCollectiveTask(taskData);

      // Automatically assign the task based on the assignment target
      const targetUserIds = await getAssignmentTargetUsers(siteId, assignTo, specificUsers);
      
      if (targetUserIds.length > 0) {
        // Create assignments for all target users
        const assignmentPromises = targetUserIds.map(targetUserId => 
          siteStorage.assignTaskToUser(task.id, targetUserId, userId)
        );
        
        await Promise.all(assignmentPromises);
        logger.info(`Task ${task.id} assigned to ${targetUserIds.length} users`);
      }

      return res.json({ ...task, assignedCount: targetUserIds.length });
    } catch (error) {
      logger.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Helper function to get target users for assignment
  async function getAssignmentTargetUsers(siteId: string, assignTo: string, specificUsers?: string[]): Promise<string[]> {
    try {
      const siteMembers = await siteStorage.getSiteMembers(siteId);
      
      switch (assignTo) {
        case 'all_members':
          return siteMembers.map((member: any) => member.id);
          
        case 'brehons_only':
          return siteMembers
            .filter((member: any) => member.collectiveRole === 'brehon' || member.collectiveRole === 'ard_brehon')
            .map((member: any) => member.id);
            
        case 'members_only':
          return siteMembers
            .filter((member: any) => member.collectiveRole === 'member')
            .map((member: any) => member.id);
            
        case 'specific_users':
          if (specificUsers && specificUsers.length > 0) {
            // Filter to only include users who are actually members of this site
            const memberIds = siteMembers.map((member: any) => member.id);
            return specificUsers.filter(userId => memberIds.includes(userId));
          }
          return [];
          
        default:
          return [];
      }
    } catch (error) {
      logger.error('Error getting assignment target users:', error);
      return [];
    }
  }

  // Update a task (only for site managers and admins)
  app.put('/api/sites/:siteId/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, taskId } = req.params;
      const userId = (req.user as any)?.id;
      const { title, description, status, priority, dueDate } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Check if task exists and belongs to this site
      const existingTask = await siteStorage.getCollectiveTaskById(taskId);
      if (!existingTask || existingTask.siteId !== siteId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Prepare updates
      const updates: any = {};
      if (title !== undefined) updates.title = title.trim();
      if (description !== undefined) updates.description = description.trim();
      if (status !== undefined) updates.status = status;
      if (priority !== undefined) updates.priority = priority;
      if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;
      if (status === 'completed' && !existingTask.completedAt) {
        updates.completedAt = new Date();
      } else if (status !== 'completed' && existingTask.completedAt) {
        updates.completedAt = null;
      }

      const updatedTask = await siteStorage.updateCollectiveTask(taskId, updates);
      return res.json(updatedTask);
    } catch (error) {
      logger.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task (only for site managers and admins)
  app.delete('/api/sites/:siteId/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, taskId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Check if task exists and belongs to this site
      const existingTask = await siteStorage.getCollectiveTaskById(taskId);
      if (!existingTask || existingTask.siteId !== siteId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await siteStorage.deleteCollectiveTask(taskId);
      return res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      logger.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Assign a task to a user (only for site managers and admins)
  app.post('/api/sites/:siteId/tasks/:taskId/assign', isAuthenticated, async (req, res) => {
    try {
      const { siteId, taskId } = req.params;
      const userId = (req.user as any)?.id;
      const { assigneeUserId } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!assigneeUserId) {
        return res.status(400).json({ error: 'Assignee user ID is required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Check if task exists and belongs to this site
      const existingTask = await siteStorage.getCollectiveTaskById(taskId);
      if (!existingTask || existingTask.siteId !== siteId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if assignee is a member of the collective
      const assigneeMemberships = await siteStorage.getUserMemberships(assigneeUserId);
      const isAssigneeMember = assigneeMemberships.some(m => m.siteId === siteId);
      if (!isAssigneeMember) {
        return res.status(400).json({ error: 'Assignee must be a member of this collective' });
      }

      const assignment = await siteStorage.assignTaskToUser(taskId, assigneeUserId, userId);
      return res.json(assignment);
    } catch (error) {
      logger.error('Error assigning task:', error);
      res.status(500).json({ error: 'Failed to assign task' });
    }
  });

  // Unassign a task from a user (only for site managers and admins)
  app.delete('/api/sites/:siteId/tasks/:taskId/assign/:assigneeUserId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, taskId, assigneeUserId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Check if task exists and belongs to this site
      const existingTask = await siteStorage.getCollectiveTaskById(taskId);
      if (!existingTask || existingTask.siteId !== siteId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await siteStorage.unassignTaskFromUser(taskId, assigneeUserId);
      return res.json({ success: true, message: 'Task unassigned successfully' });
    } catch (error) {
      logger.error('Error unassigning task:', error);
      res.status(500).json({ error: 'Failed to unassign task' });
    }
  });

  // Get task assignments (only for site managers and admins)
  app.get('/api/sites/:siteId/tasks/:taskId/assignments', isAuthenticated, async (req, res) => {
    try {
      const { siteId, taskId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check role permissions (site manager or admin)
      const userRole = await siteAccessControl.getUserRole(userId, siteId);
      if (!['site_manager', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Site manager permissions required' });
      }

      // Check if task exists and belongs to this site
      const existingTask = await siteStorage.getCollectiveTaskById(taskId);
      if (!existingTask || existingTask.siteId !== siteId) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const assignments = await siteStorage.getTaskAssignments(taskId);
      return res.json(assignments);
    } catch (error) {
      logger.error('Error getting task assignments:', error);
      res.status(500).json({ error: 'Failed to get task assignments' });
    }
  });

  // Get messages for a collective
  app.get('/api/sites/:siteId/messages', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership
      let isMember = (req.user as any)?.isAdmin;
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        isMember = memberships.some(m => m.siteId === siteId);
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      // Get messages from the database
      const messages = await siteStorage.getCollectiveMessages(siteId, {
        limit: Number(limit),
        offset: Number(offset)
      });

      return res.json(messages);
    } catch (error) {
      logger.error('Error getting messages:', error);
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  // Send a message to a collective
  app.post('/api/sites/:siteId/messages', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { content, messageType = 'text', messageData = {} } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership
      let isMember = (req.user as any)?.isAdmin;
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        isMember = memberships.some(m => m.siteId === siteId);
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      // Create the message
      const message = await siteStorage.createCollectiveMessage({
        siteId,
        senderId: userId,
        content: content.trim(),
        messageType,
        messageData
      });

      // Get the full message with sender info
      const messageWithSender = await siteStorage.getCollectiveMessageWithSender(message.id);

      return res.json(messageWithSender);
    } catch (error) {
      logger.error('Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // ===== BLOG POSTS ENDPOINTS =====

  // Get blog posts for a collective
  app.get('/api/sites/:siteId/blog-posts', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { status, limit = 20, offset = 0 } = req.query;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership and get user's role
      let isMember = (req.user as any)?.isAdmin;
      let userRole = 'member';
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        isMember = !!membership;
        userRole = membership?.collectiveRole || 'member';
      } else {
        userRole = 'site_manager'; // Admin has highest privileges
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      // Get blog posts based on user role and filters
      const blogPosts = await siteStorage.getCollectiveBlogPosts(siteId, {
        status: status as string,
        userRole,
        limit: Number(limit),
        offset: Number(offset)
      });

      return res.json(blogPosts);
    } catch (error) {
      logger.error('Error getting blog posts:', error);
      res.status(500).json({ error: 'Failed to get blog posts' });
    }
  });

  // Get a single blog post by ID
  app.get('/api/sites/:siteId/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, postId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership and get user's role
      let isMember = (req.user as any)?.isAdmin;
      let userRole = 'member';
      if (!isMember) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        isMember = !!membership;
        userRole = membership?.collectiveRole || 'member';
      } else {
        userRole = 'site_manager';
      }
      
      if (!isMember) {
        return res.status(403).json({ error: 'Membership required' });
      }

      const blogPost = await siteStorage.getCollectiveBlogPostById(postId);
      
      if (!blogPost || blogPost.siteId !== siteId) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      // Check visibility permissions
      if (blogPost.visibility === 'brehons' && userRole === 'member') {
        return res.status(403).json({ error: 'Insufficient permissions to view this post' });
      }

      // Increment view count
      await siteStorage.incrementBlogPostViewCount(postId);

      return res.json(blogPost);
    } catch (error) {
      logger.error('Error getting blog post:', error);
      res.status(500).json({ error: 'Failed to get blog post' });
    }
  });

  // Create a new blog post (Brehons and Site Managers only)
  app.post('/api/sites/:siteId/blog-posts', isAuthenticated, async (req, res) => {
    try {
      const { siteId } = req.params;
      const userId = (req.user as any)?.id;
      const { title, content, excerpt, status = 'draft', visibility = 'members', tags = [], featuredImageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership and permissions
      let canCreatePosts = (req.user as any)?.isAdmin;
      let userRole = 'member';
      
      if (!canCreatePosts) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        if (membership) {
          userRole = membership.collectiveRole;
          canCreatePosts = userRole === 'brehon' || userRole === 'site_manager';
        }
      } else {
        userRole = 'site_manager';
      }
      
      if (!canCreatePosts) {
        return res.status(403).json({ error: 'Only brehons and site managers can create blog posts' });
      }

      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      const blogPostData = {
        siteId,
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim(),
        slug,
        authorId: userId,
        status,
        visibility,
        tags: Array.isArray(tags) ? tags : [],
        featuredImageUrl: featuredImageUrl?.trim(),
        publishedAt: status === 'published' ? new Date() : null
      };

      const blogPost = await siteStorage.createCollectiveBlogPost(blogPostData);

      return res.json(blogPost);
    } catch (error) {
      logger.error('Error creating blog post:', error);
      if (error.message?.includes('duplicate key')) {
        return res.status(409).json({ error: 'A post with this title already exists for this site' });
      }
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  // Update a blog post (Brehons and Site Managers only)
  app.put('/api/sites/:siteId/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, postId } = req.params;
      const userId = (req.user as any)?.id;
      const { title, content, excerpt, status, visibility = 'members_only', tags = [], featuredImageUrl } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership and permissions
      let canEditPosts = (req.user as any)?.isAdmin;
      let userRole = 'member';
      
      if (!canEditPosts) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        if (membership) {
          userRole = membership.collectiveRole;
          canEditPosts = userRole === 'brehon' || userRole === 'site_manager';
        }
      } else {
        userRole = 'site_manager';
      }
      
      if (!canEditPosts) {
        return res.status(403).json({ error: 'Only brehons and site managers can edit blog posts' });
      }

      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt?.trim(),
        slug,
        status,
        visibility,
        tags: Array.isArray(tags) ? tags : [],
        featuredImageUrl: featuredImageUrl?.trim(),
        publishedAt: status === 'published' ? new Date() : null,
        updatedAt: new Date()
      };

      const updatedPost = await siteStorage.updateCollectiveBlogPost(postId, updateData);

      if (!updatedPost) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      return res.json(updatedPost);
    } catch (error) {
      logger.error('Error updating blog post:', error);
      if (error.message?.includes('duplicate key')) {
        return res.status(409).json({ error: 'A post with this title already exists for this site' });
      }
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  // Publish/unpublish a blog post (Brehons and Site Managers only)
  app.patch('/api/sites/:siteId/blog-posts/:postId/status', isAuthenticated, async (req, res) => {
    try {
      const { siteId, postId } = req.params;
      const userId = (req.user as any)?.id;
      const { status } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!status || !['draft', 'published'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "draft" or "published"' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Check membership and permissions
      let canPublishPosts = (req.user as any)?.isAdmin;
      let userRole = 'member';
      
      if (!canPublishPosts) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        if (membership) {
          userRole = membership.collectiveRole;
          canPublishPosts = userRole === 'brehon' || userRole === 'site_manager';
        }
      } else {
        userRole = 'site_manager';
      }
      
      if (!canPublishPosts) {
        return res.status(403).json({ error: 'Only brehons and site managers can publish/unpublish blog posts' });
      }

      const updateData = {
        status,
        publishedAt: status === 'published' ? new Date() : null,
        updatedAt: new Date()
      };

      const updatedPost = await siteStorage.updateCollectiveBlogPost(postId, updateData);

      if (!updatedPost) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      return res.json(updatedPost);
    } catch (error) {
      logger.error('Error updating blog post status:', error);
      res.status(500).json({ error: 'Failed to update blog post status' });
    }
  });

  // Delete a blog post (Author, Brehons, and Site Managers)
  app.delete('/api/sites/:siteId/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { siteId, postId } = req.params;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check if site exists and is a collective
      const site = await siteStorage.getSite(siteId);
      if (!site || site.siteType !== 'collective') {
        return res.status(404).json({ error: 'Collective not found' });
      }

      // Get the existing blog post
      const existingPost = await siteStorage.getCollectiveBlogPostById(postId);
      if (!existingPost || existingPost.siteId !== siteId) {
        return res.status(404).json({ error: 'Blog post not found' });
      }

      // Check permissions (author, brehons, site managers, or admins can delete)
      let canDelete = (req.user as any)?.isAdmin || existingPost.authorId === userId;
      
      if (!canDelete) {
        const memberships = await siteStorage.getUserMemberships(userId);
        const membership = memberships.find(m => m.siteId === siteId);
        if (membership) {
          const userRole = membership.collectiveRole;
          canDelete = userRole === 'brehon' || userRole === 'site_manager';
        }
      }
      
      if (!canDelete) {
        return res.status(403).json({ error: 'You can only delete your own posts or you need brehon/site manager privileges' });
      }

      await siteStorage.deleteCollectiveBlogPost(postId);

      return res.json({ success: true, message: 'Blog post deleted successfully' });
    } catch (error) {
      logger.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  logger.info("Site management routes registered");
}