'use client';

import {Alert, Spacer, Spinner} from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import React, { useState, useEffect } from "react";
import {ArrowPathIcon, EyeIcon, EyeSlashIcon, CheckIcon} from "@heroicons/react/24/outline";
import {addToast} from "@heroui/toast";

const LDAP = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [formData, setFormData] = useState({
        serverUrl: "",
        bindDn: "",
        adminCn: "",
        adminPassword: "",
    });

    useEffect(() => {
        // Chargement sécurisé des variables d'environnement
        setFormData({
            serverUrl: process.env.NEXT_PUBLIC_LDAP_DOMAIN || "",
            bindDn: process.env.NEXT_PUBLIC_LDAP_BASEDN || "",
            adminCn: process.env.NEXT_PUBLIC_LDAP_ADMIN_DN || "",
            adminPassword: "", // Ne pas pré-remplir le mot de passe pour des raisons de sécurité
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        // Reset des messages d'erreur lors de la modification
        if (errorMessage) setErrorMessage(null);
    };

    const validateForm = () => {
        if (!formData.serverUrl || !formData.bindDn || !formData.adminCn) {
            setErrorMessage("Tous les champs obligatoires doivent être remplis");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/save-ldap-config`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                addToast({
                    title: 'Configuration LDAP',
                    description: 'Erreur lors de la sauvegarde',
                    color: 'danger',
                    duration: 5000,
                    variant: "flat"
                })
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }
            addToast({
                title: 'Configuration LDAP',
                description: 'Configuration sauvegardée avec succès',
                color: 'success',
                duration: 5000,
                variant: "flat"
            })

        } catch (error) {
            console.error('Erreur:', error);
            setErrorMessage(error.message || "Une erreur est survenue");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex bg-neutral-200 dark:bg-neutral-900 flex-col p-6 rounded-lg shadow-sm h-full w-full space-y-2 justify-start items-start">
            <h2 className="text-xl font-semibold p-4">Configuration LDAP</h2>
            <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4 p-4">
                <div className="flex-1">
                    <Input
                        required
                        name="serverUrl"
                        label="URL du serveur LDAP"
                        labelPlacement="outside"
                        placeholder="ldap://example.com"
                        value={formData.serverUrl}
                        onChange={handleInputChange}
                        isInvalid={!!errorMessage && !formData.serverUrl}
                    />
                </div>

                <div>
                    <Input
                        required
                        name="bindDn"
                        label="Bind Distinguished Name"
                        labelPlacement="outside"
                        placeholder="cn=admin,dc=example,dc=com"
                        value={formData.bindDn}
                        onChange={handleInputChange}
                        isInvalid={!!errorMessage && !formData.bindDn}
                    />
                </div>


                <div>

                    <Input
                        required
                        name="adminCn"
                        label={"Nom commun de l'administrateur LDAP"}
                        labelPlacement="outside"
                        value={formData.adminCn}
                        onChange={handleInputChange}
                        isInvalid={!!errorMessage && !formData.adminCn}
                    />
                </div>


                <div>
                    <Input
                        required
                        name="adminPassword"
                        label={"Mot de passe administrateur LDAP"}
                        labelPlacement={"outside"}
                        type={isVisible ? "text" : "password"}
                        value={formData.adminPassword}
                        onChange={handleInputChange}
                        placeholder="Mot de passe"
                        endContent={
                            <Button
                                type="button"
                                isIconOnly
                                radius="full"
                                variant="flat"
                                onPress={() => {
                                    setIsVisible(!isVisible)
                                }}
                                aria-label={isVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                            >
                                {isVisible ? (
                                    <EyeSlashIcon className="h-5 w-5 "/>
                                ) : (
                                    <EyeIcon className="h-5 w-5"/>
                                )}
                            </Button>
                        }
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <Button
                        color={"default"}
                        type="button"
                        variant="flat"
                    >
                        Tester la connexion
                        </Button>
                    <Button
                        type="submit"
                        color="primary"
                        variant="flat"
                        isLoading={isLoading}
                        startContent={!isLoading && <ArrowPathIcon className="h-5 w-5"/>}
                    >
                        Mettre à jour
                    </Button>
                </div>
            </form>

            <Spacer y={4}/>

            <div className="w-full mx-auto space-y-4">
                <h2 className="text-xl font-semibold p-4">Configuration avancée des permissions LDAP</h2>

                <div className="mt-4 p-4 bg-content1 rounded-lg">
                    <p className="text-sm text-default-500">
                        Fonctionnalité en cours de développement...
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LDAP;