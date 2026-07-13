import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Settings, ShieldCheck, Sun, Moon, Heart, X, Phone, MessageCircle, Lock } from "lucide-react";
import { load } from '@tauri-apps/plugin-store';
import { useTheme } from '../../context/ThemeContext';
import { invoke } from '@tauri-apps/api/core';

function AuthThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="absolute top-[calc(1rem+env(safe-area-inset-top,24px))] right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-white" />
            ) : (
                <Moon className="w-5 h-5 text-white" />
            )}
        </button>
    );
}
export function AuthWizard({ onLogin }: { onLogin: () => void }) {
    const isBrowser = typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window);

    if (isBrowser) {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto p-8 text-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Desktop App Required</h1>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    You are viewing the internal development server in a browser.
                    This application cannot function here because it requires access to the system backend (Rust).
                </p>
                <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 text-sm text-gray-300">
                    Please open the <strong>ClauSync</strong> window in your OS taskbar/dock to continue.
                </div>
            </div>
        )
    }

    const [apiId, setApiId] = useState("");
    const [apiHash, setApiHash] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [showDonate, setShowDonate] = useState(false);

    const [initializing, setInitializing] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [adminStep, setAdminStep] = useState<'phone' | 'code' | 'password'>('phone');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [adminLoading, setAdminLoading] = useState(false);
    const [logoClickCount, setLogoClickCount] = useState(0);

    useEffect(() => {
        const initStore = async () => {
            try {
                const store = await load('config.json');
                const savedId = await store.get<string>('api_id');
                const savedHash = await store.get<string>('api_hash');
                if (savedId && savedHash) {
                    setApiId(savedId);
                    setApiHash(savedHash);
                }
            } catch {
                // config not found, starting fresh
            }
        };
        initStore();
    }, []);

    const saveCredentials = async () => {
        try {
            const store = await load('config.json');
            await store.set('api_id', apiId);
            await store.set('api_hash', apiHash);
            await store.save();
        } catch {
            // store write failure, non-critical
        }
    };

    const handleSetupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (apiId.includes(' ') || apiHash.includes(' ')) {
            setError("API ID and API Hash cannot contain spaces. Please remove any spaces.");
            return;
        }

        if (!apiId || !apiHash) {
            setError("Both API ID and Hash are required.");
            return;
        }
        setError(null);
        setInitializing(true);
        await saveCredentials();
        onLogin();
    };

    const handleLogoClicks = () => {
        const next = logoClickCount + 1;
        setLogoClickCount(next);
        if (next >= 5) {
            setShowAdmin(true);
            setLogoClickCount(0);
        }
        setTimeout(() => setLogoClickCount(0), 3000);
    };

    const handleRequestCode = async () => {
        if (!phone.trim()) return;
        if (!apiId.trim() || !apiHash.trim()) {
            setError("Please enter your API ID and Hash in the fields above first.");
            return;
        }
        await saveCredentials();
        setAdminLoading(true);
        setError('');
        try {
            await invoke('cmd_auth_request_code', { phone: phone.trim(), apiId: parseInt(apiId, 10), apiHash: apiHash });
            setAdminStep('code');
        } catch (e) {
            setError(String(e));
        }
        setAdminLoading(false);
    };

    const handleSignIn = async () => {
        if (!code.trim()) return;
        setAdminLoading(true);
        setError('');
        try {
            const result = await invoke<{success: boolean; next_step?: string; error?: string}>('cmd_auth_sign_in', { code: code.trim() });
            if (result.success) {
                setShowAdmin(false);
                onLogin();
            } else if (result.next_step === 'password') {
                setAdminStep('password');
            } else {
                setError(result.error || 'Sign in failed');
            }
        } catch (e) {
            setError(String(e));
        }
        setAdminLoading(false);
    };

    const handleCheckPassword = async () => {
        if (!password.trim()) return;
        setAdminLoading(true);
        setError('');
        try {
            const result = await invoke<{success: boolean; error?: string}>('cmd_auth_check_password', { password: password.trim() });
            if (result.success) {
                setShowAdmin(false);
                onLogin();
            } else {
                setError(result.error || 'Incorrect password');
            }
        } catch (e) {
            setError(String(e));
        }
        setAdminLoading(false);
    };

    return (
        <div className="h-full w-full auth-gradient flex items-center justify-center p-6 pt-[calc(1.5rem+env(safe-area-inset-top,24px))] relative">
            <AuthThemeToggle />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="auth-glass p-6 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
                <div className="text-center mb-6">
                    <button onClick={handleLogoClicks} className="w-16 h-16 mb-4 mx-auto flex items-center justify-center filter drop-shadow-lg cursor-pointer">
                        <img src="/logo.svg" alt="Logo" className="w-full h-full" />
                    </button>
                    <h1 className="text-xl font-bold text-white mb-1 tracking-tight">ClauSync</h1>
                    <p className="text-sm text-white/60 font-medium">Self-Hosted Secure Storage</p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.form
                        key="setup"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        onSubmit={handleSetupSubmit}
                        className="space-y-5"
                    >
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API ID</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 auth-form-icon" />
                                        <input
                                            type="text"
                                            value={apiId}
                                            onChange={(e) => setApiId(e.target.value)}
                                            placeholder="12345678"
                                            className="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">API Hash</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 auth-form-icon" />
                                        <input
                                            type="text"
                                            value={apiHash}
                                            onChange={(e) => setApiHash(e.target.value)}
                                            placeholder="abcdef123456..."
                                            className="w-full glass-input rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={initializing}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {initializing ? 'Connecting...' : 'Configure'} <Settings className="w-4 h-4" />
                            </button>
                        </motion.form>
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                        <p className="text-red-400 text-sm leading-snug">{error}</p>
                    </motion.div>
                )}

                <div className="mt-8 pt-4 border-t border-white/5 text-center">
                    <button
                        onClick={() => setShowDonate(true)}
                        className="text-xs text-telegram-subtext hover:text-telegram-text transition-colors flex items-center justify-center gap-1.5 mx-auto"
                    >
                        <Heart className="w-3.5 h-3.5 text-red-500/80" />
                        Donate
                    </button>
                </div>

                {showAdmin && (
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                        <div className="text-center">
                            <p className="text-xs text-white/40 uppercase tracking-wider">Admin — Telegram Login</p>
                        </div>
                        {adminStep === 'phone' && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Phone number +1234567890"
                                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRequestCode}
                                    disabled={adminLoading || !phone.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
                                >
                                    {adminLoading ? 'Sending...' : 'Send Code'}
                                </button>
                            </div>
                        )}
                        {adminStep === 'code' && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="Code from Telegram"
                                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSignIn}
                                    disabled={adminLoading || !code.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
                                >
                                    {adminLoading ? 'Signing in...' : 'Sign In'}
                                </button>
                            </div>
                        )}
                        {adminStep === 'password' && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="2FA password"
                                        className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCheckPassword}
                                    disabled={adminLoading || !password.trim()}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
                                >
                                    {adminLoading ? 'Checking...' : 'Submit Password'}
                                </button>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={() => { setShowAdmin(false); setAdminStep('phone'); setPhone(''); setCode(''); setPassword(''); }}
                            className="w-full text-xs text-white/30 hover:text-white/50 py-1"
                        >
                            Cancel
                        </button>
                    </div>
                )}

            </motion.div>
            <AnimatePresence>
                {showDonate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowDonate(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="glass bg-telegram-surface border border-telegram-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative flex items-center justify-center mb-6">
                                <h2 className="text-xl font-bold text-telegram-text text-center">
                                    Support the Project
                                </h2>
                                <button onClick={() => setShowDonate(false)} className="absolute right-0 p-2 hover:bg-telegram-hover rounded-lg transition-colors">
                                    <X className="w-5 h-5 text-telegram-subtext" />
                                </button>
                            </div>

                            <div className="space-y-4 text-center">
                                <p className="text-sm text-telegram-subtext mb-6">
                                    If you find ClauSync useful, consider supporting its development!
                                </p>

                                <div className="space-y-4">
                                    <a href="#" onClick={(e) => { e.preventDefault(); open('https://www.paypal.me/Caamer20'); }} className="block hover:opacity-80 transition-opacity">
                                        <img src="https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png" alt="Donate with PayPal" width="200" className="mx-auto" />
                                    </a>

                                    <a href="#" onClick={(e) => { e.preventDefault(); open('https://link.trustwallet.com/send?address=ltc1q6wkr5ac4u0pxx4hx7xgwn0gsaku25ws0df73rp&asset=c2'); }} className="block hover:opacity-80 transition-opacity">
                                        <img src="https://img.shields.io/badge/Donate-LTC-345D9D?style=for-the-badge&logo=litecoin&logoColor=white" alt="Donate LTC" className="mx-auto h-[28px]" />
                                    </a>

                                    <a href="#" onClick={(e) => { e.preventDefault(); open('https://link.trustwallet.com/send?asset=c0&address=bc1q5pt7m2fk6w0dzsnf6vvd5k6nw5k44785286ujy'); }} className="block hover:opacity-80 transition-opacity">
                                        <img src="https://img.shields.io/badge/Donate-BTC-F7931A?style=for-the-badge&logo=bitcoin&logoColor=white" alt="Donate BTC" className="mx-auto h-[28px]" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
        </div>
    );
}