import { Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-lg w-full border-4 border-wc-red">
          <div className="bg-wc-red px-6 py-4">
            <h1 className="font-anton text-white tracking-widest text-lg uppercase">Something went wrong</h1>
          </div>
          <div className="p-6 space-y-4">
            <p className="font-inter text-sm text-gray-600">
              The app encountered an unexpected error. Check the browser console for details.
            </p>
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 overflow-auto max-h-40">
              <code className="text-xs text-wc-red font-mono break-words">
                {error.message}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 bg-wc-black text-white font-anton px-6 py-3 tracking-widest uppercase hover:bg-wc-red transition text-sm"
            >
              <RefreshCw size={14} />
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
