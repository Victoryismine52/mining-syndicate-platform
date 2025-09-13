import type { Express, Response } from "express";
import express from "express";
import path from "path";
import { siteStorage } from "../site-storage";
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
  app.get("/api/sites/:slug", async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.slug);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      // Map slug to siteId for UI compatibility
      const siteWithSiteId = {
        ...site,
        siteId: site.slug
      };
      res.json(siteWithSiteId);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site");
      res.status(500).json({ error: "Failed to fetch site" });
    }
  });

  // Get sites that the current user manages
  app.get("/api/user/managed-sites", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const isAdmin = user?.role === 'admin' || user?.isAdmin;

      if (isAdmin) {
        // Admins manage all sites
        const sites = await siteStorage.listSites();
        res.json(sites);
      } else {
        // Get sites where this user is a site manager
        const allSites = await siteStorage.listSites();
        const managedSites = [];
        
        for (const site of allSites) {
          const isSiteManager = await siteStorage.isSiteManager(site.slug, user.email);
          if (isSiteManager) {
            managedSites.push(site);
          }
        }
        
        res.json(managedSites);
      }
    } catch (error) {
      logger.error({ err: error }, "Error listing managed sites");
      res.status(500).json({ error: "Failed to list managed sites" });
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
        const mainSiteExists = sites.some(site => site.slug === 'main');
        if (!mainSiteExists) {
          const mainSite = await siteStorage.getSite('main');
          if (mainSite) {
            sites.unshift(mainSite); // Add to beginning of array
          }
        }
        // Map sites to include siteId for backward compatibility with UI routing
        const sitesWithSiteId = sites.map(site => ({
          ...site,
          siteId: site.slug // Map slug to siteId for UI compatibility
        }));
        res.json(sitesWithSiteId);
      } else {
        // Regular users get only public sites and sites they're members of
        const allSites = await siteStorage.listSites();
        const userMemberships = await siteStorage.getUserMemberships(user.id);
        const memberSiteIds = userMemberships.map(m => m.siteId);

        // Filter to include only public sites or sites user is a member of
        const accessibleSites = allSites.filter(site => {
          // Include all launched sites (public access)
          if (site.isLaunched) return true;
          // Include sites user is a member of (compare UUIDs to UUIDs)
          if (memberSiteIds.includes(site.id)) return true;
          return false;
        });

        // Map sites to include siteId for backward compatibility with UI routing
        const sitesWithSiteId = accessibleSites.map(site => ({
          ...site,
          siteId: site.slug // Map slug to siteId for UI compatibility
        }));

        res.json(sitesWithSiteId);
      }
    } catch (error) {
      logger.error({ err: error }, "Error listing sites");
      res.status(500).json({ error: "Failed to list sites" });
    }
  });

  // Check slug availability
  app.get("/api/sites/check-slug/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const existingSite = await siteStorage.getSite(slug);

      res.json({
        available: !existingSite,
        slug: slug,
        message: existingSite ? "Site URL is already taken" : "Site URL is available"
      });
    } catch (error) {
      logger.error({ err: error }, "Error checking slug availability");
      res.status(500).json({ error: "Failed to check slug availability" });
    }
  });

  // Update site
  app.put("/api/sites/:slug", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slug } = req.params;
      const updates = insertSiteSchema.partial().parse(req.body);

      logger.info(`Site update request for ${slug}:`, updates);

      // If updating slug, check availability first
      if (updates.slug && updates.slug !== slug) {
        logger.info(`Checking availability of new slug: ${updates.slug}`);
        const existingSite = await siteStorage.getSite(updates.slug);
        if (existingSite) {
          logger.warn(`Slug ${updates.slug} is already taken`);
          return res.status(400).json({ error: "Site URL is already taken" });
        }
        logger.info(`Slug ${updates.slug} is available`);
      }

      // Remove any attempts to update siteId - it should remain immutable
      if ((updates as any).siteId) {
        delete (updates as any).siteId;
      }

      // Update the site using the current slug as the lookup key
      logger.info(`Updating site with slug ${slug}`);
      const site = await siteStorage.updateSiteBySlug(slug, updates);
      if (!site) {
        logger.error(`Site update failed for slug ${slug}`);
        return res.status(404).json({ error: "Site not found" });
      }

      logger.info(`Site updated successfully: ${JSON.stringify(site)}`);

      // Map slug back to siteId for UI compatibility
      const responseData = {
        ...site,
        siteId: site.slug
      };

      res.json(responseData);
    } catch (error) {
      logger.error({ err: error }, `Error updating site ${req.params.slug}`);
      res.status(500).json({ error: "Failed to update site" });
    }
  });

  // Delete site
  app.delete("/api/sites/:slug", async (req, res) => {
    try {
      await siteStorage.deleteSite(req.params.slug);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error deleting site");
      res.status(500).json({ error: "Failed to delete site" });
    }
  });

  // Submit lead for specific site
  app.post("/api/sites/:slug/leads", async (req, res) => {
    try {
      const siteId = req.params.slug;
      logger.info(`Starting lead submission for slug: ${siteId}`);

      // Check if site exists
      const site = await siteStorage.getSite(siteId);
      logger.info(`Site lookup result for slug ${siteId}:`, { 
        siteExists: !!site,
        siteData: site ? { id: site.id, slug: site.slug, name: site.name } : null 
      });
      
      if (!site) {
        logger.error(`Site not found for slug: ${siteId}`);
        return res.status(404).json({ error: "Site not found" });
      }

      // Handle payload from SimpleFormModal: { formTemplateId?, formData: {...} } or direct fields
      const { formTemplateId, formData: submittedFormData, ...otherFields } = req.body;
      
      const dynamicFormData = submittedFormData || {};
      
      // Extract or derive standard fields for validation  
      const standardLeadData = {
        firstName: dynamicFormData.firstName || otherFields.firstName,
        lastName: dynamicFormData.lastName || otherFields.lastName,
        email: dynamicFormData.email || otherFields.email,
        phone: dynamicFormData.phone || otherFields.phone,
        company: dynamicFormData.company || otherFields.company,
        identifier: otherFields.identifier || dynamicFormData.email || `unknown-${Date.now()}`,
        identifierType: otherFields.identifierType || 'email',
        formType: otherFields.formType || 'dynamic-form',
        submissionCount: otherFields.submissionCount || '1',
        miningAmount: dynamicFormData.miningAmount || otherFields.miningAmount,
        lendingAmount: dynamicFormData.lendingAmount || otherFields.lendingAmount,
        slug: siteId, // Validation schema expects slug field
        siteId: site.slug // Use slug for foreign key as database expects
      };
      
      const validatedData = insertSiteLeadSchema.parse(standardLeadData);

      // Add tracking information and dynamic form data
      const fullLeadData = {
        ...validatedData,
        formTemplateId,
        formData: dynamicFormData, // Store extensible_list arrays and other dynamic fields in formData JSONB
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
            firstName: validatedData.firstName || undefined,
            lastName: validatedData.lastName || undefined,
            email: validatedData.email || undefined,
            phone: validatedData.phone || undefined,
            company: validatedData.company || undefined,
          };

          const result = await hubspotService.createContact(contactData);
          if (result) {
            logger.info(`Contact created/updated in HubSpot with ID: ${result.id}`);
            // Update the lead with HubSpot contact ID
            try {
              await siteStorage.updateSiteLead(lead.id, { hubspotContactId: result.id } as any);
              logger.info(`Lead ${lead.id} updated with HubSpot contact ID ${result.id}`);
            } catch (updateError) {
              logger.error(
                { err: updateError },
                "Failed to update lead with HubSpot contact ID"
              );
            }
          }
        } catch (hubspotError) {
          logger.error({ err: hubspotError }, "HubSpot contact creation failed");
          // Continue - don't fail the whole request if HubSpot fails
        }
      }

      // Legacy: Submit to HubSpot with site-specific form ID (fallback for existing configurations)
      if (!hubspotService && site.hubspotFormIds) {
        const formIds = site.hubspotFormIds as any;
        let hubspotFormId = '';

        switch (validatedData.formType) {
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
              firstName: validatedData.firstName,
              lastName: validatedData.lastName,
              email: validatedData.email,
              phone: validatedData.phone || '',
              interests: dynamicFormData.interests || [],
              formType: validatedData.formType,
              message: dynamicFormData.message,
              miningAmount: validatedData.miningAmount,
              lendingAmount: validatedData.lendingAmount,
              // Add site-specific qualifiers
              siteName: site.name,
              siteId: site.id,
              leadSource: `Site: ${site.name} (${site.slug})`,
            });
          } catch (hubspotError) {
            logger.error({ err: hubspotError }, "HubSpot form submission failed");
            // Continue - don't fail the whole request if HubSpot fails
          }
        }
      }

      res.json({ success: true, leadId: lead.id });
    } catch (error) {
      logger.error({ err: error }, "Error submitting site lead");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to submit lead" });
    }
  });

  // Track analytics events for a site
  app.post("/api/sites/:slug/analytics", async (req, res, next) => {
    try {
      const { slug } = z.object({
        slug: z.string().min(1, "Site slug required")
      }).parse(req.params);
      const consentSchema = z.object({ status: z.literal('granted'), timestamp: z.number() });
      try {
        consentSchema.parse(req.body.consent);
      } catch {
        return res.status(400).json({ error: 'Missing analytics consent' });
      }
      const analyticsData = insertSiteAnalyticsSchema.parse({
        siteId: slug,
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
  app.get("/api/sites/:slug/leads", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeads(req.params.slug);
      res.json(leads);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site leads");
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Get leads by type for specific site
  app.get("/api/sites/:slug/leads/:formType", async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeadsByType(req.params.slug, req.params.formType);
      res.json(leads);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site leads by type");
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  // Regenerate QR code for site
  app.post("/api/sites/:slug/qr-code", async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.slug);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const siteUrl = `${req.protocol}://${req.get('host')}/site/${site.slug}`;
      const qrCodeUrl = await qrGenerator.generateQRCode(siteUrl, site.slug);

      const updatedSite = await siteStorage.updateSite(site.id, {
        qrCodeUrl: qrCodeUrl
      });

      res.json({ qrCodeUrl: updatedSite.qrCodeUrl });
    } catch (error) {
      logger.error({ err: error }, "Error generating QR code");
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // Site manager routes (protected)

  // Get site managers (admin or site managers can view)
  app.get("/api/sites/:slug/managers", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slug } = z.object({
        slug: z.string().min(1, "Site slug required")
      }).parse(req.params);
      
      // Get the site to get the permanent ID
      const site = await siteStorage.getSite(slug);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
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
        .where(eq(siteManagers.siteId, site.slug));

      const managers: SiteManagerWithAccount[] = rows.map((row) => ({
        id: row.id,
        siteId: row.siteId,
        userEmail: row.userEmail,
        createdAt: row.createdAt,
        hasAccount: !!row.existingEmail,
      }));

      res.json(managers);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site managers");
      res.status(500).json({ error: "Failed to fetch site managers" });
    }
  });

  // Add site manager (admin or site manager only)
  app.post("/api/sites/:slug/managers", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { userEmail } = req.body;
      const { slug } = req.params;

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Check if manager already exists
      const isManager = await siteStorage.isSiteManager(slug, userEmail);
      if (isManager) {
        return res.status(400).json({ error: "User is already a site manager" });
      }

      // Add the site manager
      const manager = await siteStorage.addSiteManager(slug, userEmail);

      // Get the site for collective logic using the slug
      const site = await siteStorage.getSite(slug);
      if (site && site.siteType === 'collective') {
        try {
          // Find user by email
          const users = await storage.getAllUsers();
          const user = users.find((u: any) => u.email === userEmail);

          if (user) {
            // Check if they're already a member
            const userMemberships = await siteStorage.getUserMemberships(user.id);
            const existingMembership = userMemberships.find(m => m.siteId === site.id);

            // All site managers get Brehon role, regardless of global admin status
            const targetRole = 'brehon';
            const targetMembershipType = 'brehon';
            const roleDisplayName = 'Brehon';

            if (existingMembership) {
              // Update existing membership to Brehon role if they're not already at that level
              if (existingMembership.collectiveRole !== targetRole) {
                await siteStorage.updateSiteMembership(site.id, user.id, {
                  membershipType: targetMembershipType,
                  collectiveRole: targetRole
                });
                logger.info(`Updated ${userEmail} to ${roleDisplayName} status in collective ${site.id}`);
              }
            } else {
              // Create new membership with Brehon role
              await siteStorage.createSiteMembership({
                siteId: site.id,
                userId: user.id,
                membershipType: targetMembershipType,
                collectiveRole: targetRole,
                membershipStatus: 'active'
              });
              logger.info(`Added ${userEmail} as ${roleDisplayName} member to collective ${site.id}`);
            }
          } else {
            console.warn(`User with email ${userEmail} not found for Brehon membership in collective ${site.id}`);
          }
        } catch (membershipError) {
          logger.error(`Failed to add Brehon membership for ${userEmail} in collective ${site.id}:`, membershipError);
          // Don't fail the manager addition, just log the error
        }
      }

      res.json(manager);
    } catch (error) {
      logger.error({ err: error }, "Error adding site manager");
      res.status(500).json({ error: "Failed to add site manager" });
    }
  });

  // Remove site manager (admin or site manager only)
  app.delete("/api/sites/:slug/managers/:userEmail", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slug, userEmail } = req.params;
      const decodedEmail = decodeURIComponent(userEmail);

      // For collective sites, remove their Brehon membership first
      const site = await siteStorage.getSite(slug);
      if (site && site.siteType === 'collective') {
        try {
          // Find user by email
          const users = await storage.getAllUsers();
          const user = users.find((u: any) => u.email === decodedEmail);

          if (user) {
            // Check if they have a Brehon membership
            const userMemberships = await siteStorage.getUserMemberships(user.id);
            const membership = userMemberships.find(m => m.siteId === site.id && m.membershipType === 'brehon');

            if (membership) {
              // Remove the Brehon membership entirely
              await siteStorage.deleteSiteMembership(site.id, user.id);
              logger.info(`Removed Brehon membership for ${decodedEmail} from collective ${site.id}`);
            }
          } else {
            console.warn(`User with email ${decodedEmail} not found for Brehon membership removal in collective ${site.id}`);
          }
        } catch (membershipError) {
          logger.error(`Failed to remove Brehon membership for ${decodedEmail} in collective ${site.id}:`, membershipError);
          // Don't fail the manager removal, just log the error
        }
      }

      // Remove the site manager
      await siteStorage.removeSiteManager(slug, decodedEmail);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error removing site manager");
      res.status(500).json({ error: "Failed to remove site manager" });
    }
  });

  // Protected lead routes that require site access
  app.get("/api/sites/:slug/leads", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const leads = await siteStorage.getSiteLeads(req.params.slug);
      res.json(leads);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site leads");
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
      logger.error({ err: error }, "Error creating disclaimer");
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
      logger.error({ err: error }, "Error fetching disclaimers");
      res.status(500).json({ error: "Failed to fetch disclaimers" });
    }
  });

  // Get available disclaimers for a specific site type (includes global disclaimers)
  app.get("/api/sites/:slug/available-disclaimers", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const site = await siteStorage.getSite(req.params.slug);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      const disclaimers = await siteStorage.getAvailableDisclaimersForSiteType(site.siteType || 'general');
      res.json(disclaimers);
    } catch (error) {
      logger.error({ err: error }, "Error fetching available disclaimers");
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
      logger.error({ err: error }, "Error fetching disclaimer");
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
      logger.error({ err: error }, "Error updating disclaimer");
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
      logger.error({ err: error }, "Error deleting disclaimer");
      res.status(500).json({ error: "Failed to delete disclaimer" });
    }
  });

  // Site disclaimer attachment routes

  // Attach disclaimer to site
  app.post("/api/sites/:slug/disclaimers", requireAdmin, async (req, res) => {
    try {
      const { disclaimerId, displayOrder, linkText } = insertSiteDisclaimerSchema.parse({
        siteId: req.params.slug,
        disclaimerId: req.body.disclaimerId,
        displayOrder: req.body.displayOrder ? String(req.body.displayOrder) : "1", // Convert to string
        linkText: req.body.linkText,
      });

      const attachment = await siteStorage.attachDisclaimerToSite(
        req.params.slug,
        disclaimerId,
        {
          displayOrder: displayOrder || "1",
          linkText: linkText || "Legal Disclaimer"
        }
      );
      res.json(attachment);
    } catch (error) {
      logger.error({ err: error }, "Error attaching disclaimer");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to attach disclaimer" });
    }
  });

  // Get site disclaimers
  app.get("/api/sites/:slug/disclaimers", async (req, res) => {
    try {
      const disclaimers = await siteStorage.getSiteDisclaimers(req.params.slug);
      res.json(disclaimers);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site disclaimers");
      res.status(500).json({ error: "Failed to fetch site disclaimers" });
    }
  });

  // Detach disclaimer from site
  app.delete("/api/sites/:slug/disclaimers/:disclaimerId", requireAdmin, async (req, res) => {
    try {
      await siteStorage.detachDisclaimerFromSite(req.params.slug, req.params.disclaimerId);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error detaching disclaimer");
      res.status(500).json({ error: "Failed to detach disclaimer" });
    }
  });

  // Slide Management Routes
  const objectStorageService = new ObjectStorageService();

  // Get slides for a site
  app.get("/api/sites/:slug/slides", async (req, res) => {
    try {
      const siteId = req.params.slug;
      logger.info('Fetching slides for site:', { siteId });

      // First verify the site exists
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        logger.warn('Site not found when fetching slides:', { siteId });
        return res.status(404).json({ error: "Site not found" });
      }

      logger.info('Site found, fetching slides:', { siteId, siteName: site.name });
      const slides = await siteStorage.getSiteSlides(siteId);

      logger.info('Retrieved slides from database:', {
        siteId,
        slideCount: slides.length,
        slides: slides.map(slide => ({
          id: slide.id,
          title: slide.title,
          imageUrl: slide.imageUrl,
          isVisible: slide.isVisible,
          slideOrder: slide.slideOrder,
          slideType: slide.slideType
        }))
      });

      res.json(slides);
    } catch (error) {
      logger.error("Error fetching site slides:", { siteId: req.params.slug, error });
      res.status(500).json({ error: "Failed to fetch slides" });
    }
  });

  // Get upload URL for new slide
  app.post("/api/sites/:slug/slides/upload", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const uploadURL = await objectStorageService.getSlideUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      logger.error({ err: error }, "Error getting upload URL");
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Create new slide after upload
  app.post("/api/sites/:slug/slides", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, "Error creating slide");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create slide" });
    }
  });

  // Update slide
  app.put("/api/sites/:slug/slides/:slideId", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const validatedData = insertSiteSlideSchema.partial().parse(req.body);

      // Normalize the image URL if it's being updated
      if (validatedData.imageUrl) {
        validatedData.imageUrl = objectStorageService.normalizeSlideObjectPath(validatedData.imageUrl);
      }

      const slide = await siteStorage.updateSiteSlide(req.params.slideId, validatedData);
      res.json(slide);
    } catch (error) {
      logger.error({ err: error }, "Error updating slide");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update slide" });
    }
  });

  // Delete slide
  app.delete("/api/sites/:slug/slides/:slideId", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      await siteStorage.deleteSiteSlide(req.params.slideId);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error deleting slide");
      res.status(500).json({ error: "Failed to delete slide" });
    }
  });

  // Reorder slides
  app.post("/api/sites/:slug/slides/reorder", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slideOrders } = req.body;

      if (!Array.isArray(slideOrders)) {
        return res.status(400).json({ error: "slideOrders must be an array" });
      }

      await siteStorage.reorderSiteSlides(req.params.slug, slideOrders);
      res.json({ success: true });
    } catch (error) {
      logger.error({ err: error }, "Error reordering slides");
      res.status(500).json({ error: "Failed to reorder slides" });
    }
  });

  // Serve static slide images directly from the filesystem
  app.use('/static', express.static(path.join(process.cwd(), 'client/public/static')));

  // Unified asset handler for all object storage content
  const handleAssetRequest = async (req: any, res: any, assetType: string) => {
    const objectPath = req.path.replace(`/${assetType}`, '');

    // Use human-friendly asset labels for logging and responses
    const assetLabel =
      assetType === 'slide-images'
        ? 'slide'
        : assetType === 'document-files'
          ? 'document'
          : 'asset';

    // Prevent multiple responses to the same request
    if (res.headersSent) {
      return;
    }

    try {
      logger.info(`Serving ${assetLabel} asset:`, {
        originalPath: req.path,
        objectPath,
        assetType: assetLabel
      });

      // Validate allowed paths
      const allowedPrefixes = [
        '/replit-objstore-',
        '/.private/',
        '/public/',
        '/documents/',
        '/legal/'
      ];
      const isAllowed = allowedPrefixes.some(prefix => objectPath.startsWith(prefix));
      
      if (!isAllowed) {
        logger.warn(`Rejected asset request - invalid path:`, { objectPath, assetType: assetLabel });
        return res.status(403).json({ error: 'Access denied' });
      }

      // Set appropriate headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      // Set CSP for images only
      if (assetType === 'slide-images') {
        res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: blob:;");
      }

      const file = await objectStorageService.getSlideFile(objectPath);

      // Check again before streaming
      if (res.headersSent) {
        return;
      }

      await objectStorageService.downloadObject(file, res);
      
      logger.info(`Successfully served ${assetLabel} asset:`, { objectPath });
    } catch (error: any) {
      logger.error(`Error serving ${assetLabel} asset:`, {
        error: error.message,
        stack: error.stack,
        objectPath,
        originalPath: req.path,
        assetType: assetLabel,
        errorType: error.constructor.name
      });

      // Only send response if headers haven't been sent
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: `${assetLabel} not found` });
        }
        res.status(500).json({ error: `Failed to serve ${assetLabel}` });
      }
    }
  };

  // Unified assets endpoint
  app.get('/assets/*', async (req, res) => {
    await handleAssetRequest(req, res, 'assets');
  });

  // Backward compatibility shims
  app.get('/slide-images/*', async (req, res) => {
    await handleAssetRequest(req, res, 'slide-images');
  });

  app.get('/document-files/*', async (req, res) => {
    await handleAssetRequest(req, res, 'document-files');
  });

  // ==== GLOBAL SLIDESROUTES ====

  // Get all global slides (public endpoint for presentation viewer)
  app.get("/api/global-slides", async (req, res) => {
    try {
      const globalSlides = await siteStorage.getGlobalSlides();
      res.json(globalSlides);
    } catch (error) {
      logger.error({ err: error }, "Error fetching global slides");
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
      logger.error({ err: error }, "Error fetching global slide");
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
      logger.error({ err: error }, "Error creating global slide");
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
      logger.error({ err: error }, "Error generating upload URL");
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
      logger.error({ err: error }, "Error updating global slide visibility");
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
      logger.error({ err: error }, "Error deleting global slide");
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
      logger.error({ err: error }, "Error reordering global slides");
      res.status(500).json({ error: "Failed to reorder global slides" });
    }
  });

  // Sections Management Endpoints

  // Get sections for a site
  app.get("/api/sites/:slug/sections", async (req, res) => {
    try {
      const { slug: siteId } = req.params;

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
      logger.error({ err: error }, "Error fetching sections");
      res.status(500).json({ error: "Failed to fetch sections" });
    }
  });

  // Create a new section
  app.post("/api/sites/:slug/sections", isAuthenticated, checkSiteAccess, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
      const { name, description, displayOrder } = req.body;
      const user = req.user as any;

      // Get the site to get permanent ID
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      // Access control is handled by checkSiteAccess middleware

      if (!name || !name.trim()) {
        return res.status(400).json({ error: "Section name is required" });
      }

      const sectionData: any = {
        siteId: site.id, // Use permanent ID
        name: name.trim(),
        description: description?.trim() || null,
        displayOrder: parseInt(displayOrder) || 1,
        isVisible: true
      };

      const newSection = await siteStorage.createSiteSection(sectionData);
      res.json(newSection);
    } catch (error) {
      logger.error({ err: error }, "Error creating section");
      res.status(500).json({ error: "Failed to create section" });
    }
  });

  // Update a section (note: uses sectionId not slug, so we need custom access check)
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

      // Get the site by slug to check access (section.siteId is actually a slug)
      const site = await siteStorage.getSite(section.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      // Check if user is global admin or site manager
      const isAdmin = user.role === 'admin' || user.isAdmin || false;
      const isSiteManager = await siteStorage.isSiteManager(site.slug, user.email);
      
      if (!isAdmin && !isSiteManager) {
        return res.status(403).json({ error: "Access denied to this site" });
      }

      const updatedSection = await siteStorage.updateSiteSection(sectionId, updates);
      res.json(updatedSection);
    } catch (error) {
      logger.error({ err: error }, "Error updating section");
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

      // Get the site by slug to check access (section.siteId is actually a slug)
      const site = await siteStorage.getSite(section.siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }

      // Check if user is global admin or site manager
      const isAdmin = user.role === 'admin' || user.isAdmin || false;
      const isSiteManager = await siteStorage.isSiteManager(site.slug, user.email);
      
      if (!isAdmin && !isSiteManager) {
        return res.status(403).json({ error: "Access denied to this site" });
      }

      await siteStorage.deleteSiteSection(sectionId);
      res.json({ success: true, message: "Section deleted successfully" });
    } catch (error) {
      logger.error({ err: error }, "Error deleting section");
      res.status(500).json({ error: "Failed to delete section" });
    }
  });

  // Serve presentation assets from attached_assets folder via static express middleware
  app.use('/api/assets', express.static('attached_assets', {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      const ext = filePath.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') res.setHeader('Content-Type', 'image/jpeg');
      else if (ext === 'png') res.setHeader('Content-Type', 'image/png');
      else if (ext === 'gif') res.setHeader('Content-Type', 'image/gif');
      else if (ext === 'svg') res.setHeader('Content-Type', 'image/svg+xml');
    }
  }));


  // Site membership management routes (admin only)
  app.get("/api/sites/:slug/memberships", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
      const memberships = await siteStorage.getSiteMemberships(siteId);
      res.json(memberships);
    } catch (error) {
      logger.error({ err: error }, "Error fetching site memberships");
      res.status(500).json({ error: "Failed to fetch site memberships" });
    }
  });

  app.post("/api/sites/:slug/memberships", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, "Error creating site membership");
      res.status(500).json({ error: "Failed to create site membership" });
    }
  });

  app.put("/api/sites/:slug/memberships/:userId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slug: siteId, userId } = req.params;
      const updates = req.body;

      const membership = await siteStorage.updateSiteMembership(siteId, userId, updates);

      if (!membership) {
        return res.status(404).json({ error: "Membership not found" });
      }

      res.json(membership);
    } catch (error) {
      logger.error({ err: error }, "Error updating site membership");
      res.status(500).json({ error: "Failed to update site membership" });
    }
  });

  app.delete("/api/sites/:slug/memberships/:userId", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { slug: siteId, userId } = req.params;

      const deleted = await siteStorage.deleteSiteMembership(siteId, userId);

      if (!deleted) {
        return res.status(404).json({ error: "Membership not found" });
      }

      res.json({ success: true, message: "Membership deleted successfully" });
    } catch (error) {
      logger.error({ err: error }, "Error deleting site membership");
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
      logger.error({ err: error }, "Error fetching user memberships");
      res.status(500).json({ error: "Failed to fetch user memberships" });
    }
  });

  // Member-facing endpoints (non-admin access)

  // Get membership status for current user
  app.get('/api/sites/:slug/membership', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error checking membership');
      res.status(500).json({ error: 'Failed to check membership' });
    }
  });

  // Get site members list (for members only)
  app.get('/api/sites/:slug/members', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error getting members');
      res.status(500).json({ error: 'Failed to get members' });
    }
  });

  // Join collective endpoint
  app.post('/api/sites/:slug/join', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error joining collective');
      res.status(500).json({ error: 'Failed to join collective' });
    }
  });

  // Get user's tasks for a site
  app.get('/api/sites/:slug/tasks/user', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error getting user tasks');
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  });

  // Get all tasks for a collective (only for site managers and admins)
  app.get('/api/sites/:slug/tasks', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error getting collective tasks');
      res.status(500).json({ error: 'Failed to get tasks' });
    }
  });

  // Create a new task (only for site managers and admins)
  app.post('/api/sites/:slug/tasks', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error creating task');
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
      logger.error({ err: error }, 'Error getting assignment target users');
      return [];
    }
  }

  // Update a task (only for site managers and admins)
  app.put('/api/sites/:slug/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, taskId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error updating task');
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Delete a task (only for site managers and admins)
  app.delete('/api/sites/:slug/tasks/:taskId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, taskId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error deleting task');
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Assign a task to a user (only for site managers and admins)
  app.post('/api/sites/:slug/tasks/:taskId/assign', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, taskId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error assigning task');
      res.status(500).json({ error: 'Failed to assign task' });
    }
  });

  // Unassign a task from a user (only for site managers and admins)
  app.delete('/api/sites/:slug/tasks/:taskId/assign/:assigneeUserId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, taskId, assigneeUserId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error unassigning task');
      res.status(500).json({ error: 'Failed to unassign task' });
    }
  });

  // Get task assignments (only for site managers and admins)
  app.get('/api/sites/:slug/tasks/:taskId/assignments', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, taskId } = req.params;
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
      const userRole = await checkSiteAccess(siteId, userId, (req.user as any)?.isAdmin);
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
      logger.error({ err: error }, 'Error getting task assignments');
      res.status(500).json({ error: 'Failed to get task assignments' });
    }
  });

  // Get messages for a collective
  app.get('/api/sites/:slug/messages', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error getting messages');
      res.status(500).json({ error: 'Failed to get messages' });
    }
  });

  // Send a message to a collective
  app.post('/api/sites/:slug/messages', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error sending message');
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // ===== BLOG POSTS ENDPOINTS =====

  // Get blog posts for a collective
  app.get('/api/sites/:slug/blog-posts', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error getting blog posts');
      res.status(500).json({ error: 'Failed to get blog posts' });
    }
  });

  // Get a single blog post by ID
  app.get('/api/sites/:slug/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, postId } = req.params;
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
      logger.error({ err: error }, 'Error getting blog post');
      res.status(500).json({ error: 'Failed to get blog post' });
    }
  });

  // Create a new blog post (Brehons and Site Managers only)
  app.post('/api/sites/:slug/blog-posts', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId } = req.params;
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
      logger.error({ err: error }, 'Error creating blog post');
      if (error.message?.includes('duplicate key')) {
        return res.status(409).json({ error: 'A post with this title already exists for this site' });
      }
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  // Update a blog post (Brehons and Site Managers only)
  app.put('/api/sites/:slug/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, postId } = req.params;
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
      logger.error({ err: error }, 'Error updating blog post');
      if (error.message?.includes('duplicate key')) {
        return res.status(409).json({ error: 'A post with this title already exists for this site' });
      }
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  // Publish/unpublish a blog post (Brehons and Site Managers only)
  app.patch('/api/sites/:slug/blog-posts/:postId/status', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, postId } = req.params;
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
      logger.error({ err: error }, 'Error updating blog post status');
      res.status(500).json({ error: 'Failed to update blog post status' });
    }
  });

  // Delete a blog post (Author, Brehons, and Site Managers)
  app.delete('/api/sites/:slug/blog-posts/:postId', isAuthenticated, async (req, res) => {
    try {
      const { slug: siteId, postId } = req.params;
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
      logger.error({ err: error }, 'Error deleting blog post');
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  logger.info("Site management routes registered");
}