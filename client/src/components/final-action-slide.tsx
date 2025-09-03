import { Button } from "@/components/ui/button";
import { Info, Pickaxe, DollarSign, Building2, Coins } from "lucide-react";
import type { GlobalSlide } from "@shared/site-schema";

interface FinalActionSlideProps {
  globalSlide: GlobalSlide;
  onLearnMore: () => void;
  onMiningPool: () => void;
  onLendingPool: () => void;
}

const iconMap = {
  "info": Info,
  "pickaxe": Pickaxe,
  "dollar-sign": DollarSign,
  "building-2": Building2,
  "coins": Coins,
};

const colorMap = {
  blue: "bg-blue-600 hover:bg-blue-700",
  purple: "bg-purple-600 hover:bg-purple-700",
  green: "bg-green-600 hover:bg-green-700",
};

export function FinalActionSlide({ 
  globalSlide, 
  onLearnMore, 
  onMiningPool, 
  onLendingPool 
}: FinalActionSlideProps) {
  const config = globalSlide.cardConfig;
  const backgroundColor = config?.backgroundColor || "#0f172a";
  const textColor = config?.textColor || "#ffffff";
  
  const handleAction = (actionType: string) => {
    switch (actionType) {
      case 'learn-more':
        onLearnMore();
        break;
      case 'mining-pool':
        onMiningPool();
        break;
      case 'lending-pool':
        onLendingPool();
        break;
    }
  };

  return (
    <div 
      className="relative w-full h-screen flex items-center justify-center p-8"
      style={{ backgroundColor, color: textColor }}
    >
      <div className="max-w-6xl w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 
            className="text-5xl font-bold mb-4"
            data-testid="text-slide-title"
          >
            {globalSlide.title}
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-blue-500 via-orange-500 to-green-500 mx-auto rounded"></div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {config?.cards?.map((card, index) => {
            const IconComponent = iconMap[card.icon as keyof typeof iconMap] || Info;
            const colorClass = colorMap[card.color as keyof typeof colorMap] || colorMap.blue;
            
            return (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8 text-center hover:bg-white/15 transition-all duration-300 border border-white/20 flex flex-col h-full min-h-[400px]"
                data-testid={`card-action-${card.actionType}`}
              >
                {/* Icon */}
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${colorClass}`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content - grows to fill space */}
                <div className="flex-1 flex flex-col">
                  <h3 className="text-2xl font-semibold mb-4" data-testid={`text-card-title-${card.actionType}`}>
                    {card.title}
                  </h3>
                  
                  <p className="text-gray-200 mb-6 leading-relaxed flex-1" data-testid={`text-card-description-${card.actionType}`}>
                    {card.description}
                  </p>

                  {/* Action Button - always at bottom */}
                  <Button
                    onClick={() => handleAction(card.actionType)}
                    className={`w-full py-3 text-lg font-semibold ${colorClass} text-white border-0 rounded-lg transition-all duration-300 hover:scale-105 mt-auto`}
                    data-testid={`button-${card.actionType}`}
                  >
                    {card.buttonText}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom decorative line */}
        <div className="mt-12 text-center">
          <div className="h-1 w-64 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto rounded"></div>
        </div>
      </div>
    </div>
  );
}