import React from 'react';

/**
 * Prevents a single crashing view from blanking the entire application.
 * Resets automatically when the route (hash) changes.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
    this.handleHashChange = this.handleHashChange.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] View crashed:', error, info?.componentStack);
  }

  componentDidMount() {
    window.addEventListener('hashchange', this.handleHashChange);
  }

  componentWillUnmount() {
    window.removeEventListener('hashchange', this.handleHashChange);
  }

  handleHashChange() {
    if (this.state.error) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl border border-rose-500/30 bg-[#04241a]/90 p-6 shadow-2xl text-center">
          <h2 className="text-lg font-bold text-rose-300 mb-2">This section failed to load</h2>
          <p className="text-sm text-emerald-100/70 mb-4">
            The rest of the library is still available. You can retry or go back to the catalogue.
          </p>
          <pre className="text-[11px] text-rose-200/80 bg-black/30 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-left">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <div className="flex gap-3 justify-center">
            <button
              id="btn-error-retry"
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"
            >
              Retry
            </button>
            <button
              id="btn-error-home"
              onClick={() => { window.location.hash = '#/opac'; this.setState({ error: null }); }}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold"
            >
              Go to Catalogue
            </button>
          </div>
        </div>
      </div>
    );
  }
}
