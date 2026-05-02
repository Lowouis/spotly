'use client';

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import React, {useEffect, useState} from "react";
import {ArrowPathIcon, ArrowUpTrayIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon, XCircleIcon} from "@heroicons/react/24/outline";
import {addToast} from "@/lib/toast";
import {useConfigStatus} from "@/features/shared/context/ConfigStatusContext";

const AdminField = ({label, error, children}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        {children}
        {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
);

const LDAP = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
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
    }, [updateConfigStatus]);

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

    const importUsers = async () => {
        setIsImporting(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/ldap/import-users`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erreur lors de l’import LDAP');
            }

            const importedCount = Number(result.imported || 0);

            addToast({
                title: 'Import LDAP',
                description: `${importedCount} utilisateur${importedCount > 1 ? 's' : ''} LDAP ajouté${importedCount > 1 ? 's' : ''}.`,
                color: 'success',
                duration: 7000,
            });
        } catch (error) {
            addToast({
                title: 'Import LDAP',
                description: error.message || 'Erreur lors de l’import LDAP',
                color: 'danger',
                duration: 7000,
            });
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <Card className="w-full">
                <CardHeader className="flex gap-3">
                    <div className="flex flex-col">
                        <p className="text-xl font-semibold">Configuration LDAP</p>
                        <p className="text-sm text-muted-foreground">Configurez votre serveur LDAP pour
                            l&apos;authentification</p>
                    </div>
                </CardHeader>
                <CardContent className="border-t pt-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <AdminField label="URL du serveur LDAP" error={errorMessage && !formData.serverUrl ? "Ce champ est requis" : ""}>
                            <Input required name="serverUrl" placeholder="ldap://example.com" value={formData.serverUrl} onChange={handleInputChange} disabled={isLoadingConfig}/>
                        </AdminField>

                        <AdminField label="Base DN" error={errorMessage && !formData.bindDn ? "Ce champ est requis" : ""}>
                            <Input required name="bindDn" placeholder="dc=example,dc=com" value={formData.bindDn} onChange={handleInputChange} disabled={isLoadingConfig}/>
                        </AdminField>

                        <AdminField label="Nom d'utilisateur administrateur" error={errorMessage && !formData.adminCn ? "Ce champ est requis" : ""}>
                            <Input required name="adminCn" placeholder="cn=admin" value={formData.adminCn} onChange={handleInputChange} disabled={isLoadingConfig}/>
                        </AdminField>

                        <AdminField label="DN de l'administrateur" error={errorMessage && !formData.adminDn ? "Ce champ est requis" : ""}>
                            <Input required name="adminDn" placeholder="cn=admin,dc=example,dc=com" value={formData.adminDn} onChange={handleInputChange} disabled={isLoadingConfig}/>
                        </AdminField>

                        <AdminField label="Domaine de messagerie">
                            <Input name="emailDomain" placeholder="example.com" value={formData.emailDomain} onChange={handleInputChange} disabled={isLoadingConfig}/>
                        </AdminField>

                        <AdminField label="Mot de passe administrateur" error={errorMessage && !formData.adminPassword ? "Ce champ est requis" : ""}>
                            <div className="relative">
                                <Input required name="adminPassword" type={isVisible ? "text" : "password"} value={formData.adminPassword} onChange={handleInputChange} placeholder="Mot de passe" disabled={isLoadingConfig} className="pr-10"/>
                                <Button type="button" size="icon" variant="ghost" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full" onClick={() => setIsVisible(!isVisible)} aria-label={isVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"} disabled={isLoadingConfig}>
                                    {isVisible ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </Button>
                            </div>
                        </AdminField>

                        <div className="flex justify-end gap-4 mt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={importUsers}
                                disabled={isLoadingConfig || isTesting || isLoading || isImporting}
                            >
                                {!isImporting && <ArrowUpTrayIcon className="h-5 w-5"/>}
                                Importer les utilisateurs LDAP
                            </Button>
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

export default LDAP;
