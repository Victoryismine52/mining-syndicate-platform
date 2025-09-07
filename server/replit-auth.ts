import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Set default for development - will be overridden in production
if (!process.env.REPLIT_DOMAINS) {
  process.env.REPLIT_DOMAINS = process.env.REPLIT_DEV_DOMAIN || "conduit.replit.app";
}

// REPLIT_DOMAINS configured

const getOidcConfig = memoize(
  async () => {
    try {
      const config = await client.discovery(
        new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
        process.env.REPL_ID!
      );
      return config;
    } catch (error) {
      console.error('Failed to load OIDC config:', error);
      throw error;
    }
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString:
      process.env.NODE_ENV === "test"
        ? process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL
        : process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  const email = claims["email"];
  console.log('Checking access for user:', email);
  
  // Check if user is in the access list
  const hasAccess = await storage.checkUserAccess(email);
  if (!hasAccess) {
    console.log('Access denied for user:', email);
    throw new Error('Access denied. Please contact an administrator for access.');
  }
  
  // Extract first and last name from claims
  const firstName = claims["first_name"] || email.split("@")[0];
  const lastName = claims["last_name"] || "";
  
  const user = await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: firstName,
    lastName: lastName,
    googleId: claims["sub"], // Use sub as googleId for Replit auth
    profilePicture: claims["profile_image_url"],
  });
  
  return user;
}

export async function setupReplitAuth(app: Express) {
  console.log('Setting up Replit authentication...');
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();
  console.log('OIDC config retrieved, setting up strategies...');

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    try {
      const claims = tokens.claims();
      if (!claims) {
        throw new Error('No claims found in tokens');
      }
      
      console.log('OAuth verify called with claims:', claims);
      
      const userSession = {
        id: claims.sub,
        claims: claims
      };
      updateUserSession(userSession, tokens);
      
      const user = await upsertUser(claims);
      console.log('User upserted:', user.email);
      
      verified(null, userSession as any);
    } catch (error) {
      console.error('Authentication error:', error);
      verified(error, false);
    }
  };

  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategyName = `replitauth:${domain}`;
    const callbackURL = `https://${domain}/api/callback`;
    console.log(`Setting up strategy: ${strategyName} with callback: ${callbackURL}`);
    
    const strategy = new Strategy(
      {
        name: strategyName,
        config,
        scope: "openid email profile offline_access",
        callbackURL,
      },
      verify,
    );
    passport.use(strategy);
    console.log(`Strategy ${strategyName} registered successfully`);
  }
  
  console.log('All authentication strategies registered');

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    // Use the correct strategy name that matches the hostname
    const hostname = req.get('host') || req.hostname;
    console.log(`Login request for hostname: ${hostname}`);
    
    // Find the matching strategy for this specific hostname
    const strategyName = `replitauth:${hostname}`;
    console.log(`Using auth strategy: ${strategyName}`);
    console.log('Available strategies:', Object.keys((passport as any)._strategies || {}));
    
    // Check if the strategy exists
    if (!(passport as any)._strategies[strategyName]) {
      console.error(`Strategy ${strategyName} not found!`);
      return res.status(500).json({ error: 'Authentication strategy not found' });
    }
    
    console.log('Initiating authentication with strategy:', strategyName);
    passport.authenticate(strategyName, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    // Use the correct strategy name that matches the hostname
    const hostname = req.get('host') || req.hostname;
    const strategyName = `replitauth:${hostname}`;
    console.log(`Auth callback received - strategy: ${strategyName}, hostname: ${hostname}`);
    console.log('Callback query params:', req.query);
    
    passport.authenticate(strategyName, (err: any, user: any, info: any) => {
      if (err) {
        console.error('Auth callback error:', err);
        return res.redirect("/auth?error=auth_error");
      }
      
      if (!user) {
        console.log('Auth callback failed - no user:', info);
        return res.redirect("/auth?error=access_denied");
      }
      
      console.log('Auth callback success - logging in user');
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Login error during callback:', loginErr);
          return res.redirect("/auth?error=login_error");
        }
        
        console.log('User successfully logged in via callback, redirecting to /dev');
        return res.redirect("/dev");
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });

  // Get current user
  app.get("/api/user", isAuthenticated, async (req: any, res) => {
    try {
      console.log('API user called, req.user:', req.user);
      console.log('req.isAuthenticated():', req.isAuthenticated());
      
      const userId = req.user?.claims?.sub || req.user?.id;
      console.log('Looking up user with ID:', userId);
      
      if (!userId) {
        console.log('No user ID found in session');
        return res.status(401).json({ message: "No user ID in session" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Found user:', user?.email);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Access request endpoint (for users not in access list)
  app.post("/api/access-request", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      // Check if request already exists
      const existingRequest = await storage.getAccessRequests();
      const alreadyRequested = existingRequest.find(r => r.email === email && r.status === "pending");
      
      if (alreadyRequested) {
        return res.status(409).json({ error: "Access request already pending" });
      }

      const request = await storage.createAccessRequest({ email });
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  });

  // Admin-only access request management
  app.get("/api/access-requests", isAuthenticated, async (req: any, res, next) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.sendStatus(401);
      }
      const requests = await storage.getAccessRequests();
      res.json(requests);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/access-requests/:id", isAuthenticated, async (req: any, res, next) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.sendStatus(401);
      }
      
      const { id } = req.params;
      const { status } = req.body;
      
      if (!["approved", "denied"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateAccessRequest(id, status, user.id);
      
      // If approved, add user to access list
      if (status === 'approved') {
        const request = await storage.getAccessRequests();
        const approvedRequest = request.find(r => r.id === id);
        if (approvedRequest) {
          await storage.addToAccessList(approvedRequest.email, user.id);
        }
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Access list management endpoints
  app.get("/api/access-list", isAuthenticated, async (req: any, res, next) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.sendStatus(401);
      }
      const accessList = await storage.getAccessList();
      res.json(accessList);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/access-list", isAuthenticated, async (req: any, res, next) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.sendStatus(401);
      }
      
      const { email } = req.body;
      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      await storage.addToAccessList(email, user.id);
      const accessList = await storage.getAccessList();
      res.json(accessList);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/access-list/:email", isAuthenticated, async (req: any, res, next) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.sendStatus(401);
      }
      
      const { email } = req.params;
      await storage.removeFromAccessList(email);
      const accessList = await storage.getAccessList();
      res.json(accessList);
    } catch (error) {
      next(error);
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('isAuthenticated middleware called');
  console.log('req.isAuthenticated():', req.isAuthenticated());
  console.log('req.user:', req.user);

  if (!req.isAuthenticated()) {
    console.log('Request not authenticated');
    return res.status(401).json({ message: "Unauthorized - not authenticated" });
  }

  const user = req.user as any;
  if (!user) {
    console.log('No user in session');
    return res.status(401).json({ message: "Unauthorized - no user" });
  }

  // If no expires_at, just continue (might be a fresh session)
  if (!user.expires_at) {
    console.log('No expiration time, allowing access');
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    console.log('Token still valid');
    return next();
  }

  console.log('Token expired, attempting refresh');
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('No refresh token available');
    res.status(401).json({ message: "Unauthorized - token expired" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('Token refreshed successfully');
    return next();
  } catch (error) {
    console.log('Token refresh failed:', error);
    res.status(401).json({ message: "Unauthorized - refresh failed" });
    return;
  }
};