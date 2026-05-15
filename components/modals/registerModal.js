'use client';

import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import {useMutation} from "@tanstack/react-query";
import {addToast} from "@/lib/toast";
import NextLink from "next/link";
import {CheckCircleIcon, EyeIcon, EyeSlashIcon, XCircleIcon} from "@heroicons/react/24/outline";

const PASSWORD_RULES = [
    {id: 'length', label: '12 caractères minimum', test: (value) => value.length >= 12},
    {id: 'lowercase', label: 'Une minuscule', test: (value) => /[a-z]/.test(value)},
    {id: 'uppercase', label: 'Une majuscule', test: (value) => /[A-Z]/.test(value)},
    {id: 'number', label: 'Un chiffre', test: (value) => /[0-9]/.test(value)},
    {id: 'special', label: 'Un caractère spécial', test: (value) => /[^A-Za-z0-9]/.test(value)},
];

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function getPasswordChecks(password) {
    return PASSWORD_RULES.map(rule => ({...rule, valid: rule.test(password)}));
}

export function PasswordStrength({password}) {
    const checks = getPasswordChecks(password);
    const validCount = checks.filter(check => check.valid).length;
    const percent = Math.round((validCount / checks.length) * 100);
    const label = validCount <= 2 ? 'Faible' : validCount < checks.length ? 'Correct' : 'Robuste';
    const barColor = validCount <= 2 ? 'bg-red-500' : validCount < checks.length ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800/60">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
                <span className="text-neutral-600 dark:text-neutral-400">Robustesse du mot de passe</span>
                <span className="text-neutral-900 dark:text-neutral-100">{label}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                <div className={`${barColor} h-full rounded-full transition-all duration-300`} style={{width: `${percent}%`}} />
            </div>
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                {checks.map(check => (
                    <div key={check.id} className={check.valid ? 'flex items-center gap-2 text-emerald-700 dark:text-emerald-300' : 'flex items-center gap-2 text-neutral-500 dark:text-neutral-400'}>
                        {check.valid ? <CheckCircleIcon className="h-4 w-4" /> : <XCircleIcon className="h-4 w-4" />}
                        <span>{check.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export async function createUser(userData) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        addToast({
            title: "Erreur",
            description: data.message || "Une erreur est survenue lors de la création de votre compte",
            type: "error",
        });
        throw new Error(data.message || 'Failed to create user');
    }

    return data;
}

export function RegisterModal({}) {
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [visiblePasswords, setVisiblePasswords] = useState({password: false, confirmPassword: false});
    const [availability, setAvailability] = useState({username: 'idle', email: 'idle'});
    const [creditentials, setCreditentials] = useState([
        {
            "label": "Nom d'utilisateur",
            "name": "username",
            "value": "",
            "type": "text"
        },
        {
            "label": "Prénom",
            "name": "name",
            "value": "",
            "type": "text"
        },
        {
            "label": "Nom",
            "name": "surname",
            "value": "",
            "type": "text"
        },
        {
            "label": "Email",
            "name": "email",
            "value": "",
            "type": "email"
        },
        {
            "label": "Mot de passe",
            "name": "password",
            "value": "",
            "type": "password"
        },
        {
            "label": "Confirmation du mot de passe",
            "name": "confirmPassword",
            "value": "",
            "type": "password"
        }
    ]);

    const mutation = useMutation({
        mutationFn: createUser,
        onError: () => {
            addToast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la création de votre compte",
                type: "error",
            })
            setConnectionLoading(false);
        },
        onSuccess: (data) => {
            setConnectionLoading(false);
            setCreditentials(creditentials.map(cred => ({...cred, value: ""})));
            window.location.href = "/login" + window.location.search;
            addToast({
                title: "Succès",
                description: data.message || "Votre compte a été créé avec succès",
                type: "success",
            });
        }
    });

    const username = creditentials.find(cred => cred.name === 'username')?.value.trim() || '';
    const email = creditentials.find(cred => cred.name === 'email')?.value.trim() || '';
    const isEmailFormatValid = EMAIL_REGEX.test(email);
    const canSubmit = !connectionLoading && availability.username === 'available' && availability.email === 'available' && isEmailFormatValid;

    useEffect(() => {
        let cancelled = false;
        const timeout = setTimeout(async () => {
            const nextAvailability = {};

            if (username.length < 2) nextAvailability.username = 'idle';
            else nextAvailability.username = 'checking';

            if (!email || !EMAIL_REGEX.test(email)) nextAvailability.email = 'idle';
            else nextAvailability.email = 'checking';

            setAvailability((current) => ({...current, ...nextAvailability}));

            const params = new URLSearchParams();
            if (nextAvailability.username === 'checking') params.set('username', username);
            if (nextAvailability.email === 'checking') params.set('email', email);
            if (!params.toString()) return;

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/auth/register-availability?${params.toString()}`);
                const data = await response.json().catch(() => ({}));
                if (cancelled || !response.ok) return;

                setAvailability((current) => ({
                    ...current,
                    ...(data.username && {username: data.username.available ? 'available' : 'taken'}),
                    ...(data.email && {email: data.email.available ? 'available' : 'taken'}),
                }));
            } catch {
                if (!cancelled) {
                    setAvailability((current) => ({
                        ...current,
                        ...(nextAvailability.username === 'checking' && {username: 'idle'}),
                        ...(nextAvailability.email === 'checking' && {email: 'idle'}),
                    }));
                }
            }
        }, 350);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [email, username]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setConnectionLoading(true);

        const userData = creditentials.reduce((acc, cred) => {
            acc[cred.name] = cred.value;
            return acc;
        }, {});

        if (availability.username !== 'available' || availability.email !== 'available') {
            addToast({
                title: "Compte indisponible",
                description: "Le nom d'utilisateur et l'email doivent être disponibles",
                type: "error",
            });
            setConnectionLoading(false);
            return;
        }

        if (!EMAIL_REGEX.test(userData.email)) {
            addToast({
                title: "Email invalide",
                description: "Veuillez saisir une adresse email valide",
                type: "error",
            });
            setConnectionLoading(false);
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            addToast({
                title: "Erreur",
                description: "Les mots de passe ne correspondent pas",
                type: "error",
            });
            setConnectionLoading(false);
            return;
        }

        if (getPasswordChecks(userData.password).some(check => !check.valid)) {
            addToast({
                title: "Mot de passe insuffisant",
                description: "Veuillez respecter toutes les règles de sécurité du mot de passe",
                type: "error",
            });
            setConnectionLoading(false);
            return;
        }

        mutation.mutate(userData);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {/* En-tête avec titre */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Créer un compte
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Rejoignez notre plateforme de gestion de ressources
                </p>
            </div>

            {/* Container principal avec bordure subtile */}
            <div
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Champs de formulaire */}
                    <div className="space-y-4">
                        {creditentials.map((input, index) => (
                            <div key={index} className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    {input.label}
                                </label>
                                <div className="relative">
                                    <Input
                                        type={input.type === 'password' && visiblePasswords[input.name] ? 'text' : input.type}
                                        placeholder={`Entrer votre ${input.label.toLowerCase()}`}
                                        required={true}
                                        name={input.name}
                                        value={input.value}
                                        className="h-11 bg-transparent border-neutral-300 pr-10 text-sm dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
                                        onChange={(e) => {
                                            const newCreditentials = [...creditentials];
                                            newCreditentials[index].value = e.target.value;
                                            setCreditentials(newCreditentials);
                                            if (input.name === 'username' || input.name === 'email') {
                                                setAvailability((current) => ({...current, [input.name]: 'idle'}));
                                            }
                                        }}
                                    />
                                    {input.type === 'password' && (
                                        <button
                                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                            type="button"
                                            onClick={() => setVisiblePasswords(prev => ({...prev, [input.name]: !prev[input.name]}))}
                                            aria-label={visiblePasswords[input.name] ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                        >
                                            {visiblePasswords[input.name] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                        </button>
                                    )}
                                    {(input.name === 'username' || input.name === 'email') && input.value.trim() && availability[input.name] !== 'idle' && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2">
                                            {availability[input.name] === 'checking' ? <Spinner size="sm" /> : availability[input.name] === 'available' ? <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> : <XCircleIcon className="h-5 w-5 text-red-500" />}
                                        </span>
                                    )}
                                </div>
                                {input.name === 'username' && availability.username === 'taken' && <p className="text-sm text-red-500">Ce nom d&apos;utilisateur est déjà utilisé</p>}
                                {input.name === 'email' && input.value.trim() && !EMAIL_REGEX.test(input.value.trim()) && <p className="text-sm text-red-500">Format d&apos;email invalide</p>}
                                {input.name === 'email' && availability.email === 'taken' && <p className="text-sm text-red-500">Cet email est déjà utilisé</p>}
                                {input.name === "password" && <PasswordStrength password={input.value} />}
                                {input.name === "confirmPassword" && input.value && input.value !== creditentials.find(cred => cred.name === "password").value && (
                                    <p className="text-sm text-red-500">Les mots de passe ne correspondent pas</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Bouton de création de compte */}
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="h-11 w-full font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
                    >
                        {connectionLoading && <Spinner size="sm" className="text-current"/>}
                        {!connectionLoading ? "Créer mon compte" : "Création en cours..."}
                    </Button>

                    {/* Lien vers la connexion */}
                    <div className="text-center pt-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Vous avez déjà un compte ?{" "}
                            <NextLink
                                href="/login"
                                className="text-sm text-neutral-900 dark:text-neutral-100 font-medium hover:underline transition-all duration-200"
                            >
                                Se connecter
                            </NextLink>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
