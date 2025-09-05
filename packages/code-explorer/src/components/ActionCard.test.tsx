/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ActionCard } from "./ActionCard";

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: (props: any) => <button {...props} />,
}));

afterEach(() => cleanup());

describe("ActionCard", () => {
  it("renders icon, title, description and cta", () => {
    const Icon = () => <svg data-testid="icon" />;
    render(
      <ActionCard
        icon={Icon}
        title="Title"
        description="Description"
        cta="Go"
        onClick={() => {}}
      />
    );
    expect(screen.getByTestId("icon")).toBeTruthy();
    expect(screen.getByText("Title")).toBeTruthy();
    expect(screen.getByText("Description")).toBeTruthy();
    expect(screen.getByText("Go")).toBeTruthy();
  });

  it("fires onClick when button is clicked", () => {
    const Icon = () => <svg />;
    const onClick = vi.fn();
    render(
      <ActionCard
        icon={Icon}
        title="Title"
        description="Description"
        cta="Go"
        onClick={onClick}
      />
    );
    fireEvent.click(screen.getByText("Go"));
    expect(onClick).toHaveBeenCalled();
  });

  it("handles missing onClick without crashing", () => {
    const Icon = () => <svg />;
    render(
      <ActionCard
        icon={Icon}
        title="Title"
        description="Description"
        cta="Go"
        onClick={undefined as any}
      />
    );
    expect(() => fireEvent.click(screen.getByText("Go"))).not.toThrow();
  });
});

