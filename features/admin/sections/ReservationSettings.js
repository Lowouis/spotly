'use client';

import React, {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {addToast} from "@/lib/toast";
import {Switch} from "@/components/ui/switch";

const weekEndDays = [
    {value: "1", label: "Lundi"},
    {value: "2", label: "Mardi"},
    {value: "3", label: "Mercredi"},
    {value: "4", label: "Jeudi"},
    {value: "5", label: "Vendredi"},
    {value: "6", label: "Samedi"},
    {value: "0", label: "Dimanche"},
];

const readJsonResponse = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return {message: await response.text()};
};

const ReservationSettings = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        shortcutStartHour: "8",
        shortcutEndHour: "18",
        shortcutWeekEndDay: "5",
        maxEarlyPickupMinutes: "0",
        showFooter: true,
        conversationAutoDeleteDays: "7",
        conversationAutoArchiveResolvedDays: "7",
        eventDiscussionNotificationsEnabled: true,
    });

    useEffect(() => {
        const loadOptions = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/timeScheduleOptions`, {
                    credentials: 'include',
                });
                const appSettingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/app-settings`, {
                    credentials: 'include',
                });

                if (!response.ok) return;

                const options = await readJsonResponse(response);
                const appSettings = appSettingsResponse.ok ? await readJsonResponse(appSettingsResponse) : {};
                setFormData({
                    shortcutStartHour: String(options?.shortcutStartHour ?? 8),
                    shortcutEndHour: String(options?.shortcutEndHour ?? 18),
                    shortcutWeekEndDay: String(options?.shortcutWeekEndDay ?? 5),
                    maxEarlyPickupMinutes: String(options?.maxEarlyPickupMinutes ?? 0),
                    showFooter: appSettings?.showFooter !== false,
                    conversationAutoDeleteDays: String(appSettings?.conversationAutoDeleteDays ?? 7),
                    conversationAutoArchiveResolvedDays: String(appSettings?.conversationAutoArchiveResolvedDays ?? 7),
                    eventDiscussionNotificationsEnabled: appSettings?.eventDiscussionNotificationsEnabled !== false,
                });
            } catch (error) {
                addToast({
                    title: "Paramètres",
                    description: "Impossible de charger les paramètres.",
                    color: "danger",
                    duration: 5000,
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadOptions();
    }, []);

    const handleHourChange = (field, value) => {
        setFormData((previous) => ({...previous, [field]: value}));
    };

    const notifySaved = () => addToast({
        title: "Paramètres",
        description: "Paramètre sauvegardé.",
        color: "success",
        duration: 3000,
    });

    const notifySaveError = (error) => addToast({
        title: "Paramètres",
        description: error.message || "Erreur lors de la sauvegarde.",
        color: "danger",
        duration: 5000,
    });

    const saveTimeSettings = async (nextData = formData) => {
        const shortcutStartHour = Number(nextData.shortcutStartHour);
        const shortcutEndHour = Number(nextData.shortcutEndHour);
        const shortcutWeekEndDay = Number(nextData.shortcutWeekEndDay);
        const maxEarlyPickupMinutes = Number(nextData.maxEarlyPickupMinutes);

        if (!Number.isInteger(shortcutStartHour) || !Number.isInteger(shortcutEndHour) || shortcutStartHour < 0 || shortcutStartHour > 23 || shortcutEndHour < 0 || shortcutEndHour > 23) {
            addToast({
                title: "Paramètres invalides",
                description: "Les heures doivent être comprises entre 0 et 23.",
                color: "warning",
                duration: 5000,
            });
            return;
        }

        if (shortcutStartHour >= shortcutEndHour) {
            addToast({
                title: "Paramètres invalides",
                description: "L'heure de début doit être avant l'heure de fin.",
                color: "warning",
                duration: 5000,
            });
            return;
        }

        if (!Number.isInteger(maxEarlyPickupMinutes) || maxEarlyPickupMinutes < 0 || maxEarlyPickupMinutes > 43200) {
            addToast({
                title: "Paramètres invalides",
                description: "La flexibilité de récupération doit être comprise entre 0 minute et 30 jours.",
                color: "warning",
                duration: 5000,
            });
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/timeScheduleOptions`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({shortcutStartHour, shortcutEndHour, shortcutWeekEndDay, maxEarlyPickupMinutes}),
            });

            const result = await readJsonResponse(response);

            if (!response.ok) {
                throw new Error(result.message || "Erreur lors de la sauvegarde");
            }

            notifySaved();
        } catch (error) {
            notifySaveError(error);
        } finally {
            setIsSaving(false);
        }
    };

    const saveAppSettings = async (nextData = formData) => {
        const conversationAutoDeleteDays = Number(nextData.conversationAutoDeleteDays);
        const conversationAutoArchiveResolvedDays = Number(nextData.conversationAutoArchiveResolvedDays);

        if (!Number.isInteger(conversationAutoDeleteDays) || conversationAutoDeleteDays < 1 || conversationAutoDeleteDays > 365) {
            addToast({
                title: "Paramètres invalides",
                description: "Le délai de suppression des discussions doit être compris entre 1 et 365 jours.",
                color: "warning",
                duration: 5000,
            });
            return;
        }

        if (!Number.isInteger(conversationAutoArchiveResolvedDays) || conversationAutoArchiveResolvedDays < 1 || conversationAutoArchiveResolvedDays > 365) {
            addToast({
                title: "Paramètres invalides",
                description: "Le délai d’archivage des discussions résolues doit être compris entre 1 et 365 jours.",
                color: "warning",
                duration: 5000,
            });
            return;
        }

        setIsSaving(true);
        try {
            const appSettingsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/app-settings`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    showFooter: nextData.showFooter,
                    conversationAutoDeleteDays,
                    conversationAutoArchiveResolvedDays,
                    eventDiscussionNotificationsEnabled: nextData.eventDiscussionNotificationsEnabled,
                }),
            });
            const appSettingsResult = await readJsonResponse(appSettingsResponse);

            if (!appSettingsResponse.ok) {
                throw new Error(appSettingsResult.message || "Erreur lors de la sauvegarde des paramètres d'interface");
            }

            notifySaved();
        } catch (error) {
            notifySaveError(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mx-auto max-w-4xl space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Réservations</CardTitle>
                        <CardDescription>
                            Configure les raccourcis du sélecteur de dates. &quot;Cette semaine&quot; va d&apos;aujourd&apos;hui jusqu&apos;au jour de fin de semaine choisi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="shortcutStartHour">Heure de début</Label>
                                <Input
                                    id="shortcutStartHour"
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.shortcutStartHour}
                                    onChange={(event) => handleHourChange("shortcutStartHour", event.target.value)}
                                    onBlur={() => saveTimeSettings()}
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shortcutEndHour">Heure de fin</Label>
                                <Input
                                    id="shortcutEndHour"
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.shortcutEndHour}
                                    onChange={(event) => handleHourChange("shortcutEndHour", event.target.value)}
                                    onBlur={() => saveTimeSettings()}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Fin de semaine</Label>
                            <Select
                                value={formData.shortcutWeekEndDay}
                                onValueChange={(value) => {
                                    if (formData.shortcutWeekEndDay === value) return;
                                    const nextData = {...formData, shortcutWeekEndDay: value};
                                    setFormData(nextData);
                                    saveTimeSettings(nextData);
                                }}
                                disabled={isLoading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un jour" />
                                </SelectTrigger>
                                <SelectContent>
                                    {weekEndDays.map((day) => (
                                        <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                                Exemple: vendredi pour lundi-vendredi, dimanche pour lundi-dimanche.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                            <Label htmlFor="maxEarlyPickupMinutes">Flexibilité max de récupération anticipée</Label>
                            <Input
                                id="maxEarlyPickupMinutes"
                                type="number"
                                min="0"
                                max="43200"
                                value={formData.maxEarlyPickupMinutes}
                                onChange={(event) => handleHourChange("maxEarlyPickupMinutes", event.target.value)}
                                onBlur={() => saveTimeSettings()}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                Nombre de minutes avant le début prévu où l’utilisateur peut récupérer une ressource disponible, seulement s’il n’y a aucune autre réservation avant la sienne. 0 désactive cette récupération anticipée.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Interface</CardTitle>
                        <CardDescription>Paramètres d’affichage globaux de l’application.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                            <div>
                                <Label htmlFor="showFooter">Afficher le footer</Label>
                                <p className="mt-1 text-sm text-muted-foreground">Masque ou affiche le footer sur les pages publiques.</p>
                            </div>
                            <Switch
                                id="showFooter"
                                checked={formData.showFooter}
                                onCheckedChange={(checked) => {
                                    const nextData = {...formData, showFooter: checked};
                                    setFormData(nextData);
                                    saveAppSettings(nextData);
                                }}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Discussions</CardTitle>
                        <CardDescription>Règles de cycle de vie des discussions et messages associés.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                            <Label htmlFor="conversationAutoDeleteDays">Suppression automatique des discussions</Label>
                            <Input
                                id="conversationAutoDeleteDays"
                                type="number"
                                min="1"
                                max="365"
                                value={formData.conversationAutoDeleteDays}
                                onChange={(event) => setFormData((previous) => ({...previous, conversationAutoDeleteDays: event.target.value}))}
                                onBlur={() => saveAppSettings()}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                Les discussions sans nouveau message depuis ce nombre de jours sont supprimées automatiquement. Par défaut: 7 jours.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                            <Label htmlFor="conversationAutoArchiveResolvedDays">Archivage automatique des discussions résolues</Label>
                            <Input
                                id="conversationAutoArchiveResolvedDays"
                                type="number"
                                min="1"
                                max="365"
                                value={formData.conversationAutoArchiveResolvedDays}
                                onChange={(event) => setFormData((previous) => ({...previous, conversationAutoArchiveResolvedDays: event.target.value}))}
                                onBlur={() => saveAppSettings()}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-muted-foreground">
                                Les discussions résolues sans intervention depuis ce nombre de jours sont archivées automatiquement. Par défaut: 7 jours.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications</CardTitle>
                        <CardDescription>Paramètres qui contrôlent les notifications envoyées aux utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                            <div>
                                <Label htmlFor="eventDiscussionNotificationsEnabled">Notifications des discussions d’événement</Label>
                                <p className="mt-1 text-sm text-muted-foreground">Active ou désactive les notifications envoyées depuis les discussions de maintenance/événements.</p>
                            </div>
                            <Switch
                                id="eventDiscussionNotificationsEnabled"
                                checked={formData.eventDiscussionNotificationsEnabled}
                                onCheckedChange={(checked) => {
                                    const nextData = {...formData, eventDiscussionNotificationsEnabled: checked};
                                    setFormData(nextData);
                                    saveAppSettings(nextData);
                                }}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default ReservationSettings;
