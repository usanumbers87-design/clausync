import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface VaultGateProps {
  onUnlocked: () => void;
}

export function VaultGate({ onUnlocked }: VaultGateProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter a passcode');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await invoke<boolean>('cmd_check_vault', { code });
      if (result) {
        onUnlocked();
      } else {
        setError('Incorrect passcode');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-telegram-bg">
      <div className="glass bg-telegram-surface border border-telegram-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-telegram-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-telegram-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-telegram-text mb-1">Vault Access</h1>
            <p className="text-sm text-telegram-subtext">Enter passcode to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(''); }}
              placeholder="Enter passcode"
              className="w-full bg-telegram-bg border border-telegram-border rounded-xl px-4 py-3 text-telegram-text placeholder:text-telegram-subtext/50 focus:outline-none focus:ring-2 focus:ring-telegram-primary/50 pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-telegram-subtext hover:text-telegram-text transition-colors"
            >
              {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Unlock
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
