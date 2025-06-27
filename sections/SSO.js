'use client';

import {Spacer, Card, CardBody, CardHeader, Divider} from "@nextui-org/react";
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import React, {useEffect, useState} from "react";
import {ArrowPathIcon, CheckCircleIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {addToast} from "@heroui/toast";

const SSO = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);

    const [formData, setFormData] = useState({
        realm: "",
        kdc: "",
        adminServer: "",
        defaultDomain: "",
        serviceHost: "",
        keytabPath: "",
    });

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoadingConfig(true);
            try {
                console.log("Chargement de la configuration SSO...");
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/public/kerberos-config`);
                console.log("Réponse du serveur:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("Configuration reçue:", data);

                    setFormData(prev => ({
                        ...prev,
                        realm: data.realm || "",
                        kdc: data.kdc || "",
                        adminServer: data.adminServer || "",
                        defaultDomain: data.defaultDomain || "",
                        serviceHost: data.serviceHost || "",
                        keytabPath: data.keytabPath || "",
                    }));
                } else {
                    const errorData = await response.json();
                    console.error("Erreur lors du chargement:", errorData);
                    addToast({
                        title: 'Chargement de la configuration',
                        description: errorData.message || 'Erreur lors du chargement de la configuration',
                        color: 'danger',
                        duration: 5000,
                    });
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la configuration:", error);
                addToast({
                    title: 'Chargement de la configuration',
                    description: 'Erreur lors du chargement de la configuration',
                    color: 'danger',
                    duration: 5000,
                });
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    const handleInputChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setErrorMessage(null);
        setConnectionStatus(null);
    };

    const validateForm = () => {
        if (!formData.realm || !formData.kdc || !formData.adminServer || !formData.defaultDomain || !formData.serviceHost || !formData.keytabPath) {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/sso/test-kerberos-connection`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setConnectionStatus('success');
                addToast({
                    title: 'Test de connexion',
                    description: 'Connexion SSO réussie',
                    color: 'success',
                    duration: 5000,
                });
            } else {
                setConnectionStatus('error');
                throw new Error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            setConnectionStatus('error');
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/sso/save-kerberos-config`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }

            addToast({
                title: 'Configuration SSO',
                description: 'Configuration sauvegardée avec succès',
                color: 'success',
                duration: 5000,
            });
        } catch (error) {
            addToast({
                title: 'Configuration SSO',
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
            <Card className="w-full">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl font-semibold">Configuration SSO (Kerberos)</p>
                        <p className="text-small text-default-500">Configurez votre serveur Kerberos pour
                            l'authentification SSO</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <Input
                            required
                            name="realm"
                            label="Realm Kerberos"
                            labelPlacement="outside"
                            placeholder="EXAMPLE.COM"
                            value={formData.realm}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.realm}
                            errorMessage={errorMessage && !formData.realm ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="kdc"
                            label="Serveur KDC"
                            labelPlacement="outside"
                            placeholder="kdc.example.com:88"
                            value={formData.kdc}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.kdc}
                            errorMessage={errorMessage && !formData.kdc ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="adminServer"
                            label="Serveur Admin"
                            labelPlacement="outside"
                            placeholder="admin.example.com:749"
                            value={formData.adminServer}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.adminServer}
                            errorMessage={errorMessage && !formData.adminServer ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="defaultDomain"
                            label="Domaine par défaut"
                            labelPlacement="outside"
                            placeholder="example.com"
                            value={formData.defaultDomain}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.defaultDomain}
                            errorMessage={errorMessage && !formData.defaultDomain ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="serviceHost"
                            label="Nom d'hôte du service HTTP"
                            labelPlacement="outside"
                            placeholder="sso.intranet.fhm.local"
                            value={formData.serviceHost}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.serviceHost}
                            errorMessage={errorMessage && !formData.serviceHost ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
                        />

                        <Input
                            required
                            name="keytabPath"
                            label="Chemin du fichier keytab"
                            labelPlacement="outside"
                            placeholder="/etc/apache2/fhm.keytab"
                            value={formData.keytabPath}
                            onChange={handleInputChange}
                            isInvalid={!!errorMessage && !formData.keytabPath}
                            errorMessage={errorMessage && !formData.keytabPath ? "Ce champ est requis" : ""}
                            isDisabled={isLoadingConfig}
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

export default SSO; 