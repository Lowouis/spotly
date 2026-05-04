'use client';

import React, {useState} from 'react';
import NextLink from 'next/link';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Spinner} from '@/components/ui/spinner';
import DarkModeSwitch from '@/components/actions/DarkModeSwitch';

export default function ForgotPasswordPage() {
    const [identifier, setIdentifier] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/password-reset/request', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({identifier}),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) throw new Error(data.message || 'Demande impossible pour le moment.');
            setMessage(data.message || 'Si un compte interne existe, un email de récupération va être envoyé.');
        } catch (e) {
            setError(e.message || 'Demande impossible pour le moment.');
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
                        <h1 className="mb-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Mot de passe oublié</h1>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">Saisissez l&apos;email ou l&apos;identifiant de votre compte interne Spotly.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email ou identifiant</label>
                            <Input
                                value={identifier}
                                onChange={(event) => setIdentifier(event.target.value)}
                                placeholder="prenom.nom@example.com"
                                autoComplete="username"
                                className="h-11 border-neutral-300 bg-transparent text-sm dark:border-neutral-600 dark:text-neutral-200"
                            />
                        </div>

                        {message && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">{message}</p>}
                        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}

                        <Button type="submit" disabled={loading} className="h-11 w-full bg-neutral-900 font-medium text-white transition-colors duration-200 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200">
                            {loading && <Spinner size="sm" className="text-current" />}
                            {!loading ? 'Envoyer le lien sécurisé' : 'Envoi en cours...'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <NextLink href="/login" className="text-sm font-medium text-neutral-700 hover:underline dark:text-neutral-300">Retour à la connexion</NextLink>
                    </div>
                </div>
            </main>
        </div>
    );
}
