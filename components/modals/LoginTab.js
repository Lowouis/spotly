'use client';

import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Spinner} from "@/components/ui/spinner";
import NextLink from "next/link";
import {signIn} from "next-auth/react";
import {addToast} from "@/lib/toast";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";
import SnakeLogo from "@/components/utils/SnakeLogo";
import {useRouter} from "next/navigation";

export default function LoginTab() {
    const router = useRouter();
    const [connectionLoading, setConnectionLoading] = useState(false);
    const [showLoginTransition, setShowLoginTransition] = useState(false);
    const [wrongCredentials, setWrongCredentials] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [creditentials, setCreditentials] = useState([
        {
            "label": "Nom d'utilisateur",
            "name": "login",
            "value": "",
            "type": "text"
        },
        {
            "label": "Mot de passe",
            "name": "password",
            "value": "",
            "type": "password"
        }
    ]);

    // Copy the handlers and effects related to login
    const handleSubmit = async (event) => {
        event?.preventDefault();
        let didStartTransition = false;
        setConnectionLoading(true);

        try {
            const callbackUrl = window.location.origin + window.location.pathname.replace('/login', '') + window.location.search;
            const result = await signIn('credentials', {
                redirect: false,
                username: creditentials[0].value,
                password: creditentials[1].value,
                callbackUrl
            });

            if (result?.ok) {
                didStartTransition = true;
                setShowLoginTransition(true);
                setTimeout(() => {
                    router.replace(result.url || callbackUrl || '/');
                }, 1800);
                return;
            }

            setWrongCredentials(true);
        } catch (error) {
            setWrongCredentials(true);
            console.error('Login error:', error);
        } finally {
            if (!didStartTransition) setConnectionLoading(false);
        }
    };

    const handleChange = (e, index) => {
        const {name, value} = e.target;
        setCreditentials(prevState => {
            const newState = [...prevState];
            newState[index].value = value;
            return newState;
        });
    }

    useEffect(() => {
        if (wrongCredentials) {
            addToast({
                title: "Erreur d'authentification",
                description: "Nom d'utilisateur ou mot de passe incorrect",
                timeout: 5000,
                color: "danger"
            });
            setWrongCredentials(false);
        }
    }, [wrongCredentials, setWrongCredentials]);

    return (
        <>
        {showLoginTransition && <LoginTransition />}
        <form
            className="space-y-5"
            onSubmit={handleSubmit}
        >
            {/* Champs de connexion */}
            <div className="space-y-4 w-full">
                {creditentials.map((input, index) => (
                    <div key={index} className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {input.label}
                        </label>
                        <div className="relative">
                            <Input
                                type={input.name === 'password' ? (isPasswordVisible ? 'text' : 'password') : input.type}
                                placeholder={`Entrer votre ${input.label.toLowerCase()}`}
                                className="h-11 border-neutral-300 bg-transparent pr-10 text-sm dark:border-neutral-600 dark:text-neutral-200"
                                onChange={(e) => handleChange(e, index)}
                            />
                        {input.name === 'password' && (
                            <button
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                aria-label={isPasswordVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                {isPasswordVisible ? (
                                    <EyeSlashIcon className="h-4 w-4 text-neutral-500"/>
                                ) : (
                                    <EyeIcon className="h-4 w-4 text-neutral-500"/>
                                )}
                            </button>
                        )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bouton de connexion */}
            <Button
                type="submit"
                disabled={connectionLoading || showLoginTransition}
                className="h-11 w-full font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
            >
                {connectionLoading && <Spinner size="sm" className="text-current"/>}
                {!connectionLoading ? "Se connecter" : "Connexion en cours..."}
            </Button>

            <div className="text-center">
                <NextLink
                    href="/forgot-password"
                    className="text-sm font-medium text-neutral-700 transition-all duration-200 hover:underline dark:text-neutral-300"
                >
                    Mot de passe oublié ?
                </NextLink>
            </div>

            {/* Lien vers l'inscription */}
            <div className="text-center pt-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Vous n&apos;avez pas de compte ?{" "}
                    <NextLink
                        href="/register"
                        className="text-sm text-neutral-900 dark:text-neutral-100 font-medium hover:underline transition-all duration-200"
                    >
                        Créer un compte
                    </NextLink>
                </p>
            </div>
        </form>
        </>
    );
}

function LoginTransition() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background text-foreground">
            <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="login-transition-ring absolute inset-0 rounded-full border border-neutral-300 dark:border-neutral-700" />
                <SnakeLogo className="login-transition-logo h-20 w-20" title="Connexion à Spotly" />
            </div>
            <p className="login-transition-text mt-6 text-sm font-medium text-muted-foreground">
                Ouverture de votre espace...
            </p>
        </div>
    );
}
