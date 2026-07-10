import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';

interface VaultGateProps {
  onUnlocked: () => void;
}

type VaultStep = 'loading' | 'create' | 'confirm' | 'unlock';

export function VaultGate({ onUnlocked }: VaultGateProps) {
  const [step, setStep] = useState<VaultStep>('loading');
  const [code, setCode] = useState('');
  const [pendingCode, setPendingCode] = useState('');
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkConfig = async () => {
      try {
        const configured = await invoke<boolean>('cmd_vault_is_configured');
        setStep(configured ? 'unlock' : 'create');
      } catch {
        setStep('create');
      }
    };
    checkConfig();
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      setError('Passcode must be exactly 4 digits');
      return;
    }
    setPendingCode(code);
    setCode('');
    setStep('confirm');
    setError('');
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code !== pendingCode) {
      setError('Passcodes do not match');
      setCode('');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await invoke('cmd_vault_set_passcode', { code });
      onUnlocked();
    } catch (err) {
      setError('Failed to save passcode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter your passcode');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const result = await invoke<boolean>('cmd_vault_check', { code });
      if (result) {
        onUnlocked();
      } else {
        setError('Incorrect passcode');
        setCode('');
      }
    } catch {
      setError('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'loading') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-telegram-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-telegram-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-telegram-bg">
      <div className="glass bg-telegram-surface border border-telegram-border rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-telegram-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-telegram-primary" />
          </div>
          <div className="text-center">
            {step === 'create' && (
              <>
                <h1 className="text-xl font-bold text-telegram-text mb-1">Create Passcode</h1>
                <p className="text-sm text-telegram-subtext">Set a 4-digit passcode to protect your app</p>
              </>
            )}
            {step === 'confirm' && (
              <>
                <h1 className="text-xl font-bold text-telegram-text mb-1">Confirm Passcode</h1>
                <p className="text-sm text-telegram-subtext">Re-enter your passcode to confirm</p>
              </>
            )}
            {step === 'unlock' && (
              <>
                <h1 className="text-xl font-bold text-telegram-text mb-1">App Access</h1>
                <p className="text-sm text-telegram-subtext">Enter your passcode to continue</p>
              </>
            )}
          </div>
        </div>

        <form onSubmit={
          step === 'create' ? handleCreate :
          step === 'confirm' ? handleConfirm :
          handleUnlock
        } className="space-y-4">
          <div className="relative">
            <input
              type={showCode ? 'text' : 'password'}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              placeholder={step === 'confirm' ? 'Re-enter passcode' : 'Enter 4-digit passcode'}
              maxLength={4}
              className="w-full bg-telegram-bg border border-telegram-border rounded-xl px-4 py-3 text-telegram-text text-center text-2xl tracking-[0.5em] placeholder:text-telegram-subtext/50 placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-telegram-primary/50 pr-12"
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

          {step === 'confirm' && pendingCode && (
            <div className="flex items-center justify-center gap-2 text-sm text-telegram-subtext">
              <Check className="w-4 h-4 text-green-500" />
              Passcode set — now confirm it
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length < 4}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
            ) : (
              <>
                {step === 'create' ? 'Set Passcode' : step === 'confirm' ? 'Confirm' : 'Unlock'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {step === 'unlock' && (
          <p className="text-xs text-telegram-subtext/50 text-center mt-4">
            No recovery option — remember your passcode
          </p>
        )}
      </div>
    </div>
  );
}
