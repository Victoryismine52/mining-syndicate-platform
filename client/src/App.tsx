import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import { SiteAdminRoute } from "@/lib/site-admin-route";
import { MemberRoute } from "@/lib/member-route";
import NotFound from "@/pages/not-found";
import { Landing } from "@/pages/landing";
import { PasswordGate } from "@/components/password-gate";
import { DynamicSite } from "@/pages/dynamic-site";
import { SiteManager } from "@/pages/site-manager";
import { SiteAdmin } from "@/pages/site-admin";
import { Login } from "@/pages/login";
import { ApprovalNeeded } from "@/pages/approval-needed";
import { AdminDashboard } from "@/pages/admin-dashboard";
import { SiteDirectory } from "@/pages/site-directory";
import { LegalDisclaimers } from "@/pages/legal-disclaimers";
import { DisclaimerPage } from "@/pages/disclaimer-page";
import { SiteDisclaimers } from "@/pages/site-disclaimers";
import { SiteDisclaimerRedirect } from "@/pages/site-disclaimer-redirect";
import { CollectiveHome } from "@/pages/collective-home";
import BlogPostView from "@/pages/blog-post-view";
import BuilderLab from "@/pages/BuilderLab";

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/login" component={Login} />
      <Route path="/approval-needed" component={ApprovalNeeded} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/sites" component={SiteManager} />
      <AdminRoute path="/disclaimers" component={LegalDisclaimers} />
      <Route path="/site/:siteId/admin">
        {(params) => (
          <SiteAdminRoute 
            path={`/site/${params.siteId}/admin`} 
            component={(props: any) => <SiteAdmin {...props} siteId={params.siteId} />}
            siteId={params.siteId}
          />
        )}
      </Route>
      <Route path="/sites/:siteId/admin">
        {(params) => (
          <SiteAdminRoute 
            path={`/sites/${params.siteId}/admin`} 
            component={(props: any) => <SiteAdmin {...props} siteId={params.siteId} />}
            siteId={params.siteId}
          />
        )}
      </Route>
      
      {/* Public site routes */}
      <Route path="/site/:siteId" component={DynamicSite} />
      <Route path="/site/:siteId/disclaimer" component={SiteDisclaimers} />
      <Route path="/site/:siteId/disclaimer/:disclaimerId" component={SiteDisclaimerRedirect} />
      
      {/* Member-only routes for collectives */}
      <Route path="/site/:siteId/home">
        {(params) => (
          <MemberRoute 
            siteId={params.siteId}
            component={(props: any) => <CollectiveHome {...props} siteId={params.siteId} />}
          />
        )}
      </Route>
      
      {/* Blog post view route */}
      <Route path="/site/:siteId/blog/:postId" component={BlogPostView} />
      <Route path="/disclaimer/:disclaimerId" component={DisclaimerPage} />
      
      {/* Builder Lab route */}
      <Route path="/builder" component={BuilderLab} />
      
      {/* Site directory as homepage - public */}
      <Route path="/" component={SiteDirectory} />
      
      {/* Redirect bare site IDs to proper /site/:siteId format */}
      <Route path="/:siteId">
        {(params) => {
          // Redirect to proper site URL format
          window.location.replace(`/site/${params.siteId}`);
          return null;
        }}
      </Route>
      
      {/* Protected routes - redirect to login if not authenticated */}
      <ProtectedRoute path="/landing" component={Landing} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
