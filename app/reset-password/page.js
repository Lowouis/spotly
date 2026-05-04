'use client';

import React, {useEffect, useState} from 'react';
import NextLink from 'next/link';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/ui/spinner';
import DarkModeSwitch from '@/components/actions/DarkModeSwitch';
import {getPasswordChecks, PasswordStrength} from '@/components/modals/registerModal';

function validatePassword(password) {
    if (password.length > 128) return 'Le mot de passe ne doit pas dépasser 128 caractères.';
    if (getPasswordChecks(password).some(check => !check.valid)) return 'Veuillez respecter toutes les règles de sécurité du mot de passe.';
    return '';
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setToken(new URLSearchParams(window.location.search).get('token') || '');
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setMessage('');

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        if (password !== confirmPassword) {
            setError('Les deux mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/auth/password-reset/confirm', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({token, password}),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(data.message || 'Réinitialisation impossible.');
            setMessage(data.message || 'Votre mot de passe a été réinitialisé.');
            setTimeout(() => router.replace('/login'), 1200);
        } catch (e) {
            setError(e.message || 'Réinitialisation impossible.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
            <header className="flex justify-end p-4"><DarkModeSwitch /></header>
            <main className="flex flex-1 items-center justify-center px-4 py-8">
                <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Nouveau mot de passe</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Choisissez un mot de passe robuste pour votre compte interne.</p>
                    </div>

                    {!token ? (
                        <div className="space-y-5 text-center">
                            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">Lien de récupération manquant ou invalide.</p>
                            <NextLink href="/forgot-password" className="text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300">Demander un nouveau lien</NextLink>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nouveau mot de passe</label>
                                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="h-11 border-neutral-300 bg-transparent text-sm dark:border-neutral-600 dark:text-neutral-200" />
                                <PasswordStrength password={password} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirmer le mot de passe</label>
                                <Input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" className="h-11 border-neutral-300 bg-transparent text-sm dark:border-neutral-600 dark:text-neutral-200" />
                            </div>

                            {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{message}</p>}
                            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}

                            <Button type="submit" disabled={loading} className="h-11 w-full bg-neutral-900 font-medium text-white transition-colors duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                                {loading && <Spinner size="sm" className="text-current" />}
                                {!loading ? 'Réinitialiser le mot de passe' : 'Réinitialisation...'}
                            </Button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
