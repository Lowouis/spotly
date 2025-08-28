'use client';

import React, {useEffect, useState} from "react";
import {Button, Form, Input, Link} from "@heroui/react";
import NextLink from "next/link";
import {signIn} from "next-auth/react";
import {useRouter} from 'next/navigation';
import {addToast} from "@heroui/toast";
import {EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";

export default function LoginTab() {
    const router = useRouter();
    const [connectionLoading, setConnectionLoading] = useState(false);
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
    const handleSubmit = async () => {
        const result = await signIn('credentials', {
            redirect: false,
            username: creditentials[0].value,
            password: creditentials[1].value,
            callbackUrl: window.location.origin + window.location.pathname.replace('/login', '') + window.location.search
        });

        if (result.ok) {
            // Utiliser l'URL de callback fournie par NextAuth
            router.push(result.url);
        } else if (result.status === 401) {
            setWrongCredentials(true);
            setConnectionLoading(false);
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
        <Form className="space-y-5">
            {/* Champs de connexion */}
            <div className="space-y-4 w-full">
                {creditentials.map((input, index) => (
                    <div key={index} className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {input.label}
                        </label>
                        <Input
                            type={input.name === 'password' ? (isPasswordVisible ? 'text' : 'password') : input.type}
                            placeholder={`Entrer votre ${input.label.toLowerCase()}`}
                            radius="md"
                            size="md"
                            variant="bordered"
                            classNames={{
                                input: "text-sm",
                                inputWrapper: "h-11 bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200"
                            }}
                            onChange={(e) => handleChange(e, index)}
                            endContent={
                                input.name === 'password' && (
                                    <button
                                        className="focus:outline-none p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
                                        type="button"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                    >
                                        {isPasswordVisible ? (
                                            <EyeSlashIcon className="h-4 w-4 text-neutral-500"/>
                                        ) : (
                                            <EyeIcon className="h-4 w-4 text-neutral-500"/>
                                        )}
                                    </button>
                                )
                            }
                        />
                    </div>
                ))}
            </div>

            {/* Bouton de connexion */}
            <Button
                type="submit"
                fullWidth
                onPress={async () => {
                    setConnectionLoading(true);
                    await handleSubmit();
                }}
                color="default"
                isLoading={connectionLoading}
                size="md"
                radius="md"
                className="h-11 font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
            >
                {!connectionLoading ? "Se connecter" : "Connexion en cours..."}
            </Button>

            {/* Lien vers l'inscription */}
            <div className="text-center pt-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Vous n&apos;avez pas de compte ?{" "}
                    <Link
                        as={NextLink}
                        href="/register"
                        className="text-sm text-neutral-900 dark:text-neutral-100 font-medium hover:underline transition-all duration-200"
                    >
                        Créer un compte
                    </Link>
                </p>
            </div>
        </Form>
    );
}