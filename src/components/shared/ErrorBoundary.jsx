import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-terracotta-deep flex items-center justify-center">
              <span className="text-2xl font-bold text-cream-dark font-serif">SA</span>
            </div>
            <h1 className="text-2xl font-bold text-terracotta-deep mb-2">Something went wrong</h1>
            <p className="text-smoke mb-6">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 bg-terracotta-deep text-cream rounded-xl font-medium hover:bg-terracotta transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
