'use client';

import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {fr} from 'date-fns/locale';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Calendar} from '@/components/ui/calendar';
import {Spinner} from '@/components/ui/spinner';
import {addToast} from '@/lib/toast';
import {ChatBubbleLeftRightIcon, CheckCircleIcon, MagnifyingGlassIcon, TrashIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {CircleAlert, ClipboardCheck, Plus, Sparkles, TriangleAlert, Wrench} from 'lucide-react';
import ConversationChat from '@/components/messages/ConversationChat';

const formatShortDate = (value) => value ? new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(value)) : null;
const formatPeriodDate = (value) => {
    if (!value) return {date: '-', time: ''};
    const date = new Date(value);
    return {
        date: new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short'}).format(date),
        time: new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(date),
    };
};
const formatTimeInput = (value) => {
    const date = value ? new Date(value) : new Date();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};
const getTypeName = (event) => event.type?.name || event.customTypeName || 'Evénement';
const getTypeIcon = (event) => event.type?.icon || event.customTypeIcon || 'Wrench';
const icons = {CircleAlert, ClipboardCheck, Sparkles, TriangleAlert, Wrench};
const selectTriggerClass = 'h-11 min-w-0 border border-input bg-background text-foreground shadow-sm hover:bg-muted';
const tableBorderClass = 'border-border';
const tableSurfaceClass = 'bg-card text-card-foreground';

const conversationButtonStyles = {
    OPEN: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    RESOLVED: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    ARCHIVED: 'border-neutral-200 bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
};

const conversationStatusLabels = {
    OPEN: 'Ouverte',
    RESOLVED: 'Résolue',
    ARCHIVED: 'Archivée',
};

const EventTypeBadge = ({event, onClick}) => {
    const Icon = icons[getTypeIcon(event)] || Wrench;
    return <button type="button" onClick={onClick} className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 transition-colors ${event.endDate ? 'bg-neutral-100 text-neutral-700 ring-neutral-200 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-800 dark:hover:bg-neutral-800' : 'bg-amber-50 text-amber-700 ring-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900 dark:hover:bg-amber-950'}`}><Icon className="h-3.5 w-3.5" />{getTypeName(event)}</button>;
};

const PeriodDateLabel = ({value}) => {
    const label = formatPeriodDate(value);
    return (
        <span className="flex min-w-0 flex-col leading-tight">
            <span className="font-semibold text-foreground">{label.date}</span>
            {label.time && <span className="text-[11px] font-medium text-muted-foreground">{label.time}</span>}
        </span>
    );
};

const getConversationStyle = (status) => conversationButtonStyles[status] || conversationButtonStyles.OPEN;

const buildDateWithTime = (date, time) => {
    if (!date) return null;
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    const nextDate = new Date(date);
    nextDate.setHours(hours, minutes, 0, 0);
    return nextDate;
};

const formatEuropeanTimeInput = (value) => value
    .replace(/[^0-9:]/g, '')
    .replace(/^([0-9]{2})([0-9])$/, '$1:$2')
    .slice(0, 5);

const isValidEuropeanTime = (value) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const EndDateEditor = ({event, onSave}) => {
    const initialDate = event.endDate ? new Date(event.endDate) : new Date();
    const endLabel = formatPeriodDate(event.endDate);
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(initialDate);
    const [time, setTime] = useState(formatTimeInput(event.endDate));
    const [isSaving, setIsSaving] = useState(false);
    const minEndDate = startOfDay(event.startDate);
    const candidateEndDate = buildDateWithTime(date, time);
    const isEndDateValid = candidateEndDate && candidateEndDate >= new Date(event.startDate);
    const isTimeValid = isValidEuropeanTime(time);

    const handleOpenChange = (nextOpen) => {
        if (nextOpen) {
            setDate(event.endDate ? new Date(event.endDate) : new Date());
            setTime(formatTimeInput(event.endDate));
        }
        setOpen(nextOpen);
    };

    const handleSave = async () => {
        if (!isTimeValid || !isEndDateValid) return;
        const endDate = candidateEndDate;
        if (!endDate || Number.isNaN(endDate.getTime())) return;
        setIsSaving(true);
        const saved = await onSave(event.id, endDate);
        setIsSaving(false);
        if (saved) setOpen(false);
    };

    const handleClearEndDate = async () => {
        setIsSaving(true);
        const saved = await onSave(event.id, null);
        setIsSaving(false);
        if (saved) setOpen(false);
    };

    const revealClassName = !event.endDate
        ? (open
            ? 'ml-2 max-w-20 translate-x-0 opacity-100'
            : 'max-w-0 -translate-x-2 overflow-hidden opacity-0 group-hover/period:ml-2 group-hover/period:max-w-20 group-hover/period:translate-x-0 group-hover/period:opacity-100 group-focus-within/period:ml-2 group-focus-within/period:max-w-20 group-focus-within/period:translate-x-0 group-focus-within/period:opacity-100')
        : 'ml-2';

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <div className={`flex items-center gap-2 transition-[max-width,margin,transform,opacity] duration-200 ${revealClassName}`}>
                <span className="text-muted-foreground" aria-hidden="true">&gt;</span>
                <PopoverTrigger asChild>
                    <Button type="button" variant={event.endDate ? 'ghost' : 'outline'} size={event.endDate ? 'sm' : 'icon'} className={event.endDate ? 'h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground' : 'h-7 w-7 shrink-0 rounded-full'} aria-label={event.endDate ? 'Modifier la date de fin' : 'Ajouter une date de fin'}>
                        {event.endDate ? (
                            <span className="flex flex-col items-start leading-tight">
                                <span className="font-semibold text-foreground">{endLabel.date}</span>
                                <span className="text-[11px] text-muted-foreground">{endLabel.time}</span>
                            </span>
                        ) : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                </PopoverTrigger>
            </div>
            <PopoverContent className="flex max-h-[min(520px,calc(100vh-5rem))] w-[320px] flex-col overflow-hidden p-0" align="center" side="top" sideOffset={8} collisionPadding={16}>
                <div className="min-h-0 overflow-y-auto p-3">
                    <Calendar
                        mode="single"
                        locale={fr}
                        weekStartsOn={1}
                        selected={date}
                        onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                        disabled={{before: minEndDate}}
                        showOutsideDays={false}
                        className="mx-auto p-0"
                        classNames={{
                            root: 'mx-auto w-fit text-foreground',
                            months: 'flex flex-col items-center',
                            month: 'space-y-2',
                            month_caption: 'flex h-8 items-center justify-center',
                            caption_label: 'text-sm font-semibold text-foreground capitalize',
                            button_previous: 'absolute left-1 top-0 h-8 w-8 p-0 text-foreground',
                            button_next: 'absolute right-1 top-0 h-8 w-8 p-0 text-foreground',
                            month_grid: 'w-fit border-collapse space-y-1',
                            weekdays: 'flex gap-1',
                            weekday: 'w-8 rounded-md text-center text-xs font-medium text-muted-foreground',
                            week: 'mt-1 flex w-full gap-1',
                            day: 'h-8 w-8 p-0 text-center text-sm',
                            day_button: 'h-8 w-8 p-0 text-sm font-normal text-foreground aria-selected:opacity-100',
                        }}
                        initialFocus
                    />
                    <div className="mt-3 space-y-2 border-t pt-3">
                        <label className="text-xs font-semibold text-muted-foreground" htmlFor={`end-time-${event.id}`}>Heure de fin</label>
                        <Input
                            id={`end-time-${event.id}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{2}:[0-9]{2}"
                            placeholder="12:35"
                            value={time}
                            onChange={(changeEvent) => setTime(formatEuropeanTimeInput(changeEvent.target.value))}
                            className="h-10 font-mono"
                        />
                        {!isEndDateValid && (
                            <p className="text-xs font-medium text-red-600">La date de fin doit être postérieure à la date de début.</p>
                        )}
                    </div>
                </div>
                <div className="flex shrink-0 justify-between gap-2 border-t bg-popover p-3">
                    <Button type="button" variant="ghost" size="sm" onClick={handleClearEndDate} disabled={isSaving || !event.endDate}>Indéfini</Button>
                    <span className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button type="button" size="sm" onClick={handleSave} disabled={isSaving || !isTimeValid || !isEndDateValid}>{isSaving ? 'Enregistrement...' : 'Valider'}</Button>
                    </span>
                </div>
            </PopoverContent>
        </Popover>
    );
};

async function fetchJson(url) {
    const response = await fetch(url, {credentials: 'include'});
    if (!response.ok) throw new Error('Erreur de chargement');
    return response.json();
}

export default function Maintenance() {
    const [search, setSearch] = useState('');
    const [domainId, setDomainId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [eventStatus, setEventStatus] = useState('active');
    const [conversationStatus, setConversationStatus] = useState('');
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedDescription, setSelectedDescription] = useState(null);
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (domainId) query.set('domainId', domainId);
    if (categoryId) query.set('categoryId', categoryId);
    if (typeId) query.set('typeId', typeId);
    const updateIfChanged = (setter, currentValue, nextValue) => {
        if (currentValue !== nextValue) setter(nextValue);
    };

    const {data: events = [], isLoading, refetch} = useQuery({
        queryKey: ['resource-events', search, domainId, categoryId, typeId],
        queryFn: () => fetchJson(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events?${query.toString()}`),
    });
    const {data: domains = []} = useQuery({queryKey: ['domains'], queryFn: () => fetchJson(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/domains`)});
    const {data: categories = []} = useQuery({queryKey: ['categories'], queryFn: () => fetchJson(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/categories`)});
    const {data: types = []} = useQuery({queryKey: ['resource-event-types'], queryFn: () => fetchJson(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-event-types`)});
    const filteredEvents = events.filter((event) => {
        const endDate = event.endDate ? new Date(event.endDate) : null;
        const isActive = !endDate || endDate > new Date();
        const matchesEventStatus = !eventStatus || (eventStatus === 'active' ? isActive : !isActive);
        const matchesConversationStatus = !conversationStatus || event.conversation?.status === conversationStatus;
        return matchesEventStatus && matchesConversationStatus;
    });

    const closeEvent = async (eventId) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({id: eventId, archiveConversation: true}),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            addToast({title: 'Maintenance', description: payload.message || 'Impossible de clôturer l’événement', color: 'danger'});
            return;
        }
        setEventStatus('ended');
        setConversationStatus('ARCHIVED');
        addToast({title: 'Maintenance', description: 'Événement clôturé et discussion archivée.', color: 'success'});
        refetch();
    };

    const updateEndDate = async (eventId, endDate) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events`, {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({id: eventId, endDate: endDate ? endDate.toISOString() : null}),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            addToast({title: 'Maintenance', description: payload.message || 'Impossible de modifier la date de fin', color: 'danger'});
            return false;
        }
        addToast({title: 'Maintenance', description: 'Date de fin mise à jour.', color: 'success'});
        refetch();
        return true;
    };

    const deleteEvent = async (eventId) => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/resource-events`, {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json'},
            credentials: 'include',
            body: JSON.stringify({id: eventId}),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            addToast({title: 'Maintenance', description: payload.message || 'Impossible de supprimer l’événement', color: 'danger'});
            return;
        }
        addToast({title: 'Maintenance', description: 'Événement supprimé.', color: 'success'});
        refetch();
    };

    return (
        <div className="mx-5 flex-1 relative space-y-4">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl my-3 text-foreground">Maintenance</h1>
                <Button size="icon" disabled>{filteredEvents.length}</Button>
            </div>

            <div className="space-y-3">
                <div className="relative w-full">
                    <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher par titre, ressource ou description" className="h-11 border border-input bg-background pl-10 pr-10 text-base text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
                    {search && (
                        <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" aria-label="Réinitialiser la recherche">
                            <XMarkIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="grid gap-3 md:grid-cols-5">
                    <Select value={domainId || '__all'} onValueChange={(value) => updateIfChanged(setDomainId, domainId, value === '__all' ? '' : value)}>
                        <SelectTrigger className={selectTriggerClass} aria-label="Filtrer par site"><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Tous les sites</SelectItem>
                            {domains.map((domain) => <SelectItem key={domain.id} value={String(domain.id)}>{domain.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={categoryId || '__all'} onValueChange={(value) => updateIfChanged(setCategoryId, categoryId, value === '__all' ? '' : value)}>
                        <SelectTrigger className={selectTriggerClass} aria-label="Filtrer par catégorie"><SelectValue placeholder="Toutes les catégories" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Toutes les catégories</SelectItem>
                            {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={typeId || '__all'} onValueChange={(value) => updateIfChanged(setTypeId, typeId, value === '__all' ? '' : value)}>
                        <SelectTrigger className={selectTriggerClass} aria-label="Filtrer par typologie"><SelectValue placeholder="Toutes les typologies" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Toutes les typologies</SelectItem>
                            {types.map((type) => <SelectItem key={type.id} value={String(type.id)}>{type.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={eventStatus || '__all'} onValueChange={(value) => updateIfChanged(setEventStatus, eventStatus, value === '__all' ? '' : value)}>
                        <SelectTrigger className={selectTriggerClass} aria-label="Filtrer par statut d’événement"><SelectValue placeholder="Tous les événements" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Tous les événements</SelectItem>
                            <SelectItem value="active">Événements actifs</SelectItem>
                            <SelectItem value="ended">Événements terminés</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={conversationStatus || '__all'} onValueChange={(value) => updateIfChanged(setConversationStatus, conversationStatus, value === '__all' ? '' : value)}>
                        <SelectTrigger className={selectTriggerClass} aria-label="Filtrer par statut de discussion"><SelectValue placeholder="Toutes les discussions" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="__all">Toutes les discussions</SelectItem>
                            <SelectItem value="OPEN">Discussions ouvertes</SelectItem>
                            <SelectItem value="RESOLVED">Discussions résolues</SelectItem>
                            <SelectItem value="ARCHIVED">Discussions archivées</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className={`mt-2 overflow-hidden rounded-lg border ${tableBorderClass} ${tableSurfaceClass}`}>
                {isLoading ? (
                    <div className="flex min-h-64 items-center justify-center"><Spinner className="h-6 w-6" /></div>
                ) : filteredEvents.length ? (
                    <table className={`w-full caption-bottom text-sm ${tableSurfaceClass}`}>
                        <thead className={`sticky top-0 z-10 border-b ${tableBorderClass} ${tableSurfaceClass}`}>
                            <tr>
                                <th className="h-10 px-4 text-left align-middle font-medium text-foreground">Typologie</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-foreground">Événement</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-foreground">Période</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-foreground">{'<>'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEvents.map((event) => (
                                <tr key={event.id} className={`border-b ${tableSurfaceClass} transition-colors hover:bg-neutral-50 last:border-0 dark:hover:bg-neutral-800/70 ${tableBorderClass}`}>
                                    <td className="w-44 p-4 align-middle text-foreground"><EventTypeBadge event={event} onClick={() => setSelectedDescription(event)} /></td>
                                    <td className="p-4 align-middle text-foreground">
                                        <div className="min-w-0 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="truncate font-semibold text-neutral-950 dark:text-neutral-50">{event.title}</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold">{event.resource?.name || '-'}</div>
                                                <div className="text-xs text-muted-foreground">{event.resource?.domains?.name || '-'} · {event.resource?.category?.name || '-'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="w-56 p-4 align-middle text-foreground">
                                        <div className="group/period inline-flex max-w-full items-center rounded-xl border border-border bg-background px-3 py-2 text-xs shadow-sm">
                                            <PeriodDateLabel value={event.startDate} />
                                            <EndDateEditor event={event} onSave={updateEndDate} />
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle text-foreground">
                                        <div className="flex justify-end gap-2">
                                        {!event.endDate && (
                                            <Button variant="outline" size="sm" onClick={() => closeEvent(event.id)}>
                                                <CheckCircleIcon className="h-4 w-4" />
                                                Terminer maintenant
                                            </Button>
                                        )}
                                            {event.conversation?.id && (
                                                <Button variant="outline" size="sm" className={getConversationStyle(event.conversation.status)} onClick={() => setSelectedConversation(event.conversation)}>
                                                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                                    Discussion · {conversationStatusLabels[event.conversation.status] || 'Ouverte'}
                                                </Button>
                                            )}
                                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteEvent(event.id)}>
                                                <TrashIcon className="h-4 w-4" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex min-h-64 items-center justify-center rounded-lg bg-card text-sm font-medium text-muted-foreground">Aucun événement à afficher</div>
                )}
            </div>
            <Dialog open={!!selectedConversation} onOpenChange={(open) => !open && setSelectedConversation(null)}>
                <DialogContent className="flex h-[88vh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
                    <DialogHeader className="shrink-0 border-b px-6 py-5">
                        <DialogTitle>Discussion de maintenance</DialogTitle>
                    </DialogHeader>
                    {selectedConversation?.id && <ConversationChat conversationId={selectedConversation.id} className="min-h-0 flex-1 rounded-none border-0 shadow-none" subtitle="" manageParticipants onConversationUpdated={(updatedConversation) => {
                        setSelectedConversation((current) => current?.id === updatedConversation?.id ? {...current, ...updatedConversation} : current);
                        refetch();
                    }} />}
                </DialogContent>
            </Dialog>
            <Dialog open={!!selectedDescription} onOpenChange={(open) => !open && setSelectedDescription(null)}>
                <DialogContent className="max-w-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedDescription?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedDescription && <EventTypeBadge event={selectedDescription} />}
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {selectedDescription?.description || 'Aucune description.'}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
