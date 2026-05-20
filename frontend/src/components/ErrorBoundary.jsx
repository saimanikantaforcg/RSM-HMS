import React from 'react';

/**
 * Enterprise Error Boundary
 * 
 * Prevents the entire SPA from unmounting/crashing on localized runtime errors.
 * Provides a "Safe Mode" UI for hospital staff.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In a real enterprise app, we would log this to Sentry/Datadog here
    console.error("[HMS ErrorBoundary] CRITICAL UI ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
          <div className="max-w-md w-full bg-slate-800 border border-red-500/30 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">System Encountered an Issue</h2>
              <p className="text-slate-400">
                The application module failed to load. We've captured the error and are working on it.
              </p>
            </div>
            <div className="bg-black/20 p-4 rounded-lg text-xs font-mono text-left overflow-auto max-h-32 text-red-400 border border-white/5">
              {this.state.error?.toString() || "Unknown Component Error"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold transition-colors shadow-lg shadow-blue-900/20"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
