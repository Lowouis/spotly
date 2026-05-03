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

const activeReservationStatuses = ['ACCEPTED', 'USED', 'WAITING'];

const isActiveReservation = (reservation) => activeReservationStatuses.includes(reservation?.moderate);

const formatReservationDate = (value) => new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
}).format(new Date(value));

const formatReservationPerson = (user) => [user?.name, user?.surname].filter(Boolean).join(' ') || user?.email || 'Utilisateur';

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
    const [nextReservation, setNextReservation] = useState(null);
    const [hasCurrentReservation, setHasCurrentReservation] = useState(false);
    const [isCheckingReservationState, setIsCheckingReservationState] = useState(false);
    const [affectedReservations, setAffectedReservations] = useState([]);
    const [isCheckingAffectedReservations, setIsCheckingAffectedReservations] = useState(false);
    const [sendPreventiveMail, setSendPreventiveMail] = useState(false);
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
        setSendPreventiveMail(false);
    }, [open, isUserReport]);

    useEffect(() => {
        if (!open || !resource?.id) {
            setNextReservation(null);
            setHasCurrentReservation(false);
            setIsCheckingReservationState(false);
            return;
        }

        let cancelled = false;

        const loadReservationState = async () => {
            setIsCheckingReservationState(true);
            try {
                const nowIso = new Date().toISOString();
                const [futureResponse, currentResponse] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry?resourceId=${resource.id}&future=true`, {credentials: 'include'}),
                    isUserReport
                        ? Promise.resolve(null)
                        : fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events/affected-reservations?resourceId=${resource.id}&startDate=${encodeURIComponent(nowIso)}&endDate=${encodeURIComponent(nowIso)}`, {credentials: 'include'}),
                ]);

                const futureReservations = futureResponse.ok ? await futureResponse.json() : [];
                const upcomingReservation = futureReservations.filter(isActiveReservation)[0] || null;
                const currentReservations = currentResponse && currentResponse.ok ? await currentResponse.json() : [];

                if (cancelled) return;
                setNextReservation(upcomingReservation);
                setHasCurrentReservation(currentReservations.length > 0);
            } catch (error) {
                if (cancelled) return;
                setNextReservation(null);
                setHasCurrentReservation(false);
            } finally {
                if (!cancelled) setIsCheckingReservationState(false);
            }
        };

        loadReservationState();

        return () => {
            cancelled = true;
        };
    }, [open, resource?.id, isUserReport]);

    useEffect(() => {
        if (!open || isUserReport || !resource?.id || !form.startDate || !form.endDate) {
            setAffectedReservations([]);
            setIsCheckingAffectedReservations(false);
            setSendPreventiveMail(false);
            return;
        }

        const startDate = new Date(form.startDate);
        const endDate = new Date(form.endDate);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
            setAffectedReservations([]);
            setIsCheckingAffectedReservations(false);
            setSendPreventiveMail(false);
            return;
        }

        let cancelled = false;

        const loadAffectedReservations = async () => {
            setIsCheckingAffectedReservations(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events/affected-reservations?resourceId=${resource.id}&startDate=${encodeURIComponent(startDate.toISOString())}&endDate=${encodeURIComponent(endDate.toISOString())}`, {
                    credentials: 'include',
                });
                const payload = response.ok ? await response.json() : [];
                if (!cancelled) {
                    setAffectedReservations(payload);
                    if (!payload.length) setSendPreventiveMail(false);
                }
            } catch (error) {
                if (!cancelled) {
                    setAffectedReservations([]);
                    setSendPreventiveMail(false);
                }
            } finally {
                if (!cancelled) setIsCheckingAffectedReservations(false);
            }
        };

        loadAffectedReservations();

        return () => {
            cancelled = true;
        };
    }, [open, isUserReport, resource?.id, form.startDate, form.endDate]);

    const unavailableDisabledByDate = useMemo(() => {
        if (!form.startDate) return true;
        const selectedDay = new Date(form.startDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return selectedDay < today;
    }, [form.startDate]);

    const unavailableDisabled = unavailableDisabledByDate || hasCurrentReservation || isCheckingReservationState;

    const selectedEventTypeLabel = useMemo(() => {
        if (isUserReport) return 'Incident signalé';
        if (form.typeId) return types.find((type) => String(type.id) === String(form.typeId))?.name || '';
        return form.customTypeName.trim();
    }, [form.customTypeName, form.typeId, isUserReport, types]);

    useEffect(() => {
        if (unavailableDisabled) {
            setForm((current) => current.makesResourceUnavailable ? {...current, makesResourceUnavailable: false} : current);
        }
    }, [unavailableDisabled]);

    const setField = (name, value) => setForm((current) => ({...current, [name]: value}));

    const notifyAffectedUsers = async () => {
        if (!resource?.id || !form.startDate || !form.endDate || !form.title.trim() || !selectedEventTypeLabel) return null;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events/notify-affected-users`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({
                resourceId: resource.id,
                startDate: new Date(form.startDate).toISOString(),
                endDate: new Date(form.endDate).toISOString(),
                eventTitle: form.title,
                eventType: selectedEventTypeLabel,
                eventDescription: form.description,
            }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'Impossible de prévenir les utilisateurs concernés');
        return payload;
    };

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
            const shouldSendPreventiveMail = !isUserReport && sendPreventiveMail && affectedReservations.length > 0;
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

            let preventiveMailResult = null;
            if (shouldSendPreventiveMail) {
                try {
                    preventiveMailResult = await notifyAffectedUsers();
                } catch (notifyError) {
                    addToast({
                        title: 'Prévention utilisateurs',
                        description: `L’événement a été créé, mais l’envoi préventif a échoué: ${notifyError.message}`,
                        color: 'warning',
                    });
                }
            }

            addToast({
                title: isUserReport ? 'Problème signalé' : 'Événement créé',
                description: isUserReport
                    ? 'Le gestionnaire de la ressource a été informé.'
                    : preventiveMailResult
                        ? (preventiveMailResult.emailSkipped
                            ? 'L’événement a été ajouté. Les notifications ont été envoyées, mais pas les emails.'
                            : 'L’événement a été ajouté et les utilisateurs concernés ont été prévenus.')
                        : 'L’événement a été ajouté à la ressource.',
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
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prochaine réservation</p>
                        <p className="mt-1 font-semibold text-foreground">
                            {nextReservation ? `${formatReservationDate(nextReservation.startDate)} · ${formatReservationPerson(nextReservation.user)}` : 'Aucune réservation à venir'}
                        </p>
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

                    {!isUserReport && form.startDate && form.endDate && (
                        <div className={`rounded-lg border p-3 ${affectedReservations.length ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20' : 'bg-muted/20'}`}>
                            {isCheckingAffectedReservations ? (
                                <p className="text-sm text-muted-foreground">Vérification des réservations sur la période…</p>
                            ) : affectedReservations.length ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{affectedReservations.length} réservation(s) concernée(s)</p>
                                        <p className="text-sm text-muted-foreground">Activez l’option du footer si vous souhaitez envoyer un mail préventif avant l’intervention.</p>
                                    </div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        {affectedReservations.slice(0, 3).map((reservation) => (
                                            <p key={reservation.id}>{formatReservationDate(reservation.startDate)} · {formatReservationPerson(reservation.user)}</p>
                                        ))}
                                        {affectedReservations.length > 3 && <p>+ {affectedReservations.length - 3} autre(s) réservation(s)</p>}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Aucune réservation active ne chevauche cette période.</p>
                            )}
                        </div>
                    )}

                    {!isUserReport && (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label>Rendre la ressource indisponible</Label>
                                <p className="text-sm text-muted-foreground">
                                    {isCheckingReservationState
                                        ? 'Vérification des réservations en cours…'
                                        : hasCurrentReservation
                                            ? 'Désactivé : la ressource est actuellement réservée.'
                                            : unavailableDisabledByDate
                                                ? 'Désactivé si la date de début est antérieure à aujourd’hui.'
                                                : 'La ressource sera immédiatement bloquée à la création de l’événement.'}
                                </p>
                            </div>
                            <Switch checked={form.makesResourceUnavailable} disabled={unavailableDisabled} onCheckedChange={(checked) => setField('makesResourceUnavailable', checked)} />
                        </div>
                    )}

                    </div>
                    <DialogFooter className={`items-center border-t px-6 py-4 ${!isUserReport && form.startDate && form.endDate ? 'sm:justify-between sm:space-x-0' : 'sm:justify-end'}`}>
                        {!isUserReport && form.startDate && form.endDate && (
                            <div className="flex items-center gap-3 sm:mr-auto">
                                <Switch checked={sendPreventiveMail} disabled={isCheckingAffectedReservations || !affectedReservations.length || isSaving} onCheckedChange={setSendPreventiveMail} />
                                <div className="text-sm leading-tight">
                                    <p className="font-medium text-foreground">Mail préventif</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isCheckingAffectedReservations
                                            ? 'Vérification des réservations concernées…'
                                            : affectedReservations.length
                                                ? `${affectedReservations.length} réservation(s) recevront aussi une notification Spotly.`
                                                : 'Aucune réservation concernée sur la période.'}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSaving}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
