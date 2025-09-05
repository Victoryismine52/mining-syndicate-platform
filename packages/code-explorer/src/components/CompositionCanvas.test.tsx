/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, within, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { CompositionCanvas, CompositionNode, Edge } from "./CompositionCanvas";

function Wrapper({
  initialNodes = [],
  initialConnections = [],
}: {
  initialNodes?: CompositionNode[];
  initialConnections?: Edge[];
}) {
  const [state, setState] = React.useState({
    nodes: initialNodes,
    connections: initialConnections,
  });
  return (
    <CompositionCanvas
      nodes={state.nodes}
      connections={state.connections}
      onUpdate={setState}
    />
  );
}

describe("CompositionCanvas", () => {
  afterEach(() => {
    cleanup();
  });
  it("places node on canvas when dropped", () => {
    render(<Wrapper />);
    const canvas = screen.getByTestId("canvas") as HTMLElement;
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.dragOver(canvas, { preventDefault: () => {} });
    fireEvent.drop(canvas, {
      dataTransfer: { getData: () => "fn" },
      clientX: 10,
      clientY: 10,
    });

    const canvasQueries = within(canvas);
    expect(canvasQueries.getByText("fn")).toBeTruthy();
  });

  it("creates connection between nodes", () => {
    const nodes: CompositionNode[] = [
      { id: "a", name: "A", x: 0, y: 0 },
      { id: "b", name: "B", x: 150, y: 0 },
    ];
    render(<Wrapper initialNodes={nodes} initialConnections={[]} />);

    fireEvent.click(screen.getByTestId("output-a"));
    fireEvent.click(screen.getByTestId("input-b"));

    expect(screen.getByTestId("edge-a-b")).toBeTruthy();
  });

  it("reports drop via onUpdate", () => {
    const onUpdate = vi.fn();
    render(
      <CompositionCanvas nodes={[]} connections={[]} onUpdate={onUpdate} />,
    );
    const canvas = screen.getByTestId("canvas") as HTMLElement;
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    fireEvent.dragOver(canvas, { preventDefault: () => {} });
    fireEvent.drop(canvas, {
      dataTransfer: { getData: () => "fn" },
      clientX: 20,
      clientY: 25,
    });

    expect(onUpdate).toHaveBeenCalled();
    const state = onUpdate.mock.calls[0][0];
    expect(state.nodes[0].name).toBe("fn");
  });
});

