'use client';

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import React, {useEffect, useState} from "react";
import {ArrowPathIcon, CheckCircleIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {addToast} from "@/lib/toast";
import {useConfigStatus} from "@/features/shared/context/ConfigStatusContext";

const AdminField = ({label, error, children}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
);

const SMTPSettings = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const {updateConfigStatus, refreshConfigStatuses} = useConfigStatus();

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

                }
            } catch (error) {
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadConfig();
    }, [updateConfigStatus]);

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
                updateConfigStatus('smtp', 'success');
                addToast({
                    title: 'Test de connexion',
                    description: 'Connexion SMTP réussie',
                    color: 'success',
                    duration: 5000,
                });
            } else {
                setConnectionStatus('error');
                updateConfigStatus('smtp', 'error');
                throw new Error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            setConnectionStatus('error');
            updateConfigStatus('smtp', 'error');
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
            await refreshConfigStatuses();
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
                        <p className="text-sm text-muted-foreground">Configurez votre serveur SMTP pour l&apos;envoi
                            d&apos;emails</p>
                    </div>
                </CardHeader>
                <CardContent className="border-t pt-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <AdminField label="Serveur SMTP" error={errorMessage && !formData.host ? "Ce champ est requis" : ""}>
                                <Input required name="host" placeholder="smtp.example.com" value={formData.host} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>

                            <AdminField label="Port" error={errorMessage && !formData.port ? "Ce champ est requis" : ""}>
                                <Input required name="port" placeholder="587" value={formData.port} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AdminField label="Nom d'utilisateur" error={errorMessage && !formData.username ? "Ce champ est requis" : ""}>
                                <Input required name="username" placeholder="user@example.com" value={formData.username} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>

                            <AdminField label="Mot de passe" error={errorMessage && !formData.password ? "Ce champ est requis" : ""}>
                                <Input required type="password" name="password" placeholder="Mot de passe" value={formData.password} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <AdminField label="Email d'expédition" error={errorMessage && !formData.fromEmail ? "Ce champ est requis" : ""}>
                                <Input required name="fromEmail" placeholder="noreply@example.com" value={formData.fromEmail} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>

                            <AdminField label="Nom d'expédition" error={errorMessage && !formData.fromName ? "Ce champ est requis" : ""}>
                                <Input required name="fromName" placeholder="Spotly" value={formData.fromName} onChange={handleInputChange} disabled={isLoadingConfig}/>
                            </AdminField>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 text-sm font-medium">
                                <input
                                    type="checkbox"
                                    name="secure"
                                    checked={formData.secure}
                                    disabled={isLoadingConfig}
                                    onChange={(event) => {
                                    const checked = event.target.checked;
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
                                    className="h-4 w-4 rounded border-neutral-300"
                                />
                                Connexion sécurisée (TLS/SSL)
                            </label>
                        </div>

                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={testConnection}
                                disabled={isLoadingConfig || isTesting}
                            >
                                {!isTesting && connectionStatus === 'success' ?
                                    <CheckCircleIcon className="h-5 w-5 text-green-500"/> :
                                    !isTesting && connectionStatus === 'error' ?
                                        <XCircleIcon className="h-5 w-5 text-red-500"/> : null}
                                {isTesting ? "Test en cours..." :
                                    connectionStatus === 'success' ? "Connexion réussie" :
                                        connectionStatus === 'error' ? "Échec de connexion" : "Tester la connexion"}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoadingConfig || isLoading}
                            >
                                {!isLoading && <ArrowPathIcon className="h-5 w-5"/>}
                                Sauvegarder
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SMTPSettings;
