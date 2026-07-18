/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Shield, User, KeyRound, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useLocale } from '../LocaleContext';
import { t } from '../i18n';
import { Teacher, UserRole } from '../types';

interface AuthScreenProps {
  teachers: Teacher[];
  onLoginSuccess: (role: UserRole, userDetail: { id: string; name: string; email: string; password?: string }) => Promise<void> | void;
}

export default function AuthScreen({ teachers, onLoginSuccess }: AuthScreenProps) {
  useLocale();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setEmail('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError(t('auth.enterEmail'));
      return;
    }
    if (!password) {
      setError(t('auth.enterPassword'));
      return;
    }

    setIsLoading(true);

    try {
      await onLoginSuccess(selectedRole, {
        id: selectedRole === 'admin' ? 'admin_1' : '',
        name: selectedRole === 'admin' ? 'Principal Arthur' : '',
        email,
        password,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.unableSignIn');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-screen" className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-sm z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600 rounded-xl text-white shadow-sm mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('auth.title')}</h1>
          <p className="text-xs text-slate-500 mt-1.5 font-medium">{t('auth.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            id="role-btn-admin"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-150 ${
              selectedRole === 'admin'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            {t('auth.roleAdmin')}
          </button>
          <button
            type="button"
            id="role-btn-teacher"
            onClick={() => handleRoleChange('teacher')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-xs transition-all duration-150 ${
              selectedRole === 'teacher'
                ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600" />
            {t('auth.roleTeacher')}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              {t('auth.emailAddress')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="login-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder={selectedRole === 'admin' ? t('auth.adminEmailPlaceholder') : t('auth.teacherEmailPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="login-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                placeholder={t('auth.enterNewPassword')}
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-semibold text-sm shadow-sm active:scale-[0.99] transition-all cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {t('auth.signIn')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
