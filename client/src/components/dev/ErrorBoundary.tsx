import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) {
    console.error("[Preview crashed]", error, info);
  }
  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="rounded-xl border bg-red-50 p-4 text-sm text-red-800">
          <div className="font-semibold">Preview crashed</div>
          <div className="mt-1">{this.state.error.message}</div>
          <button className="mt-3 rounded-lg border px-3 py-1" onClick={this.reset}>Reset preview</button>
        </div>
      );
    }
    return this.props.children;
  }
}
