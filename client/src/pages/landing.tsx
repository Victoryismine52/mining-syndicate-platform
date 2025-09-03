import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearnMoreModal } from "@/components/learn-more-modal";
import { MiningPoolModal } from "@/components/mining-pool-modal";
import { LendingPoolModal } from "@/components/lending-pool-modal";
import { SiteFooter } from "@/components/site-footer";
import { 
  TrendingUp, 
  Shield, 
  Users, 
  DollarSign, 
  Building2, 
  ArrowRight,
  Download,
  Pickaxe,
  Coins
} from "lucide-react";

export function Landing() {
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);
  const [miningPoolOpen, setMiningPoolOpen] = useState(false);
  const [lendingPoolOpen, setLendingPoolOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section - Mimicking First Slide */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        
        {/* Conduit Logo - Top Left */}
        <div className="absolute top-6 left-6 z-10">
          <a href="https://cndt.io" target="_blank" rel="noopener noreferrer">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
              <img 
                src="https://cndt.io/nav2/logo-full.svg" 
                alt="Conduit Network Logo" 
                className="h-6 w-auto"
              />
            </div>
          </a>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl font-bold text-white leading-tight">
                Mining <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Syndicate</span>
              </h1>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                A mining syndicate is a Managed Node Deployment, where the network strategically places nodes to maximize rewards.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                Jumpstart Mutualized Economy
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Shield className="w-4 h-4 mr-2" />
                Prove the Models
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Users className="w-4 h-4 mr-2" />
                Identify Alpha Partners
              </Badge>
            </div>

            <div className="pt-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
                onClick={() => window.open('/presentation', '_blank')}
              >
                <Download className="w-5 h-5 mr-2" />
                View Slide Presentation
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Participation Pathways */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Participation Pathways
          </h2>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            Two ways to participate in the Mining Syndicate: Lending or Nodes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-blue-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[450px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <Building2 className="text-blue-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Explore the Opportunity</CardTitle>
              <CardDescription className="text-slate-400">
                Be part of the first ever Mining Syndicate launching the Mutualized Economy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Comprehensive overview</li>
                <li>• Risk assessment details</li>
                <li>• Performance metrics</li>
                <li>• Syndicate structure</li>
              </ul>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                onClick={() => setLearnMoreOpen(true)}
              >
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[450px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <Pickaxe className="text-purple-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Contribute Nodes</CardTitle>
              <CardDescription className="text-slate-400">
                Become a Founding infrastructure provider for the entire network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Hyper-incentive packages</li>
                <li>• All mining is pooled</li>
                <li>• Nodes are strategically deployed</li>
                <li>• Limited slots available</li>
              </ul>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto"
                onClick={() => setMiningPoolOpen(true)}
              >
                Reserve Your Spot
                <Pickaxe className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 hover:border-green-500/50 transition-all duration-300 transform hover:scale-105 flex flex-col h-full min-h-[450px]">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <Coins className="text-green-400 text-3xl" />
              </div>
              <CardTitle className="text-2xl text-white">Lend Capital</CardTitle>
              <CardDescription className="text-slate-400">
                Lend capital to unlock the next wave of token mining and infrastructure rewards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <ul className="space-y-2 text-slate-300 flex-1">
                <li>• Greater than 300% targeted ROI</li>
                <li>• Earn CNDT, Squares and Points</li>
                <li>• Jumpstart the Mutualized Economy</li>
                <li>• First come, first-served</li>
              </ul>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-auto"
                onClick={() => setLendingPoolOpen(true)}
              >
                Join Lending Pool
                <DollarSign className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modals */}
      <LearnMoreModal isOpen={learnMoreOpen} onClose={() => setLearnMoreOpen(false)} />
      <MiningPoolModal 
        isOpen={miningPoolOpen} 
        onClose={() => setMiningPoolOpen(false)}
        onLendingPoolOpen={() => {
          setMiningPoolOpen(false);
          setLendingPoolOpen(true);
        }}
      />
      <LendingPoolModal isOpen={lendingPoolOpen} onClose={() => setLendingPoolOpen(false)} />

      {/* Site Footer with Legal Disclaimers */}
      <SiteFooter 
        siteId="main-site" 
        companyName="Mining Syndicate" 
      />
    </div>
  );
}