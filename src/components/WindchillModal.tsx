import React, { useState, useEffect, useRef } from 'react';

interface Props {
    onClose: () => void;
    /** Called when user submits credentials. Should throw on failure with a user-readable message. */
    onConnect: (username: string, password: string) => Promise<void>;
}

const WindchillModal: React.FC<Props> = ({ onClose, onConnect }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const usernameRef = useRef<HTMLInputElement>(null);

    // Auto-focus username on open
    useEffect(() => {
        usernameRef.current?.focus();
    }, []);

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) { setError('Please enter your username.'); return; }
        if (!password) { setError('Please enter your password.'); return; }
        setError('');
        setLoading(true);
        try {
            await onConnect(username.trim(), password);
            // success — parent closes the modal
        } catch (err: any) {
            setError(err?.message || 'Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="wc-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        >
            <div className="wc-dialog" role="dialog" aria-modal="true" aria-labelledby="wc-title">
                {/* Header */}
                <div className="wc-header">
                    <div className="wc-header__left">
                        <svg className="wc-lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <h3 id="wc-title">Windchill Sign In</h3>
                    </div>
                    <button
                        className="wc-close"
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <form className="wc-body" onSubmit={handleSubmit} autoComplete="on">
                    <p className="wc-info">
                        Enter your Philips network credentials to load the product list directly from Windchill.
                    </p>

                    {error && (
                        <div className="wc-error" role="alert">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="wc-error__icon">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <label className="wc-label" htmlFor="wc-username">Username</label>
                    <input
                        id="wc-username"
                        ref={usernameRef}
                        className="wc-input"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="e.g. john.doe or DOMAIN\john.doe"
                        disabled={loading}
                    />

                    <label className="wc-label" htmlFor="wc-password">Password</label>
                    <div className="wc-password-wrap">
                        <input
                            id="wc-password"
                            className="wc-input wc-input--password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="wc-toggle-pw"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                            disabled={loading}
                        >
                            {showPassword ? (
                                // Eye-off
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                            ) : (
                                // Eye
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <p className="wc-privacy-note">
                        Your credentials are sent directly to the server and never stored.
                    </p>

                    <div className="wc-actions">
                        <button
                            type="button"
                            className="wc-btn wc-btn--cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="wc-btn wc-btn--primary"
                            disabled={loading || !username || !password}
                        >
                            {loading ? (
                                <>
                                    <span className="wc-spinner" aria-hidden="true" />
                                    Connecting…
                                </>
                            ) : 'Connect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WindchillModal;
