import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(
      email,
      password,
      fullName.trim(),
      companyName.trim(),
      document.trim()
    );

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    } else {
      setSuccessMessage(
        'Conta e Organização criadas com sucesso! Você já pode acessar sua conta.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Left Column: Benefits & Trust */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/40 border-r border-slate-800/80 relative overflow-hidden">
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
            <span>🎁 14 Dias Grátis sem Cartão de Crédito</span>
          </div>

          <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            Comece hoje a transformar a gestão financeira da sua empresa.
          </h1>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Multi-contas ilimitadas:</strong> Controle contas correntes, cartões e fundos fixos em um só lugar.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Conciliação Bancária Automática:</strong> Importe extratos OFX em segundos.
              </span>
            </div>
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>DRE & Relatórios Executivos:</strong> Demonstrações financeiras com regime de competência e caixa.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 text-xs text-slate-500 relative z-10">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Seus dados financeiros isolados e protegidos com criptografia</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 my-auto animate-fade-in">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Criar Conta da Empresa
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure sua organização em 1 minuto e ganhe 14 dias de teste grátis.
            </p>
          </div>

          {/* Error / Success Banners */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 leading-relaxed flex flex-col gap-2 animate-fade-in">
              <div>{errorMessage}</div>
              {(errorMessage.toLowerCase().includes('já possui') ||
                errorMessage.toLowerCase().includes('já está cadastrado') ||
                errorMessage.toLowerCase().includes('faça login')) && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="self-start px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold rounded-lg transition-all text-[11px] flex items-center gap-1 border border-rose-500/30"
                >
                  <span>Ir para a tela de Login</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 leading-relaxed">
              {successMessage}{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="underline font-bold text-white ml-1"
              >
                Clique aqui para entrar.
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Company Name & CNPJ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Nome da Empresa *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Minha Empresa Ltda"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  CNPJ ou CPF *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="00.000.000/0000-00"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                E-mail Corporativo *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Senha de Acesso (Mín. 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 text-xs font-semibold bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:font-normal placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 mt-2"
            >
              {isLoading ? (
                <span>Criando Organização...</span>
              ) : (
                <>
                  <span>Criar Minha Empresa Grátis</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="text-center pt-3 border-t border-slate-900">
            <p className="text-xs text-slate-400">
              Já possui uma empresa cadastrada?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-emerald-400 hover:underline font-bold"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
