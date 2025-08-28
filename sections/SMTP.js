'use client';

import {Card, CardBody, CardHeader, Divider, Switch} from "@heroui/react";
import {Input} from "@heroui/input";
import {Button} from "@heroui/button";
import React, {useEffect, useState} from "react";
import {ArrowPathIcon, CheckCircleIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {addToast} from "@heroui/toast";
import {useConfigStatus} from "@/context/ConfigStatusContext";

const SMTPSettings = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const {updateConfigStatus} = useConfigStatus();

    const [formData, setFormData] = useState({
        host: "",
        port: "",
        username: "",
        password: "",
        fromEmail: "",
        fromName: "",
        secure: false
    });

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/smtp/config`);

                if (response.ok) {
                    const data = await response.json();

                    setFormData(prev => ({
                        ...prev,
                        host: data.host || "",
                        port: data.port || "",
                        username: data.username || "",
                        fromEmail: data.fromEmail || "",
                        fromName: data.fromName || "",
                        secure: data.secure ?? true
                    }));

                    // Si on a des données, on considère qu'il y a une config
                    if (data.host && data.port && data.username) {
                        updateConfigStatus('smtp', 'valid'); // Config enregistrée = valide
                    } else {
                        updateConfigStatus('smtp', 'none');
                    }
                } else {
                    // Pas de configuration existante, c'est normal pour une première utilisation
                    updateConfigStatus('smtp', 'none');
                }
            } catch (error) {
                // Erreur de connexion, on continue avec les champs vides
                updateConfigStatus('smtp', 'none');
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, []);

    const handleInputChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setErrorMessage(null);
        setConnectionStatus(null);
    };

    const validateForm = () => {
        if (!formData.host || !formData.port || !formData.username || !formData.fromEmail || !formData.fromName) {
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/smtp/test`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                setConnectionStatus('success');
                updateConfigStatus('smtp', 'valid');
                addToast({
                    title: 'Test de connexion',
                    description: 'Connexion SMTP réussie',
                    color: 'success',
                    duration: 5000,
                });
            } else {
                setConnectionStatus('error');
                updateConfigStatus('smtp', 'valid'); // Config reste valide même si le test échoue
                throw new Error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            setConnectionStatus('error');
            updateConfigStatus('smtp', 'valid'); // Config reste valide même si le test échoue
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
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/smtp/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de la sauvegarde');
            }

            addToast({
                title: 'Configuration SMTP',
                description: 'Configuration sauvegardée avec succès',
                color: 'success',
                duration: 5000,
            });
            // Après sauvegarde, la config est maintenant valide
            updateConfigStatus('smtp', 'valid');
        } catch (error) {
            addToast({
                title: 'Configuration SMTP',
                description: error.message || 'Erreur lors de la sauvegarde',
                color: 'danger',
                duration: 5000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="w-full">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl font-semibold">Configuration SMTP</p>
                        <p className="text-small text-default-500">Configurez votre serveur SMTP pour l&apos;envoi
                            d&apos;emails</p>
                    </div>
                </CardHeader>
                <Divider/>
                <CardBody>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                isRequired
                                name="host"
                                label="Serveur SMTP"
                                labelPlacement="outside"
                                placeholder="smtp.example.com"
                                value={formData.host}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.host}
                                errorMessage={errorMessage && !formData.host ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />

                            <Input
                                isRequired
                                name="port"
                                label="Port"
                                labelPlacement="outside"
                                placeholder="587"
                                value={formData.port}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.port}
                                errorMessage={errorMessage && !formData.port ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                required
                                name="username"
                                label="Nom d'utilisateur"
                                labelPlacement="outside"
                                placeholder="user@example.com"
                                value={formData.username}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.username}
                                errorMessage={errorMessage && !formData.username ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />

                            <Input
                                isRequired
                                type="password"
                                name="password"
                                label="Mot de passe"
                                labelPlacement="outside"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.password}
                                errorMessage={errorMessage && !formData.password ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                isRequired
                                name="fromEmail"
                                label="Email d'expédition"
                                labelPlacement="outside"
                                placeholder="noreply@example.com"
                                value={formData.fromEmail}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.fromEmail}
                                errorMessage={errorMessage && !formData.fromEmail ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />

                            <Input
                                isRequired
                                name="fromName"
                                label="Nom d'expédition"
                                labelPlacement="outside"
                                placeholder="Spotly"
                                value={formData.fromName}
                                onChange={handleInputChange}
                                isInvalid={!!errorMessage && !formData.fromName}
                                errorMessage={errorMessage && !formData.fromName ? "Ce champ est requis" : ""}
                                isDisabled={isLoadingConfig}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Switch
                                isSelected={formData.secure}
                                onValueChange={(checked) => {
                                    if( checked && formData.port !== "465" ) {
                                        addToast({
                                            title: 'Connexion sécurisée',
                                            description: 'Pour une connexion sécurisée, le port doit être 465.',
                                            color: 'warning',
                                            duration: 5000,
                                        });
                                        return;
                                    }
                                    setFormData(prev => ({...prev, secure: checked}))
                                }}
                                isDisabled={isLoadingConfig}
                                size="sm"
                            >
                                Connexion sécurisée (TLS/SSL)
                            </Switch>
                        </div>

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

export default SMTPSettings;
