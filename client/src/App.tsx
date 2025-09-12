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
import { CardBuilderApp } from "../../packages/card-builder";
import { CodeExplorerApp } from "../../packages/code-explorer";
import FunctionSearchPage from "@/pages/function-search";
import { MySites } from "@/pages/my-sites";

function Router() {
  return (
    <Switch>
      {/* Admin routes */}
      <Route path="/login" component={Login} />
      <Route path="/approval-needed" component={ApprovalNeeded} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/sites" component={SiteManager} />
      <AdminRoute path="/disclaimers" component={LegalDisclaimers} />
      
      {/* Site manager routes */}
      <ProtectedRoute path="/my-sites" component={MySites} />
      <Route path="/site/:slug/admin">
        {(params) => (
          <SiteAdminRoute
            path={`/site/${params.slug}/admin`}
            component={(props: any) => <SiteAdmin {...props} siteId={params.slug} />}
            siteId={params.slug}
          />
        )}
      </Route>
      <Route path="/sites/:slug/admin">
        {(params) => (
          <SiteAdminRoute
            path={`/sites/${params.slug}/admin`}
            component={(props: any) => <SiteAdmin {...props} siteId={params.slug} />}
            siteId={params.slug}
          />
        )}
      </Route>
      
      {/* Public site routes */}
      <Route path="/site/:slug" component={DynamicSite} />
      <Route path="/site/:slug/disclaimer" component={SiteDisclaimers} />
      <Route path="/site/:slug/disclaimer/:disclaimerId" component={SiteDisclaimerRedirect} />
      
      {/* Member-only routes for collectives */}
      <Route path="/site/:slug/home">
        {(params) => (
          <MemberRoute
            siteId={params.slug}
            component={(props: any) => <CollectiveHome {...props} siteId={params.slug} />}
          />
        )}
      </Route>
      
      {/* Blog post view route */}
      <Route path="/site/:slug/blog/:postId" component={BlogPostView} />
      <Route path="/disclaimer/:disclaimerId" component={DisclaimerPage} />

      {/* Standalone tools routes */}
      <Route path="/card-builder" component={CardBuilderApp} />
      <Route path="/code-explorer" component={CodeExplorerApp} />
      <Route path="/functions" component={FunctionSearchPage} />

      {/* Builder Lab route */}
      <Route path="/builder" component={BuilderLab} />
      
      {/* Site directory as homepage - public */}
      <Route path="/" component={SiteDirectory} />
      
      {/* Redirect bare site slugs to proper /site/:slug format */}
      <Route path="/:slug">
        {(params) => {
          // Redirect to proper site URL format
          window.location.replace(`/site/${params.slug}`);
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
