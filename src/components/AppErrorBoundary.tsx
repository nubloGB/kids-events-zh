import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  failed: boolean;
}

/** Keeps a render error from blanking the page. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="soft-card px-6 py-10">
        <h1>Coś poszło nie tak</h1>
        <p>Odśwież stronę. Jeśli problem wraca, spróbuj później.</p>
        <button className="search-go" type="button" onClick={() => window.location.reload()}>
          Odśwież
        </button>
      </div>
    );
  }
}
