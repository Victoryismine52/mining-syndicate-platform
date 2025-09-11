import type { Request, Response, NextFunction } from "express";
import { siteStorage } from "./site-storage";
import { logger } from './logger';

// Extend the Request interface to include siteAccess
declare global {
  namespace Express {
    interface Request {
      siteAccess?: {
        canManage: boolean;
        isAdmin: boolean;
        isSiteManager: boolean;
      };
    }
  }
}

/**
 * Middleware to check if user has access to manage a specific site
 * Requires authentication middleware to run first
 */
export const checkSiteAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug; // Changed from siteId to slug
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!slug) { // Changed from siteId to slug
      return res.status(400).json({ error: "Site slug required" }); // Changed error message
    }

    // Check if user is global admin (check both new role field and legacy isAdmin)
    const isAdmin = user.role === 'admin' || user.isAdmin || false;

    logger.info(`Site access check for ${slug}: user=${user.email}, isAdmin=${isAdmin}`); // Changed from siteId to slug

    // Global admins have access to all sites, no need to check site manager status
    if (isAdmin) {
      logger.info(`Global admin ${user.email} granted access to site ${slug}`); // Changed from siteId to slug
      // Add access info to request object
      req.siteAccess = {
        canManage: true,
        isAdmin: true,
        isSiteManager: false,
      };
      return next();
    }

    // Check if user is a site manager for this specific site
    const isSiteManager = await siteStorage.isSiteManager(slug, user.email); // Changed from siteId to slug

    logger.info(`Site manager check for ${slug}: user=${user.email}, isSiteManager=${isSiteManager}`); // Changed from siteId to slug

    if (isSiteManager) {
      logger.info(`Site manager ${user.email} granted access to site ${slug}`); // Changed from siteId to slug
      // Add access info to request object
      req.siteAccess = {
        canManage: true,
        isAdmin: false,
        isSiteManager: true,
      };
      return next();
    }

    // User has no access to this site
    logger.warn(`Access denied for user ${user.email} to site ${slug}`); // Changed from siteId to slug
    return res.status(403).json({ error: "Access denied to this site" });
  } catch (error) {
    logger.error({ err: error }, "Error checking site access");
    return res.status(500).json({ error: "Failed to check site access" });
  }
};

/**
 * Middleware for admin-only operations (like managing site managers)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;

  // Check both the new role field and legacy isAdmin for backward compatibility
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ 
      error: "Admin access required" 
    });
  }

  next();
};