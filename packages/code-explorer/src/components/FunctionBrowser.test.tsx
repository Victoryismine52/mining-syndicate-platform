/* @vitest-environment jsdom */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { FunctionBrowser } from "./FunctionBrowser";
import { CompositionCanvas, CompositionNode, Edge } from "./CompositionCanvas";

describe("FunctionBrowser", () => {
  afterEach(() => {
    cleanup();
  });
  it("handles API failure gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fail"));

    render(<FunctionBrowser />);

    await waitFor(() => {
      const items = screen
        .queryAllByTestId(/function-/)
        .filter(
          (el) =>
            !["function-browser", "function-search"].includes(
              el.getAttribute("data-testid")!
            ),
        );
      expect(items).toHaveLength(0);
    });
  });
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

  it("filters functions case-insensitively", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { name: "Foo", signature: "", path: "a.ts", tags: [] },
          { name: "Bar", signature: "", path: "b.ts", tags: [] },
        ]),
    } as any);

    render(<FunctionBrowser />);

    await screen.findByTestId("function-Foo");

    fireEvent.change(screen.getByTestId("function-search"), {
      target: { value: "BAR" },
    });

    expect(screen.queryByTestId("function-Foo")).toBeNull();
    expect(screen.getByTestId("function-Bar")).toBeTruthy();
  });

  it("shows all functions when filter is cleared", async () => {
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
      target: { value: "foo" },
    });
    expect(screen.queryByTestId("function-bar")).toBeNull();

    fireEvent.change(screen.getByTestId("function-search"), {
      target: { value: "" },
    });

    expect(screen.getByTestId("function-foo")).toBeTruthy();
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
      expect(within(canvas).getByText("foo")).toBeTruthy();
    });
  });

  it("handles API errors gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fail"));

    const { container } = render(<FunctionBrowser />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(
      container.querySelectorAll('[data-testid^="function-"][draggable="true"]').length,
    ).toBe(0);
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
      expect(within(canvas).getByText("foo")).toBeTruthy();
      expect(within(canvas).getByText("bar")).toBeTruthy();
    });
  });

  it("requests functions from explorer API endpoint", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([]),
    } as any);

    render(<FunctionBrowser />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith("/code-explorer/api/functions");
  });

  it("invokes onSelect when dragging", async () => {
    const onSelect = vi.fn();
    const fn = { name: "foo", signature: "", path: "a.ts", tags: [] };
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([fn]),
    } as any);

    render(<FunctionBrowser onSelect={onSelect} />);

    const item = await screen.findByTestId("function-foo");
    fireEvent.dragStart(item, {
      dataTransfer: { setData: () => {} },
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(fn);
  });

  it("invokes onSelect for each dragged function", async () => {
    const onSelect = vi.fn();
    const data = [
      { name: "foo", signature: "", path: "a.ts", tags: [] },
      { name: "bar", signature: "", path: "b.ts", tags: [] },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(data),
    } as any);

    render(<FunctionBrowser onSelect={onSelect} />);

    const foo = await screen.findByTestId("function-foo");
    const bar = await screen.findByTestId("function-bar");

    fireEvent.dragStart(foo, { dataTransfer: { setData: () => {} } });
    fireEvent.dragStart(bar, { dataTransfer: { setData: () => {} } });

    expect(onSelect).toHaveBeenCalledTimes(2);
    expect(onSelect).toHaveBeenNthCalledWith(1, data[0]);
    expect(onSelect).toHaveBeenNthCalledWith(2, data[1]);
  });

  it("notifies canvas when dropping a function", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve([
          { name: "foo", signature: "", path: "a.ts", tags: [] },
        ]),
    } as any);

    const onUpdate = vi.fn();

    render(
      <div className="flex">
        <FunctionBrowser />
        <CompositionCanvas
          nodes={[]}
          connections={[]}
          onUpdate={onUpdate}
        />
      </div>,
    );

    const item = await screen.findByTestId("function-foo");
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
      dataTransfer: { getData: (key: string) => data[key] },
      clientX: 1,
      clientY: 1,
    });

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const state = onUpdate.mock.calls.at(-1)[0];
    expect(state.nodes.length).toBe(1);
    expect(state.nodes[0].name).toBe("foo");
  });

  it("places nodes at drop coordinates", async () => {
    const fn = { name: "foo", signature: "", path: "a.ts", tags: [] };
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve([fn]),
    } as any);

    const onUpdate = vi.fn();
    render(
      <div className="flex">
        <FunctionBrowser />
        <CompositionCanvas
          nodes={[]}
          connections={[]}
          onUpdate={onUpdate}
        />
      </div>,
    );

    const item = await screen.findByTestId("function-foo");
    const canvas = screen.getByTestId("canvas") as HTMLElement;
    canvas.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      right: 110,
      bottom: 120,
      width: 100,
      height: 100,
      x: 10,
      y: 20,
      toJSON: () => {},
    });

    const dataTransfer: Record<string, string> = {};
    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: (key: string, val: string) => {
          dataTransfer[key] = val;
        },
      },
    });
    fireEvent.dragOver(canvas, { preventDefault: () => {} });
    fireEvent.drop(canvas, {
      dataTransfer: { getData: (key: string) => dataTransfer[key] },
    });

    await waitFor(() => expect(onUpdate).toHaveBeenCalled());
    const state = onUpdate.mock.calls.at(-1)[0];
    expect(state.nodes[0].x).toBe(-10);
    expect(state.nodes[0].y).toBe(-20);
  });
});
