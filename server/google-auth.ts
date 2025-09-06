import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate environment variables
function validateGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is required");
  }
  
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET environment variable is required");
  }
  
  // OAuth config validated successfully
  
  return { clientId, clientSecret };
}

// Extend session types to include redirectPath
declare module "express-session" {
  interface SessionData {
    redirectPath?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "mining-syndicate-dev-secret-2025-very-secure-random-string-32chars-minimum",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development to ensure cookies work over HTTP/HTTPS proxies
      maxAge: sessionTtl,
      sameSite: 'lax', // Allow cross-site requests for OAuth callbacks
      path: '/', // Ensure cookie is available on all paths
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Validate Google OAuth configuration
  const { clientId, clientSecret } = validateGoogleOAuthConfig();
  
  // Google OAuth Strategy - Use environment variable or build from host
  const callbackURL = process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/api/auth/google/callback`;
  // Google OAuth configured with callback URL
  
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Google OAuth profile received

          const email = profile.emails?.[0]?.value;
          if (!email) {
            console.error('No email found in Google profile');
            return done(new Error('No email found in Google profile'), false);
          }

          // Allow generic users to sign up without access restrictions
          // Admin and site_manager users still need to be in access list
          const hasAccess = await storage.checkUserAccess(email);
          
          // Always allow generic user creation, restrict admin/site_manager access
          if (!hasAccess) {
            // Generic users are always allowed, but with limited permissions
          }

          // Extract user data from Google profile
          const userData = {
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || email.split("@")[0],
            lastName: profile.name?.familyName || "",
            googleId: profile.id,
            profilePicture: profile.photos?.[0]?.value,
          };

          console.log('Upserting user:', userData.email);
          const user = await storage.upsertUser(userData);
          
          console.log('User authenticated successfully:', user.email);
          return done(null, user);
        } catch (error) {
          console.error('Error in Google OAuth strategy:', error);
          return done(error, false);
        }
      }
    )
  );

  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      console.log('Deserializing user:', user);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, false);
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    console.log('Initiating Google OAuth...');
    // Store redirect path in session if provided
    if (req.query.redirect) {
      req.session.redirectPath = req.query.redirect as string;
      console.log('Stored redirect path:', req.session.redirectPath);
    }
    
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      prompt: 'select_account' // Always show account picker
    })(req, res, next);
  });

  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: '/login?error=access_denied' 
    }),
    (req, res) => {
      console.log('Google OAuth callback successful');
      // Get redirect path from session or default to /sites
      const redirectPath = req.session.redirectPath || '/sites';
      delete req.session.redirectPath; // Clean up
      
      console.log('Redirecting user to:', redirectPath);
      res.redirect(redirectPath);
    }
  );

  // User info endpoint
  app.get('/api/auth/user', (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Logout endpoint  
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ error: 'Session cleanup failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  console.log('Google OAuth setup complete');
}

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};