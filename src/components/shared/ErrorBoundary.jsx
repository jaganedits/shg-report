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
        <div className="min-h-screen bg-[#FDF6EC] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#5C2E0E] flex items-center justify-center">
              <span className="text-2xl font-bold text-[#F5E6D0] font-serif">SA</span>
            </div>
            <h1 className="text-2xl font-bold text-[#5C2E0E] mb-2">Something went wrong</h1>
            <p className="text-[#6B5E53] mb-6">
              An unexpected error occurred. Please reload the page to continue.
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 bg-[#5C2E0E] text-[#FDF6EC] rounded-xl font-medium hover:bg-[#7A3A15] transition-colors cursor-pointer"
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
