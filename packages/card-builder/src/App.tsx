import React, { useState } from "react";
import { CardEditor, CardConfig, elementLibrary } from "./Editor";
import { ActionCard } from "./components/ActionCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";

interface StoredCard extends CardConfig {
  id: string;
}

function PreviewCanvas({ theme, shadow, lighting, animation, children }: Omit<CardConfig, "elements" | "name"> & { children: React.ReactNode }) {
  const themeClass =
    theme === "dark"
      ? "bg-gray-900 text-white"
      : theme === "neon"
      ? "bg-gradient-to-r from-blue-500 to-pink-500 text-white"
      : "bg-white text-black";
  const shadowClass =
    shadow === "soft" ? "shadow-md" : shadow === "strong" ? "shadow-xl" : "";
  const lightingClass =
    lighting === "glow"
      ? "ring-2 ring-blue-400"
      : lighting === "neon"
      ? "ring-2 ring-pink-500"
      : "";
  const animationClass =
    animation === "fade"
      ? "animate-in fade-in"
      : animation === "hover"
      ? "transition-transform hover:scale-105"
      : "";
  return (
    <div className={`w-64 min-h-[10rem] border p-4 flex flex-col gap-2 ${themeClass} ${shadowClass} ${lightingClass} ${animationClass}`}>
      {children}
    </div>
  );
}

function PreviewCard({ card }: { card: StoredCard }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="font-semibold">{card.name}</div>
      <PreviewCanvas
        theme={card.theme}
        shadow={card.shadow}
        lighting={card.lighting}
        animation={card.animation}
      >
      {card.elements.map((el) => {
        const def = elementLibrary.find((d) => d.id === el.elementId);
        if (!def) return null;
        if (def.type === "text" && el.displayMode !== "input") {
          return <div key={el.id}>{el.props.label || def.defaultProps.label}</div>;
        }
        if (def.type === "text" && el.displayMode === "input") {
          return (
            <div key={el.id}>
              <label className="block mb-1">
                {el.props.label || def.defaultProps.label}
              </label>
              <input
                className="border px-1"
                placeholder={el.props.placeholder || def.defaultProps.placeholder}
              />
            </div>
          );
        }
        if (def.type === "image") {
          return (
            <img
              key={el.id}
              src={el.props.src || def.defaultProps.src}
              alt={el.props.alt || def.defaultProps.alt}
              className="w-full h-24 object-cover"
            />
          );
        }
        if (def.type === "button") {
          return (
            <button key={el.id} className="px-2 py-1 border">
              {el.props.label || def.defaultProps.label}
            </button>
          );
        }
        return null;
      })}
      </PreviewCanvas>
    </div>
  );
}

export function CardBuilderApp() {
  const stored = localStorage.getItem("cards");
  let initialCards: StoredCard[] = [];
  let initialError: string | null = null;
  if (stored) {
    try {
      initialCards = JSON.parse(stored);
    } catch (err) {
      console.error("Failed to parse stored cards", err);
      initialError = "Stored cards are corrupted. You can reset.";
    }
  }

  const [cards, setCards] = useState<StoredCard[]>(initialCards);
  const [error, setError] = useState<string | null>(initialError);
  const [editing, setEditing] = useState<StoredCard | null>(null);

  const persistCards = (list: StoredCard[]) => {
    if (list.length) {
      localStorage.setItem("cards", JSON.stringify(list));
    } else {
      localStorage.removeItem("cards");
    }
  };

  const resetStorage = () => {
    localStorage.removeItem("cards");
    setCards([]);
    setError(null);
  };

  const deleteCard = (id: string) => {
    if (!window.confirm("Delete this card?")) return;
    setCards((prev) => {
      const list = prev.filter((c) => c.id !== id);
      persistCards(list);
      return list;
    });
  };

  const saveCard = (config: CardConfig) => {
    if (!editing) return;
    const updated: StoredCard = { ...editing, ...config };
    setCards((prev) => {
      const list = prev.some((c) => c.id === updated.id)
        ? prev.map((c) => (c.id === updated.id ? updated : c))
        : [...prev, updated];
      persistCards(list);
      return list;
    });
    setEditing(null);
  };

  const startNew = () => {
    setEditing({
      id: Date.now().toString(),
      name: "Untitled Card",
      elements: [],
      theme: "light",
      shadow: "none",
      lighting: "none",
      animation: "none",
    });
  };

  const handleBack = () => setEditing(null);

  if (editing) {
    return <CardEditor initial={editing} onSave={saveCard} onBack={handleBack} />;
  }

  return (
    <div className="p-8">
      {error && (
        <div className="mb-4 p-2 border border-red-500 text-red-700">
          {error}
          <Button variant="outline" className="ml-2" onClick={resetStorage}>
            Reset
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ActionCard
          icon={Plus}
          title="Create New Card"
          description="Start designing a fresh card"
          cta="New Card"
          onClick={startNew}
        />
        {cards.map((card) => (
          <Card key={card.id} className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg">{card.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PreviewCard card={card} />
              <div className="flex gap-2">
                <Button onClick={() => setEditing(card)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteCard(card.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

