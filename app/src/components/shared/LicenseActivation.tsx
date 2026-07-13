import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { KeyRound, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';

interface LicenseActivationProps {
  onActivated: () => void;
}

export function LicenseActivation({ onActivated }: LicenseActivationProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter your license key');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await invoke<string>('cmd_activate_license', { key: key.trim() });
      setSuccess(result);
      setTimeout(() => onActivated(), 1500);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-telegram-bg">
      <div className="glass bg-telegram-surface border border-telegram-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
            <KeyRound className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-telegram-text mb-1">Activate ClauSync</h1>
            <p className="text-sm text-telegram-subtext">Enter your license key to activate this device</p>
          </div>
        </div>

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <input
              type="text"
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); setSuccess(''); }}
              placeholder="CLAUSYNC-..."
              className="w-full bg-telegram-bg border border-telegram-border rounded-xl px-4 py-3 text-telegram-text font-mono text-sm placeholder:text-telegram-subtext/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-500/10 rounded-lg p-3">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 rounded-lg p-3">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !key.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Activate
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-telegram-subtext/50 text-center mt-4">
          License key required for first-time setup
        </p>
      </div>
    </div>
  );
}
