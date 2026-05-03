'use client';

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
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

const SSO = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const [isLoadingConfig, setIsLoadingConfig] = useState(true);
    const {updateConfigStatus, refreshConfigStatuses} = useConfigStatus();

    const [formData, setFormData] = useState({
        realm: "",
        kdc: "",
        adminServer: "",
        defaultDomain: "",
        serviceHost: "",
        keytabPath: "",
        isActive: true,
    });

    useEffect(() => {
        const loadConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/sso/kerberos-config`);

                if (response.ok) {
                    const data = await response.json();

                    setFormData(prev => ({
                        ...prev,
                        realm: data.realm || "",
                        kdc: data.kdc || "",
                        adminServer: data.adminServer || "",
                        defaultDomain: data.defaultDomain || "",
                        serviceHost: data.serviceHost || "",
                        keytabPath: data.keytabPath || "",
                        isActive: data.isActive !== false,
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
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
        setErrorMessage(null);
        setConnectionStatus(null);
    };

    const handleActiveChange = (checked) => {
        setFormData(prev => ({...prev, isActive: checked}));
        setErrorMessage(null);
        setConnectionStatus(null);
        if (!checked) updateConfigStatus('sso', 'none');
    };

    const validateForm = () => {
        if (!formData.isActive) return true;

        if (!formData.realm || !formData.kdc || !formData.adminServer || !formData.defaultDomain || !formData.serviceHost || !formData.keytabPath) {
            setErrorMessage("Tous les champs sont obligatoires");
            return false;
        }
        return true;
    };

    const testConnection = async () => {
        if (!validateForm()) return;
        if (!formData.isActive) {
            addToast({
                title: 'Test de connexion',
                description: 'Activez le SSO Kerberos avant de tester la connexion',
                color: 'warning',
                duration: 5000,
            });
            return;
        }

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
                updateConfigStatus('sso', 'success');
                addToast({
                    title: 'Test de connexion',
                    description: 'Connexion SSO réussie',
                    color: 'success',
                    duration: 5000,
                });
            } else {
                setConnectionStatus('error');
                updateConfigStatus('sso', 'error');
                throw new Error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            setConnectionStatus('error');
            updateConfigStatus('sso', 'error');
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
            await refreshConfigStatuses();
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
                        <p className="text-xl font-semibold">Configuration SSO</p>
                        <p className="text-sm text-muted-foreground">Configurez votre serveur Kerberos pour
                            l&apos;authentification SSO</p>
                    </div>
                </CardHeader>
                <CardContent className="border-t pt-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-1">
                                <Label htmlFor="kerberos-active">Activer le SSO Kerberos</Label>
                                <p className="text-sm text-muted-foreground">Désactive les tentatives Kerberos et libère les ressources associées.</p>
                            </div>
                            <Switch id="kerberos-active" checked={formData.isActive} onCheckedChange={handleActiveChange} disabled={isLoadingConfig || isLoading}/>
                        </div>

                        {formData.isActive && (
                            <>
                                <AdminField label="Realm Kerberos" error={errorMessage && !formData.realm ? "Ce champ est requis" : ""}>
                                    <Input required name="realm" placeholder="EXAMPLE.COM" value={formData.realm} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>

                                <AdminField label="Serveur KDC" error={errorMessage && !formData.kdc ? "Ce champ est requis" : ""}>
                                    <Input required name="kdc" placeholder="kdc.example.com:88" value={formData.kdc} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>

                                <AdminField label="Serveur Admin" error={errorMessage && !formData.adminServer ? "Ce champ est requis" : ""}>
                                    <Input required name="adminServer" placeholder="admin.example.com:749" value={formData.adminServer} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>

                                <AdminField label="Domaine par défaut" error={errorMessage && !formData.defaultDomain ? "Ce champ est requis" : ""}>
                                    <Input required name="defaultDomain" placeholder="example.com" value={formData.defaultDomain} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>

                                <AdminField label="Nom d'hôte du service HTTP" error={errorMessage && !formData.serviceHost ? "Ce champ est requis" : ""}>
                                    <Input required name="serviceHost" placeholder="sso.intranet.fhm.local" value={formData.serviceHost} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>

                                <AdminField label="Chemin du fichier keytab" error={errorMessage && !formData.keytabPath ? "Ce champ est requis" : ""}>
                                    <Input required name="keytabPath" placeholder="/etc/apache2/filename.keytab" value={formData.keytabPath} onChange={handleInputChange} disabled={isLoadingConfig}/>
                                </AdminField>
                            </>
                        )}

                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={testConnection}
                                disabled={isLoadingConfig || isTesting || !formData.isActive}
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

export default SSO;
