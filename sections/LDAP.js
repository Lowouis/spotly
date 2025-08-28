'use client';

import {Card, CardBody, CardHeader, Divider} from "@heroui/react";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import React, {useEffect, useState} from "react";
import {ArrowPathIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {addToast} from "@heroui/toast";
import {useConfigStatus} from "@/context/ConfigStatusContext";

const LDAP = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const {updateConfigStatus} = useConfigStatus();

    const [formData, setFormData] = useState({
        serverUrl: "",
        bindDn: "",
        adminCn: "",
        adminDn: "",
        adminPassword: "",
        emailDomain: "",
    });

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/ldap/ldap-config`);

                if (response.ok) {
                    const data = await response.json();

                    setFormData(prev => ({
                        ...prev,
                        serverUrl: data.serverUrl || "",
                        bindDn: data.bindDn || "",
                        adminCn: data.adminCn || "",
                        adminDn: data.adminDn || "",
                        emailDomain: data.emailDomain || "",
                        adminPassword: "", // Ne pas pré-remplir le mot de passe
                    }));

                    // Si on a des données, on considère qu'il y a une config
                    if (data.serverUrl && data.bindDn && data.adminCn && data.adminDn) {
                        updateConfigStatus('ldap', 'error'); // Par défaut en erreur jusqu'au test
                    } else {
                        updateConfigStatus('ldap', 'none');
                    }
                } else {
                    // Pas de configuration existante, c'est normal pour une première utilisation
                    updateConfigStatus('ldap', 'none');
                }
            } catch (error) {
                // Erreur de connexion, on continue avec les champs vides
                updateConfigStatus('ldap', 'none');
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setErrorMessage(null);
        setConnectionStatus(null);
    };

    const validateForm = () => {
        if (!formData.serverUrl || !formData.bindDn || !formData.adminCn || !formData.adminDn || !formData.adminPassword) {
            setErrorMessage("Tous les champs sont obligatoires");
            return false;
        }
        return true;
    };

    const testConnection = async () => {
        if (!validateForm()) return;

        setIsTesting(true);
        setConnectionStatus(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/ldap/test-ldap-connection`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setConnectionStatus('success');
                updateConfigStatus('ldap', 'success');
                addToast({
                    title: 'Test de connexion',
                    description: 'Connexion LDAP réussie',
                    color: 'success',
                    duration: 5000,
                });
            } else {
                setConnectionStatus('error');
                updateConfigStatus('ldap', 'error');
                throw new Error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            setConnectionStatus('error');
            updateConfigStatus('ldap', 'error');
            addToast({
                title: 'Test de connexion',
                description: error.message || 'Erreur lors du test de connexion',
                color: 'danger',
                duration: 5000,
            });
        } finally {
            setIsTesting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/ldap/save-ldap-config`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }

            addToast({
                title: 'Configuration LDAP',
                description: 'Configuration sauvegardée avec succès',
                color: 'success',
                duration: 5000,
            });
            // Après sauvegarde, on considère que la config est en erreur jusqu'au test
            updateConfigStatus('ldap', 'error');
        } catch (error) {
            addToast({
                title: 'Configuration LDAP',
                description: error.message || 'Erreur lors de la sauvegarde',
                color: 'danger',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="w-full ">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl font-semibold">Configuration LDAP</p>
                        <p className="text-small text-default-500">Configurez votre serveur LDAP pour
                            l'authentification</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            required
                            name="serverUrl"
                            label="URL du serveur LDAP"
                            labelPlacement="outside"
                            placeholder="ldap://example.com"
                            value={formData.serverUrl}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.serverUrl}
                            errorMessage={errorMessage && !formData.serverUrl ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="bindDn"
                            label="Base DN"
                            labelPlacement="outside"
                            placeholder="dc=example,dc=com"
                            value={formData.bindDn}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.bindDn}
                            errorMessage={errorMessage && !formData.bindDn ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="adminCn"
                            label="Nom d'utilisateur administrateur"
                            labelPlacement="outside"
                            placeholder="cn=admin"
                            value={formData.adminCn}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.adminCn}
                            errorMessage={errorMessage && !formData.adminCn ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="adminDn"
                            label="DN de l'administrateur"
                            labelPlacement="outside"
                            placeholder="cn=admin,dc=example,dc=com"
                            value={formData.adminDn}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.adminDn}
                            errorMessage={errorMessage && !formData.adminDn ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            name="emailDomain"
                            label="Domaine de messagerie"
                            labelPlacement="outside"
                            placeholder="example.com"
                            value={formData.emailDomain}
                            onChange={handleInputChange}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="adminPassword"
                            label="Mot de passe administrateur"
                            labelPlacement="outside"
                            type={isVisible ? "text" : "password"}
                            value={formData.adminPassword}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            isInvalid={!!errorMessage && !formData.adminPassword}
                            errorMessage={errorMessage && !formData.adminPassword ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                            endContent={
                                <Button
                                    type="button"
                                    isIconOnly
                                    radius="full"
                                    variant="light"
                                    onPress={() => setIsVisible(!isVisible)}
                                    aria-label={isVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                                    isDisabled={isLoadingConfig}
                                >
                                    {isVisible ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </Button>
                            }
                        />

                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                color="default"
                                variant="flat"
                                onPress={testConnection}
                                isLoading={isTesting}
                                isDisabled={isLoadingConfig}
                                startContent={!isTesting && connectionStatus === 'success' ?
                                    <CheckCircleIcon className="h-5 w-5 text-success"/> :
                                    !isTesting && connectionStatus === 'error' ?
                                        <XCircleIcon className="h-5 w-5 text-danger"/> : null}
                            >
                                {isTesting ? "Test en cours..." :
                                    connectionStatus === 'success' ? "Connexion réussie" :
                                        connectionStatus === 'error' ? "Échec de connexion" : "Tester la connexion"}
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                variant="flat"
                                isLoading={isLoading}
                                isDisabled={isLoadingConfig}
                                startContent={!isLoading && <ArrowPathIcon className="h-5 w-5"/>}
                            >
                                Sauvegarder
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default LDAP;