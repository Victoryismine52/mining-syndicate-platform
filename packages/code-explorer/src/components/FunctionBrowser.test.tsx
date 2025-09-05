/* @vitest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FunctionBrowser } from "./FunctionBrowser";
import { CompositionCanvas, CompositionNode, Edge } from "./CompositionCanvas";

describe("FunctionBrowser", () => {
  it("filters displayed functions", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { name: "foo", signature: "", path: "a.ts", tags: [] },
          { name: "bar", signature: "", path: "b.ts", tags: [] },
        ]),
    } as any);

    render(<FunctionBrowser />);

    await screen.findByTestId("function-foo");

    fireEvent.change(screen.getByTestId("function-search"), {
      target: { value: "bar" },
    });

    expect(screen.queryByTestId("function-foo")).toBeNull();
    expect(screen.getByTestId("function-bar")).toBeTruthy();
  });

  it("drags function to composition canvas", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { name: "foo", signature: "", path: "a.ts", tags: [] },
        ]),
    } as any);

    function Wrapper() {
      const [state, setState] = React.useState({
        nodes: [] as CompositionNode[],
        connections: [] as Edge[],
      });
      return (
        <div className="flex">
          <FunctionBrowser />
          <CompositionCanvas
            nodes={state.nodes}
            connections={state.connections}
            onUpdate={setState}
          />
        </div>
      );
    }

    render(<Wrapper />);

    const item = await screen.findByTestId("function-foo");
    const canvas = screen.getByTestId("canvas");

    const data: Record<string, string> = {};
    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: (key: string, val: string) => {
          data[key] = val;
        },
      },
    });
    fireEvent.dragOver(canvas, { preventDefault: () => {} });
    fireEvent.drop(canvas, {
      dataTransfer: {
        getData: (key: string) => data[key],
      },
      clientX: 5,
      clientY: 5,
    });

    await waitFor(() => {
      expect(screen.getByText("foo")).toBeTruthy();
    });
  });

  it("handles API errors gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fail"));

    const { container } = render(<FunctionBrowser />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(container.querySelectorAll('[data-testid^="function-"]').length).toBe(
      0,
    );
  });

  it("drags multiple functions to canvas", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { name: "foo", signature: "", path: "a.ts", tags: [] },
          { name: "bar", signature: "", path: "b.ts", tags: [] },
        ]),
    } as any);

    function Wrapper() {
      const [state, setState] = React.useState({
        nodes: [] as CompositionNode[],
        connections: [] as Edge[],
      });
      return (
        <div className="flex">
          <FunctionBrowser />
          <CompositionCanvas
            nodes={state.nodes}
            connections={state.connections}
            onUpdate={setState}
          />
        </div>
      );
    }

    render(<Wrapper />);

    const foo = await screen.findByTestId("function-foo");
    const bar = await screen.findByTestId("function-bar");
    const canvas = screen.getByTestId("canvas");

    const drag = (el: HTMLElement, x: number, y: number) => {
      const data: Record<string, string> = {};
      fireEvent.dragStart(el, {
        dataTransfer: {
          setData: (key: string, val: string) => {
            data[key] = val;
          },
        },
      });
      fireEvent.dragOver(canvas, { preventDefault: () => {} });
      fireEvent.drop(canvas, {
        dataTransfer: { getData: (key: string) => data[key] },
        clientX: x,
        clientY: y,
      });
    };

    drag(foo, 5, 5);
    drag(bar, 10, 10);

    await waitFor(() => {
      expect(screen.getByText("foo")).toBeTruthy();
      expect(screen.getByText("bar")).toBeTruthy();
    });
  });
});
