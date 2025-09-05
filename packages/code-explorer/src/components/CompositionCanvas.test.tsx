/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CompositionCanvas, CompositionNode, Edge } from "./CompositionCanvas";

function Wrapper({
  functions = [],
  initialNodes = [],
  initialConnections = [],
}: {
  functions?: string[];
  initialNodes?: CompositionNode[];
  initialConnections?: Edge[];
}) {
  const [state, setState] = React.useState({
    nodes: initialNodes,
    connections: initialConnections,
  });
  return (
    <CompositionCanvas
      functions={functions}
      nodes={state.nodes}
      connections={state.connections}
      onUpdate={setState}
    />
  );
}

describe("CompositionCanvas", () => {
  it("places node on canvas when dropped", () => {
    render(<Wrapper functions={["fn"]} />);
    const palette = screen.getByTestId("palette-fn");
    const canvas = screen.getByTestId("canvas");

    fireEvent.dragStart(palette, {
      dataTransfer: {
        setData: () => {},
      },
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
    render(
      <Wrapper
        functions={[]}
        initialNodes={nodes}
        initialConnections={[]}
      />
    );

    fireEvent.click(screen.getByTestId("output-a"));
    fireEvent.click(screen.getByTestId("input-b"));

    expect(screen.getByTestId("edge-a-b")).toBeTruthy();
  });
});

