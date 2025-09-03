import type { Request, Response, NextFunction } from "express";
import { siteStorage } from "./site-storage";

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
    const siteId = req.params.siteId;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!siteId) {
      return res.status(400).json({ error: "Site ID required" });
    }

    // Check if user is global admin (check both new role field and legacy isAdmin)
    const isAdmin = user.role === 'admin' || user.isAdmin || false;
    
    console.log(`Site access check for ${siteId}: user=${user.email}, isAdmin=${isAdmin}`);

    // Global admins have access to all sites, no need to check site manager status
    if (isAdmin) {
      console.log(`Global admin ${user.email} granted access to site ${siteId}`);
      // Add access info to request object
      req.siteAccess = {
        canManage: true,
        isAdmin: true,
        isSiteManager: false,
      };
      return next();
    }

    // Check if user is site manager for this specific site (only for non-admins)
    const isSiteManager = await siteStorage.isSiteManager(siteId, user.email);
    console.log(`Site manager check for ${siteId}: user=${user.email}, isSiteManager=${isSiteManager}`);

    // User has access if they are site manager
    const canManage = isSiteManager;

    // Add access info to request object
    req.siteAccess = {
      canManage,
      isAdmin,
      isSiteManager,
    };

    if (!canManage) {
      return res.status(403).json({ 
        error: "Access denied. You must be an admin or site manager for this site." 
      });
    }

    next();
  } catch (error) {
    console.error("Error checking site access:", error);
    res.status(500).json({ error: "Failed to check site access" });
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