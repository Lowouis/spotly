'use client';

import React, {useState} from "react";
import {Button, Input, Link} from "@heroui/react";
import {useMutation} from "@tanstack/react-query";
import {addToast} from "@heroui/toast";
import NextLink from "next/link";

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

    const handleSubmit = (e) => {
        e.preventDefault();
        setConnectionLoading(true);

        const userData = creditentials.reduce((acc, cred) => {
            acc[cred.name] = cred.value;
            return acc;
        }, {});

        if (userData.password !== userData.confirmPassword) {
            addToast({
                title: "Erreur",
                description: "Les mots de passe ne correspondent pas",
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
                                <Input
                                    type={input.type}
                                    placeholder={`Entrer votre ${input.label.toLowerCase()}`}
                                    radius="md"
                                    size="md"
                                    variant="bordered"
                                    isRequired={true}
                                    name={input.name}
                                    value={input.value}
                                    classNames={{
                                        input: "text-sm",
                                        inputWrapper: "h-11 bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200"
                                    }}
                                    onChange={(e) => {
                                        const newCreditentials = [...creditentials];
                                        newCreditentials[index].value = e.target.value;
                                        setCreditentials(newCreditentials);
                                    }}
                                    errorMessage={() => {
                                        if (input.type === "password" && input.value.length < 8) {
                                            return "Le mot de passe doit contenir au moins 8 caractères";
                                        } else if (input.name === "confirmPassword" && input.value !== creditentials.find(cred => cred.name === "password").value) {
                                            return "Les mots de passe ne correspondent pas";
                                        }
                                        return "";
                                    }}
                                    validate={() => {
                                        if (input.type === "password" && input.value.length < 8) {
                                            return false;
                                        } else if (input.name === "confirmPassword" && input.value !== creditentials.find(cred => cred.name === "password").value) {
                                            return false;
                                        }
                                        return true;
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Bouton de création de compte */}
                    <Button
                        type="submit"
                        fullWidth
                        color="default"
                        isLoading={connectionLoading}
                        size="md"
                        radius="md"
                        className="h-11 font-medium bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
                    >
                        {!connectionLoading ? "Créer mon compte" : "Création en cours..."}
                    </Button>

                    {/* Lien vers la connexion */}
                    <div className="text-center pt-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Vous avez déjà un compte ?{" "}
                            <Link
                                as={NextLink}
                                href="/login"
                                className="text-sm text-neutral-900 dark:text-neutral-100 font-medium hover:underline transition-all duration-200"
                            >
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}



