import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PROSPER Uncaught Error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  public handleResetSession = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = window.location.origin + window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
          <div className="max-w-md w-full p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold text-xl border border-rose-500/20">
              ⚠️
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ops! Algo inesperado aconteceu</h2>
              <p className="text-xs text-slate-400 mt-1">
                {this.state.error?.message || 'Ocorreu uma falha ao renderizar a visualização.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={this.handleReload}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Recarregar Sistema
              </button>
              <button
                onClick={this.handleResetSession}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Limpar Cache & Entrar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
