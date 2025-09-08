import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { siteStorage } from "./site-storage";
import { setupAuth, isAuthenticated } from "./google-auth";
import { requireAdmin } from "./site-access-control";
import { insertLeadSchema } from "@shared/schema";
import { insertSiteLeadSchema } from "@shared/site-schema";
import { createHubSpotContact, submitToHubSpotForm, testHubSpotConnection, type HubSpotContact } from "./hubspot";
import { registerSiteRoutes } from "./site-routes";
import { functionIndex } from "./function-index";
import { db } from "./db";
import { sql } from "drizzle-orm";
// import rateLimit from "express-rate-limit"; // TODO: Fix missing package issue
import { logger } from './logger';
import { config } from './config';

export async function registerRoutes(app: Express): Promise<Server> {
  logger.info('Registering routes...');
  
  // Setup Google authentication (includes session middleware)
  await setupAuth(app);
  logger.info('Google authentication setup complete');
  
  // Test HubSpot connection if API key is available
  if (config.hubspotApiKey) {
    logger.info('Testing HubSpot API connection...');
    const hubspotConnected = await testHubSpotConnection();
    if (hubspotConnected) {
      logger.info('HubSpot integration: Connected successfully');
    } else {
      logger.info('HubSpot integration: Failed - leads will still be saved locally');
      logger.info('Please check your HubSpot API key and permissions');
    }
  } else {
    logger.info('HubSpot API key not found - lead sync disabled');
  }

  // Basic health check endpoint to verify DB connectivity
  app.get("/api/health", async (_req, res) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ ok: false });
    }
  });

  // Lead generation endpoint (for main site)
  // TODO: Re-enable rate limiting when package issue is fixed
  // const leadsLimiter = rateLimit({
  //   windowMs: 60 * 1000,
  //   max: 2,
  //   standardHeaders: true,
  //   legacyHeaders: false,
  // });

  app.post("/api/leads", /* leadsLimiter, */ async (req, res, next) => {
    try {
      // Extract email as identifier and store dynamic form data
      const { email, siteId = 'main-site', ...formData } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required as identifier" });
      }

      // Prepare site lead data with identifier-based aggregation
      const leadData = insertSiteLeadSchema.parse({
        email,
        identifier: email, // Use email as primary identifier for aggregation
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        message: formData.message,
        formType: formData.formType || 'contact',
        formData: formData, // Store all dynamic form data
        siteId
      });
      
      // Create lead in site_leads table with identifier-based aggregation
      const lead = await siteStorage.createSiteLead(leadData);
      
      // Send to HubSpot forms asynchronously (don't block the response)
      if (config.hubspotApiKey) {
        setImmediate(async () => {
          try {
            const hubspotContact: HubSpotContact = {
              email: lead.email || '',
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              phone: lead.phone || '',
              leadSource: `Main Site - ${lead.formType || 'Contact Form'}`,
              interests: lead.interests || [],
              formType: lead.formType || 'learn-more'
            };
            
            // Submit to HubSpot forms instead of creating contacts directly
            await submitToHubSpotForm(hubspotContact.formType || 'learn-more', hubspotContact);
            logger.info(`Lead ${lead.email} successfully submitted to HubSpot form: ${lead.formType}`);
          } catch (hubspotError) {
            logger.error('Failed to submit lead to HubSpot form:', hubspotError);
            // Don't fail the request if HubSpot integration fails
          }
        });
      }
      
      res.status(201).json(lead);
    } catch (error) {
      next(error);
    }
  });

  // Authentication middleware
  const requireAuth = isAuthenticated;

  // Use the existing requireAdmin from site-access-control instead of local one

  // User info endpoint
  app.get('/api/user', (req: any, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Access management endpoints (admin only)
  app.get('/api/access-requests', requireAdmin, async (req: any, res, next) => {
    try {
      const requests = await storage.getAccessRequests();
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/access-requests/:id', requireAdmin, async (req: any, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const request = await storage.updateAccessRequest(id, status, req.user.email || 'admin');
      res.json(request);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/access-list', requireAdmin, async (req: any, res, next) => {
    try {
      const accessList = await storage.getAccessList();
      res.json(accessList);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/access-list', requireAdmin, async (req: any, res, next) => {
    try {
      const { email } = req.body;
      const entry = await storage.addToAccessList(email, req.user.id);
      res.json(entry);
    } catch (error) {
      next(error);
    }
  });

  // Leads endpoint (protected for admin viewing)
  app.get("/api/leads", requireAuth, async (req: any, res, next) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  // Get all site leads across all sites (admin only)
  app.get("/api/all-site-leads", requireAdmin, async (req: any, res, next) => {
    try {
      const leads = await storage.getAllSiteLeads();
      res.json(leads);
    } catch (error) {
      next(error);
    }
  });

  // Slide settings endpoints (admin only) 
  app.get("/api/slide-settings", requireAdmin, async (req: any, res, next) => {
    try {
      const settings = await storage.getSlideSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/slide-settings/:slideIndex", requireAdmin, async (req: any, res, next) => {
    try {
      const { slideIndex } = req.params;
      const { isVisible } = req.body;
      const setting = await storage.updateSlideSetting(slideIndex, isVisible);
      res.json(setting);
    } catch (error) {
      next(error);
    }
  });

  // Get visible slides for public viewing
  app.get("/api/visible-slides", async (req, res, next) => {
    try {
      const settings = await storage.getSlideSettings();
      const visibleSlides = settings.filter(s => s.isVisible).map(s => s.slideIndex);
      res.json(visibleSlides);
    } catch (error) {
      next(error);
    }
  });

  // Get all users endpoint (admin only) - for site manager assignment
  app.get("/api/users", isAuthenticated, requireAdmin, async (req: any, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      logger.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create new admin user directly  
  app.post('/api/users/admin', requireAuth, requireAdmin, async (req: any, res, next) => {
    try {
      logger.info('Admin creation endpoint hit with:', req.body);
      logger.info('User authenticated:', req.isAuthenticated());
      logger.info('User details:', req.user);
      
      const { email, firstName, lastName } = req.body;
      if (!email || !firstName || !lastName) {
        logger.info('Missing required fields');
        return res.status(400).json({ error: 'Email, first name, and last name are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        logger.info('User already exists:', email);
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      logger.info('Creating new admin user:', { email, firstName, lastName });
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        role: 'admin',
        isAdmin: true
      });
      
      logger.info('Admin user created successfully:', newUser.email);
      res.json(newUser);
    } catch (error) {
      logger.error("Error creating admin user:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  // Form Template management routes
  app.get("/api/form-templates", requireAuth, async (req, res, next) => {
    try {
      const templates = await storage.getFormTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/form-templates/:id", requireAuth, async (req, res, next) => {
    try {
      const template = await storage.getFormTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Form template not found" });
      }
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/form-templates", requireAuth, async (req, res, next) => {
    try {
      const template = await storage.createFormTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/form-templates/:id", requireAuth, async (req, res, next) => {
    try {
      const template = await storage.updateFormTemplate(req.params.id, req.body);
      res.json(template);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/form-templates/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteFormTemplate(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Landing Page Template routes
  app.get("/api/landing-page-templates", requireAuth, async (req, res, next) => {
    try {
      const templates = await storage.getLandingPageTemplates();
      res.json(templates);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/landing-page-templates", requireAuth, async (req, res, next) => {
    try {
      const template = await storage.createLandingPageTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  });

  // Site Form Assignment routes
  app.get("/api/sites/:siteId/form-assignments", async (req, res, next) => {
    try {
      const { siteId } = req.params;
      
      // Check if site is launched (for public access) or requires authentication
      const site = await siteStorage.getSite(siteId);
      if (!site) {
        return res.status(404).json({ error: "Site not found" });
      }
      
      // If site is launched, allow public access
      if (site.isLaunched) {
        const assignments = await storage.getSiteFormAssignments(siteId);
        return res.json(assignments);
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
      
      const assignments = await storage.getSiteFormAssignments(siteId);
      res.json(assignments);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sites/:siteId/form-assignments", requireAuth, async (req, res, next) => {
    try {
      const assignment = await storage.assignFormToSite({
        ...req.body,
        siteId: req.params.siteId
      });
      res.status(201).json(assignment);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/site-form-assignments/:id", requireAuth, async (req, res, next) => {
    try {
      logger.info(`Updating site form assignment ${req.params.id} with data:`, req.body);

      // Look up the existing assignment with its template
      const existingAssignment = await storage.getSiteFormAssignmentById(req.params.id);

      if (!existingAssignment) {
        logger.info(`Form assignment ${req.params.id} not found`);
        return res.status(404).json({ error: "Form assignment not found" });
      }

      logger.info(`Found existing assignment:`, existingAssignment);

      // Prevent deactivating Join Cards on collective sites
      if (req.body.isActive === false &&
          existingAssignment.formTemplate?.cardType === 'join-card') {

        // Get the site to check if it's a collective
        const site = await siteStorage.getSite(existingAssignment.siteId);
        if (site?.siteType === 'collective') {
          return res.status(400).json({
            error: "Join Cards cannot be deactivated on collective sites as they are required for members to join the collective." 
          });
        }
      }

      const assignment = await storage.updateSiteFormAssignment(req.params.id, req.body);
      logger.info(`Updated assignment:`, assignment);
      res.json(assignment);
    } catch (error) {
      logger.error('Error updating site form assignment:', error);
      next(error);
    }
  });

  app.delete("/api/site-form-assignments/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.removeFormFromSite(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Site Landing Config routes
  app.get("/api/sites/:siteId/landing-config", requireAuth, async (req, res, next) => {
    try {
      const config = await storage.getSiteLandingConfig(req.params.siteId);
      res.json(config);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sites/:siteId/landing-config", requireAuth, async (req, res, next) => {
    try {
      const config = await storage.createSiteLandingConfig({
        ...req.body,
        siteId: req.params.siteId
      });
      res.status(201).json(config);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/sites/:siteId/landing-config", requireAuth, async (req, res, next) => {
    try {
      const config = await storage.updateSiteLandingConfig(req.params.siteId, req.body);
      res.json(config);
    } catch (error) {
      next(error);
    }
  });

  // Field Library routes
  app.get("/api/field-library", requireAuth, async (req, res, next) => {
    try {
      const fields = await storage.getFieldLibrary();
      res.json(fields);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/field-library/:id", requireAuth, async (req, res, next) => {
    try {
      const field = await storage.getFieldLibraryItem(req.params.id);
      if (!field) {
        return res.status(404).json({ error: "Field not found" });
      }
      res.json(field);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/field-library", requireAuth, async (req, res, next) => {
    try {
      const field = await storage.createFieldLibraryItem(req.body);
      res.status(201).json(field);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/field-library/:id", requireAuth, async (req, res, next) => {
    try {
      const field = await storage.updateFieldLibraryItem(req.params.id, req.body);
      res.json(field);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/field-library/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteFieldLibraryItem(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Form Template Fields routes
  app.get("/api/form-templates/:formTemplateId/fields", async (req, res, next) => {
    try {
      const fields = await storage.getFormTemplateFields(req.params.formTemplateId);

      // Sanitize response to expose only public field data
      const sanitizedFields = fields.map(field => ({
        id: field.id,
        formTemplateId: field.formTemplateId,
        fieldLibraryId: field.fieldLibraryId,
        isRequired: field.isRequired,
        order: field.order,
        customValidation: field.customValidation,
        customLabel: field.customLabel,
        placeholder: field.placeholder,
        fieldLibrary: {
          id: field.fieldLibrary.id,
          name: field.fieldLibrary.name,
          label: field.fieldLibrary.label,
          dataType: field.fieldLibrary.dataType,
          defaultPlaceholder: field.fieldLibrary.defaultPlaceholder,
          defaultValidation: field.fieldLibrary.defaultValidation,
          translations: field.fieldLibrary.translations,
        }
      }));

      res.json(sanitizedFields);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/form-templates/:formTemplateId/fields", requireAuth, async (req, res, next) => {
    try {
      const field = await storage.createFormTemplateField({
        ...req.body,
        formTemplateId: req.params.formTemplateId
      });
      res.status(201).json(field);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/form-template-fields/:id", requireAuth, async (req, res, next) => {
    try {
      const field = await storage.updateFormTemplateField(req.params.id, req.body);
      res.json(field);
    } catch (error) {
      next(error);
    }
  });

  // Batch update field orders for a form template
  app.put("/api/form-templates/:formTemplateId/fields/order", requireAuth, async (req, res, next) => {
    try {
      const { fieldUpdates } = req.body; // Array of { id, order }
      await storage.batchUpdateFieldOrders(req.params.formTemplateId, fieldUpdates);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/form-template-fields/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteFormTemplateField(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/functions", (_req, res) => {
    res.json(functionIndex);
  });

  // Register multi-site routes
  registerSiteRoutes(app, storage);
  logger.info('Site management routes registered');

  const httpServer = createServer(app);
  return httpServer;
}
