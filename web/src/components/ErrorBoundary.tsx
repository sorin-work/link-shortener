import { Component, type ComponentChildren } from 'preact';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ComponentChildren }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div class="empty">
          <h2>Something went wrong</h2>
          <p class="muted">{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
