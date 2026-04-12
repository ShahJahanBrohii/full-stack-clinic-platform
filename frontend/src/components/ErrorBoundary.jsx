import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Optionally reload the page
    // window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
          <div className="max-w-md w-full">
            <div className="bg-white/[0.02] border border-red-500/30 rounded-lg p-8 text-center">
              {/* Error Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center bg-red-500/10 border border-red-500/30 rounded-full">
                  <AlertCircle size={28} className="text-red-400" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-slate-400 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>

              {/* Error Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left bg-slate-950 rounded p-3 border border-slate-800">
                  <summary className="cursor-pointer text-xs font-mono text-red-400 mb-2">
                    Error Details
                  </summary>
                  <pre className="text-[10px] text-slate-400 overflow-auto max-h-[200px]">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white font-bold rounded-lg hover:shadow-glow-primary transition-all duration-200"
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
                <a
                  href="/"
                  className="flex items-center justify-center px-4 py-3 border border-primary/30 text-primary font-bold rounded-lg hover:bg-primary/10 transition-all duration-200"
                >
                  Return Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
