import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Building,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginViewProps {
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  onDemoLogin?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSwitchToRegister,
  onForgotPassword,
  onDemoLogin,
}) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Verifique e tente novamente.'
          : error.message
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Left Column: Visual Brand & Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border-r border-slate-800/80 relative overflow-hidden">
        {/* Background Glowing Ambient Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/20">
            P
          </div>
          <div>
            <span className="text-lg font-extrabold text-white tracking-wider">PROSPER</span>
            <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              SaaS Pro
            </span>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="space-y-6 max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gestão Financeira & DRE Inteligente</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Controle financeiro de alta precisão para empresas modernas.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Elimine planilhas manuais com conciliação OFX instantânea, fluxo de caixa diário projetado e DRE gerencial em regime de competência.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Multi-tenant com isolamento total de dados via Row-Level Security</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Relatórios executivos e demonstrativos prontos para exportar</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Acesso seguro em qualquer dispositivo na nuvem</span>
            </div>
          </div>
        </div>

        {/* Footer Trust */}
        <div className="flex items-center gap-2 text-xs text-slate-500 relative z-10">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Criptografia bancária de ponta a ponta</span>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-extrabold text-lg">
              P
            </div>
            <span className="text-lg font-extrabold text-white tracking-wider">PROSPER</span>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Acesse sua conta
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Digite suas credenciais de login para entrar na sua empresa.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 leading-relaxed animate-fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="text-[11px] text-emerald-400 hover:underline font-semibold"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 mt-2"
            >
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          {onDemoLogin && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onDemoLogin}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Entrar em Modo Demonstração (Test Drive)</span>
              </button>
            </div>
          )}

          {/* Switch to Register */}
          <div className="text-center pt-4 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Ainda não possui uma conta?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-emerald-400 hover:underline font-bold"
              >
                Cadastre sua empresa (14 dias grátis)
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
