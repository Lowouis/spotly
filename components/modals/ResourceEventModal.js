'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Switch} from '@/components/ui/switch';
import {addToast} from '@/lib/toast';
import ShadcnDatePicker from '@/components/form/ShadcnDatePicker';

const todayInputValue = () => new Date().toISOString().slice(0, 16);

const pad = (value) => String(value).padStart(2, '0');

const getTimeValue = (value) => value?.slice(11, 16) || '00:00';

const setDateTimeDate = (currentValue, date) => {
    if (!date) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${getTimeValue(currentValue)}`;
};

const setDateTimeTime = (currentValue, time) => {
    const datePart = currentValue?.slice(0, 10) || todayInputValue().slice(0, 10);
    return `${datePart}T${time || '00:00'}`;
};

const DateTimeField = ({label, value, onChange, required = false}) => (
    <div className="space-y-2">
        <ShadcnDatePicker
            label={label}
            value={value ? new Date(value) : null}
            onChange={(calendarValue, date) => onChange(setDateTimeDate(value, date))}
            required={required}
        />
        <Input
            type="time"
            value={getTimeValue(value)}
            onChange={(event) => onChange(setDateTimeTime(value, event.target.value))}
            required={required}
            className="h-11"
        />
    </div>
);

export default function ResourceEventModal({open, onOpenChange, resource, entry, mode = 'admin', onCreated}) {
    const isUserReport = mode === 'user';
    const [types, setTypes] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        typeId: '',
        customTypeName: '',
        customTypeIcon: 'CircleAlert',
        description: '',
        severity: 'information',
        problemDate: todayInputValue(),
        startDate: todayInputValue(),
        endDate: '',
        makesResourceUnavailable: false,
    });

    useEffect(() => {
        if (!open) return;

        fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-event-types`, {credentials: 'include'})
            .then((response) => response.ok ? response.json() : [])
            .then((loadedTypes) => {
                setTypes(loadedTypes);
                const defaultType = loadedTypes.find((type) => type.name === (isUserReport ? 'Incident signalé' : 'Maintenance')) || loadedTypes[0];
                if (defaultType) setForm((current) => ({...current, typeId: String(defaultType.id)}));
            })
            .catch(() => setTypes([]));
    }, [open, isUserReport]);

    useEffect(() => {
        if (!open) return;

        setForm((current) => ({
            ...current,
            title: '',
            typeId: '',
            customTypeName: '',
            description: '',
            severity: isUserReport ? 'attention' : 'information',
            problemDate: todayInputValue(),
            startDate: todayInputValue(),
            endDate: '',
            makesResourceUnavailable: false,
        }));
    }, [open, isUserReport]);

    const unavailableDisabled = useMemo(() => {
        if (!form.startDate) return true;
        const selectedDay = new Date(form.startDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return selectedDay < today;
    }, [form.startDate]);

    const setField = (name, value) => setForm((current) => ({...current, [name]: value}));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!resource?.id || isSaving) return;

        if (!isUserReport && !form.typeId && !form.customTypeName.trim()) {
            addToast({title: 'Typologie requise', description: 'Choisissez une typologie ou renseignez une typologie personnalisée.', color: 'warning'});
            return;
        }

        const incidentType = types.find((type) => type.name === 'Incident signalé');
        const startDate = isUserReport ? form.problemDate : form.startDate;

        if (!startDate) {
            addToast({title: 'Date requise', description: 'Choisissez une date pour créer l’événement.', color: 'warning'});
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    resourceId: resource.id,
                    entryId: entry?.id,
                    title: form.title,
                    typeId: isUserReport ? incidentType?.id : form.typeId || null,
                    customTypeName: isUserReport ? 'Incident signalé' : form.customTypeName,
                    customTypeIcon: isUserReport ? 'CircleAlert' : form.customTypeIcon,
                    description: form.description,
                    severity: form.severity,
                    problemDate: isUserReport ? form.problemDate : null,
                    startDate,
                    endDate: isUserReport ? null : form.endDate || null,
                    makesResourceUnavailable: !isUserReport && !unavailableDisabled && form.makesResourceUnavailable,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.message || 'Impossible de créer l’événement');

            addToast({
                title: isUserReport ? 'Problème signalé' : 'Événement créé',
                description: isUserReport ? 'Le gestionnaire de la ressource a été informé.' : 'L’événement a été ajouté à la ressource.',
                color: 'success',
            });
            onCreated?.(payload);
            onOpenChange(false);
        } catch (error) {
            addToast({title: 'Événement ressource', description: error.message, color: 'danger'});
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl gap-0 p-0">
                <DialogHeader className="border-b px-6 py-4 pr-12">
                    <DialogTitle>{isUserReport ? 'Signaler un problème' : 'Ajouter un événement ressource'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm font-semibold">
                        Ressource : {resource?.name || 'Ressource'}
                    </div>

                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input required value={form.title} onChange={(event) => setField('title', event.target.value)} placeholder="Ex : Voyant moteur allumé" />
                    </div>

                    {!isUserReport && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Typologie</Label>
                                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.typeId} onChange={(event) => setField('typeId', event.target.value)}>
                                    <option value="">Personnalisée</option>
                                    {types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                                </select>
                            </div>
                            {!form.typeId && (
                                <div className="space-y-2">
                                    <Label>Typologie personnalisée</Label>
                                    <Input value={form.customTypeName} onChange={(event) => setField('customTypeName', event.target.value)} placeholder="Ex : Batterie" />
                                </div>
                            )}
                        </div>
                    )}

                    {isUserReport && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <DateTimeField required label="Date du problème" value={form.problemDate} onChange={(value) => setField('problemDate', value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Impact constaté</Label>
                                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.severity} onChange={(event) => setField('severity', event.target.value)}>
                                    <option value="information">Information</option>
                                    <option value="attention">À surveiller</option>
                                    <option value="blocking">Bloquant / dangereux</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Description {isUserReport ? '' : '(optionnel)'}</Label>
                        <Textarea required={isUserReport} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="Décrivez les symptômes, le contexte et les actions déjà tentées." />
                    </div>

                    {!isUserReport && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <DateTimeField required label="Date de début" value={form.startDate} onChange={(value) => setField('startDate', value)} />
                            </div>
                            <div className="space-y-2">
                                <DateTimeField label="Date de fin prévue (optionnel)" value={form.endDate} onChange={(value) => setField('endDate', value)} />
                            </div>
                        </div>
                    )}

                    {!isUserReport && (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label>Rendre la ressource indisponible</Label>
                                <p className="text-sm text-muted-foreground">Désactivé si la date de début est antérieure à aujourd’hui.</p>
                            </div>
                            <Switch checked={form.makesResourceUnavailable} disabled={unavailableDisabled} onCheckedChange={(checked) => setField('makesResourceUnavailable', checked)} />
                        </div>
                    )}

                    </div>
                    <DialogFooter className="border-t px-6 py-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
