import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
}

/**
{
  "friendlyName": "action card",
  "description": "Reusable card component with icon, description and call-to-action.",
  "editCount": 1,
  "tags": ["ui", "card"],
  "location": "packages/card-builder/src/components/ActionCard.tsx > ActionCard",
  "notes": "Triggers provided onClick handler when button is pressed."
}
*/
export function ActionCard({ icon: Icon, title, description, cta, onClick }: ActionCardProps) {
  return (
    <Card className="w-full max-w-sm transition-shadow hover:shadow-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white">
          <Icon className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onClick}>{cta}</Button>
      </CardContent>
    </Card>
  );
}

