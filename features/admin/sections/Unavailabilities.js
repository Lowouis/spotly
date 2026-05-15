'use client';

import {useEffect, useMemo, useState} from 'react';
import {fr} from 'date-fns/locale';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {CalendarDays, CalendarOff, ChevronDown, Plus, Trash2} from 'lucide-react';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Calendar} from '@/components/ui/calendar';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Checkbox} from '@/components/ui/checkbox';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Textarea} from '@/components/ui/textarea';
import {Spinner} from '@/components/ui/spinner';
import {addToast} from '@/lib/toast';
import {cn} from '@/lib/utils';

const TYPE_LABELS = {
    MAINTENANCE: 'Maintenance',
    ADMIN_BLOCK: 'Blocage admin',
    INTERNAL_USE: 'Usage interne',
    EVENT: 'Evénement',
    INVENTORY: 'Inventaire',
    OTHER: 'Autre',
};

const FILTER_ALL = 'all';
const FILTER_SINGLE = 'single';

const collator = new Intl.Collator('fr-FR', {numeric: true, sensitivity: 'base'});

const toDateTimeLocalValue = (date = new Date()) => {
    const value = new Date(date);
    value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
    return value.toISOString().slice(0, 16);
};

const createDefaultEndDate = () => {
    const value = new Date();
    value.setHours(value.getHours() + 2, 0, 0, 0);
    return value;
};

const createDefaultForm = () => ({
    resourceIds: [],
    type: 'ADMIN_BLOCK',
    reason: '',
    visibleToUsers: false,
    startDate: toDateTimeLocalValue(new Date()),
    endDate: toDateTimeLocalValue(createDefaultEndDate()),
    recurrenceUnit: '',
    recurrenceLimit: '',
});

const parseLocalDate = (value) => value ? new Date(value) : null;

const startOfDay = (value) => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
};

const addHours = (value, hours) => {
    const date = new Date(value);
    date.setHours(date.getHours() + hours);
    return date;
};

const formatDateTime = (value) => new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
}).format(new Date(value));

const formatTimeInput = (value) => {
    const date = parseLocalDate(value) || new Date();
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const formatEuropeanTimeInput = (value) => value
    .replace(/[^0-9:]/g, '')
    .replace(/^([0-9]{2})([0-9])$/, '$1:$2')
    .slice(0, 5);

const isValidEuropeanTime = (value) => /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

const setDatePart = (currentValue, selectedDate) => {
    const current = parseLocalDate(currentValue) || new Date();
    const next = new Date(selectedDate);
    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
    return toDateTimeLocalValue(next);
};

const setTimePart = (currentValue, time) => {
    const current = parseLocalDate(currentValue) || new Date();
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    current.setHours(hours, minutes, 0, 0);
    return toDateTimeLocalValue(current);
};

const buildOccurrences = ({startDate, endDate, recurrenceUnit, recurrenceLimit}) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const limit = recurrenceLimit ? new Date(recurrenceLimit) : null;
    if (!recurrenceUnit || !limit) return [{startDate: start.toISOString(), endDate: end.toISOString()}];

    const occurrences = [];
    while (end <= limit) {
        occurrences.push({startDate: start.toISOString(), endDate: end.toISOString()});
        const increment = recurrenceUnit === 'jour' ? 1 : 7;
        start.setDate(start.getDate() + increment);
        end.setDate(end.getDate() + increment);
    }
    return occurrences;
};

const joinUnique = (values) => [...new Set(values.filter(Boolean))].join(', ') || '-';

const createGroupSummary = (items) => {
    const sortedItems = [...items].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    const first = sortedItems[0];
    const recurringGroupId = Number(first?.recurringGroupId) || 0;
    return {
        id: recurringGroupId > 0 ? `series-${recurringGroupId}` : `item-${first?.id}`,
        recurringGroupId,
        isSeries: recurringGroupId > 0,
        items: sortedItems,
        first,
        resourceLabel: joinUnique(sortedItems.map((item) => item.resource?.name)),
        categoryLabel: joinUnique(sortedItems.map((item) => item.resource?.category?.name)),
        domainLabel: joinUnique(sortedItems.map((item) => item.resource?.domains?.name)),
        typeLabel: TYPE_LABELS[first?.type] || first?.type || '-',
        resourceIds: sortedItems.map((item) => item.resourceId),
        categoryIds: sortedItems.map((item) => item.resource?.category?.id).filter(Boolean),
        types: sortedItems.map((item) => item.type),
        startDate: first?.startDate,
        endDate: sortedItems[sortedItems.length - 1]?.endDate,
    };
};

const DateTimePicker = ({label, value, onChange, min, disabled}) => {
    const selectedDate = parseLocalDate(value);
    const minDate = parseLocalDate(min);
    const [open, setOpen] = useState(false);
    const [time, setTime] = useState(formatTimeInput(value));
    const timeIsValid = isValidEuropeanTime(time);

    useEffect(() => {
        setTime(formatTimeInput(value));
    }, [value]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-semibold">{label}</label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_112px]">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button type="button" variant="outline" disabled={disabled} className={cn('h-11 justify-start rounded-lg font-normal', !selectedDate && 'text-muted-foreground')}>
                            <CalendarDays className="h-4 w-4" />
                            {selectedDate ? new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'}).format(selectedDate) : 'Choisir une date'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            locale={fr}
                            weekStartsOn={1}
                            selected={selectedDate || undefined}
                            onSelect={(date) => {
                                if (!date) return;
                                onChange(setDatePart(value, date));
                                setOpen(false);
                            }}
                            disabled={minDate ? {before: startOfDay(minDate)} : undefined}
                            showOutsideDays={false}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
                <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{2}:[0-9]{2}"
                    placeholder="09:00"
                    disabled={disabled}
                    value={time}
                    onChange={(event) => {
                        const nextTime = formatEuropeanTimeInput(event.target.value);
                        setTime(nextTime);
                        if (isValidEuropeanTime(nextTime)) onChange(setTimePart(value, nextTime));
                    }}
                    onBlur={() => {
                        if (!isValidEuropeanTime(time)) setTime(formatTimeInput(value));
                    }}
                    className={cn('h-11 font-mono', !timeIsValid && 'border-red-500')}
                />
            </div>
        </div>
    );
};

const BlockedSlotRow = ({item, onDelete, isDeleting}) => (
    <div className="grid gap-3 border-t p-4 first:border-t-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-foreground">{item.resource?.name || 'Ressource inconnue'}</span>
                <Badge variant="danger">{TYPE_LABELS[item.type] || item.type}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.resource?.domains?.name} · {item.resource?.category?.name}</p>
            <p className="mt-2 text-sm font-medium">{formatDateTime(item.startDate)} → {formatDateTime(item.endDate)}</p>
            {item.reason && <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>}
        </div>
        <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={isDeleting} onClick={() => onDelete({id: item.id})}>
            <Trash2 className="h-4 w-4" />
            Supprimer l’occurrence
        </Button>
    </div>
);

export default function Unavailabilities() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState(createDefaultForm);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [resourceSearch, setResourceSearch] = useState('');
    const [filters, setFilters] = useState({resourceId: FILTER_ALL, categoryId: FILTER_ALL, type: FILTER_ALL, series: FILTER_ALL});
    const [openGroups, setOpenGroups] = useState({});

    const {data: resources = [], isLoading: isResourcesLoading} = useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources`);
            if (!response.ok) throw new Error('Erreur de récupération des ressources');
            return response.json();
        },
    });

    const {data: unavailabilities = [], isLoading: isUnavailabilitiesLoading} = useQuery({
        queryKey: ['resource-unavailabilities'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resource-unavailabilities`);
            if (!response.ok) throw new Error('Erreur de récupération des indisponibilités');
            return response.json();
        },
    });

    const selectedResources = useMemo(() => resources.filter((resource) => form.resourceIds.includes(resource.id)), [form.resourceIds, resources]);

    const visibleResources = useMemo(() => {
        const search = resourceSearch.trim().toLowerCase();
        if (!search) return resources;
        return resources.filter((resource) => [resource.name, resource.domains?.name, resource.category?.name]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search)));
    }, [resourceSearch, resources]);

    const filterOptions = useMemo(() => {
        const categories = new Map();
        resources.forEach((resource) => {
            if (resource.category?.id) categories.set(resource.category.id, resource.category.name);
        });

        return {
            categories: [...categories.entries()].sort((a, b) => collator.compare(a[1], b[1])),
        };
    }, [resources]);

    const allGroupedUnavailabilities = useMemo(() => {
        const groups = new Map();
        unavailabilities.forEach((item) => {
            const recurringGroupId = Number(item.recurringGroupId) || 0;
            const key = recurringGroupId > 0 ? `series-${recurringGroupId}` : `item-${item.id}`;
            groups.set(key, [...(groups.get(key) || []), item]);
        });

        return [...groups.values()]
            .map(createGroupSummary)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }, [unavailabilities]);

    const groupedUnavailabilities = useMemo(() => allGroupedUnavailabilities.filter((group) => {
        const resourceMatches = filters.resourceId === FILTER_ALL || group.resourceIds.includes(Number(filters.resourceId));
        const categoryMatches = filters.categoryId === FILTER_ALL || group.categoryIds.includes(Number(filters.categoryId));
        const typeMatches = filters.type === FILTER_ALL || group.types.includes(filters.type);
        const seriesMatches = filters.series === FILTER_ALL
            || (filters.series === FILTER_SINGLE && !group.isSeries)
            || (group.isSeries && group.recurringGroupId === Number(filters.series));

        return resourceMatches && categoryMatches && typeMatches && seriesMatches;
    }), [allGroupedUnavailabilities, filters]);

    const activeFilterCount = Object.values(filters).filter((value) => value !== FILTER_ALL).length;

    const updateFormDates = (patch) => {
        setForm((current) => {
            const next = {...current, ...patch};
            const start = parseLocalDate(next.startDate);
            const end = parseLocalDate(next.endDate);
            const limit = parseLocalDate(next.recurrenceLimit);

            if (start && end && end <= start) {
                next.endDate = toDateTimeLocalValue(addHours(start, 1));
            }
            const adjustedEnd = parseLocalDate(next.endDate);
            if (next.recurrenceUnit && adjustedEnd && (!limit || limit < adjustedEnd)) {
                next.recurrenceLimit = next.endDate;
            }
            if (!next.recurrenceUnit) next.recurrenceLimit = '';
            return next;
        });
    };

    const createMutation = useMutation({
        mutationFn: async () => {
            const occurrences = buildOccurrences(form);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resource-unavailabilities`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    resourceIds: form.resourceIds,
                    type: form.type,
                    reason: form.reason,
                    visibleToUsers: form.visibleToUsers,
                    occurrences,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.message || 'Création impossible');
            return payload;
        },
        onSuccess: () => {
            addToast({title: 'Indisponibilité créée', description: 'Les créneaux bloqués ont été enregistrés.', color: 'success'});
            queryClient.invalidateQueries({queryKey: ['resource-unavailabilities']});
            setForm(createDefaultForm());
            setIsCreateOpen(false);
        },
        onError: (error) => addToast({title: 'Erreur', description: error.message, color: 'danger'}),
    });

    const deleteMutation = useMutation({
        mutationFn: async ({id, recurringGroupId, deleteGroup = false}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resource-unavailabilities${deleteGroup ? `/group/${recurringGroupId}` : ''}`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: deleteGroup ? undefined : JSON.stringify({id}),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.message || 'Suppression impossible');
            return payload;
        },
        onSuccess: () => {
            addToast({title: 'Indisponibilité supprimée', color: 'success'});
            queryClient.invalidateQueries({queryKey: ['resource-unavailabilities']});
        },
        onError: (error) => addToast({title: 'Erreur', description: error.message, color: 'danger'}),
    });

    const toggleResource = (resourceId) => {
        setForm((current) => ({
            ...current,
            resourceIds: current.resourceIds.includes(resourceId)
                ? current.resourceIds.filter((id) => id !== resourceId)
                : [...current.resourceIds, resourceId],
        }));
    };

    const hasValidRecurrence = !form.recurrenceUnit || (form.recurrenceLimit && new Date(form.recurrenceLimit) >= new Date(form.endDate));
    const canSubmit = form.resourceIds.length > 0 && form.startDate && form.endDate && new Date(form.startDate) < new Date(form.endDate) && hasValidRecurrence && !createMutation.isPending;

    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="flex items-center gap-3 text-2xl font-black text-foreground">
                        <CalendarOff className="h-7 w-7 text-red-500" />
                        Indisponibilités
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">Bloquez une ou plusieurs ressources sans créer de réservation utilisateur.</p>
                </div>
                <Button type="button" onClick={() => {
                    setResourceSearch('');
                    setIsCreateOpen(true);
                }} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Créer
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Créneaux bloqués</CardTitle>
                        <CardDescription>Les séries sont regroupées sur une ligne dépliable. Filtrez par ressource, catégorie, usage ou série.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto] xl:items-end">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Ressource</label>
                            <Select value={filters.resourceId} onValueChange={(value) => setFilters((current) => ({...current, resourceId: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={FILTER_ALL}>Toutes les ressources</SelectItem>
                                    {resources.map((resource) => <SelectItem key={resource.id} value={String(resource.id)}>{resource.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Catégorie</label>
                            <Select value={filters.categoryId} onValueChange={(value) => setFilters((current) => ({...current, categoryId: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={FILTER_ALL}>Toutes les catégories</SelectItem>
                                    {filterOptions.categories.map(([id, name]) => <SelectItem key={id} value={String(id)}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Usage</label>
                            <Select value={filters.type} onValueChange={(value) => setFilters((current) => ({...current, type: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={FILTER_ALL}>Tous les usages</SelectItem>
                                    {Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Série</label>
                            <Select value={filters.series} onValueChange={(value) => setFilters((current) => ({...current, series: value}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={FILTER_ALL}>Tous</SelectItem>
                                    <SelectItem value={FILTER_SINGLE}>Sans série</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="button" variant="outline" disabled={!activeFilterCount} onClick={() => setFilters({resourceId: FILTER_ALL, categoryId: FILTER_ALL, type: FILTER_ALL, series: FILTER_ALL})}>
                            Réinitialiser
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-xl ">
                        {isUnavailabilitiesLoading ? (
                            <div className="flex h-40 items-center justify-center w-full"><Spinner className="h-5 w-5" /></div>
                        ) : groupedUnavailabilities.length ? groupedUnavailabilities.map((group) => {
                            const isOpen = group.isSeries ? Boolean(openGroups[group.id]) : true;
                            return (
                                <Collapsible key={group.id} open={isOpen} onOpenChange={(open) => setOpenGroups((current) => ({...current, [group.id]: open}))} className="border-b last:border-b-0">
                                    <div className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                                        <CollapsibleTrigger asChild disabled={!group.isSeries}>
                                            <button type="button" className={cn('min-w-0 text-left', group.isSeries && 'rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-bold text-foreground">{group.isSeries ? `Série #${group.recurringGroupId}` : group.resourceLabel}</span>
                                                    <Badge variant="danger">{group.typeLabel}</Badge>
                                                    {group.isSeries && <Badge variant="secondary">{group.items.length} occurrence(s)</Badge>}
                                                    {group.isSeries && <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />}
                                                </div>
                                                <p className="mt-1 text-sm text-muted-foreground">{group.resourceLabel} · {group.categoryLabel}</p>
                                                <p className="mt-2 text-sm font-medium">{formatDateTime(group.startDate)} → {formatDateTime(group.endDate)}</p>
                                                {group.first?.reason && <p className="mt-1 text-sm text-muted-foreground">{group.first.reason}</p>}
                                            </button>
                                        </CollapsibleTrigger>
                                        {group.isSeries ? (
                                            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate({recurringGroupId: group.recurringGroupId, deleteGroup: true})}>
                                                <Trash2 className="h-4 w-4" />
                                                Supprimer la récurrence
                                            </Button>
                                        ) : (
                                            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate({id: group.first.id})}>
                                                <Trash2 className="h-4 w-4" />
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                    {group.isSeries && (
                                        <CollapsibleContent className="border-t bg-muted/30">
                                            {group.items.map((item) => <BlockedSlotRow key={item.id} item={item} onDelete={(payload) => deleteMutation.mutate(payload)} isDeleting={deleteMutation.isPending} />)}
                                        </CollapsibleContent>
                                    )}
                                </Collapsible>
                            );
                        }) : (
                            <div className="p-6 text-sm text-muted-foreground text-center">Aucune indisponibilité enregistrée.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 p-0">
                    <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
                        <DialogTitle>Créer un créneau bloqué</DialogTitle>
                        <DialogDescription>Les occurrences créées sont prises en compte dans la recherche de disponibilité.</DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Ressources</label>
                            <Input
                                type="search"
                                value={resourceSearch}
                                onChange={(event) => setResourceSearch(event.target.value)}
                                placeholder="Rechercher par ressource, domaine ou catégorie..."
                                className="h-11"
                            />
                            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border p-3">
                                {isResourcesLoading ? <Spinner className="h-4 w-4" /> : visibleResources.length ? visibleResources.map((resource) => (
                                    <label key={resource.id} className="flex items-start gap-2 rounded-lg p-2 text-sm hover:bg-muted">
                                        <Checkbox checked={form.resourceIds.includes(resource.id)} onCheckedChange={() => toggleResource(resource.id)} />
                                        <span>
                                            <span className="block font-semibold">{resource.name}</span>
                                            <span className="text-xs text-muted-foreground">{resource.domains?.name} · {resource.category?.name}</span>
                                        </span>
                                    </label>
                                )) : <p className="p-2 text-sm text-muted-foreground">Aucune ressource trouvée.</p>}
                            </div>
                            {selectedResources.length > 0 && <p className="text-xs text-muted-foreground">{selectedResources.length} ressource(s) sélectionnée(s)</p>}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <DateTimePicker label="Début" value={form.startDate} onChange={(value) => updateFormDates({startDate: value})} />
                            <DateTimePicker label="Fin" value={form.endDate} min={form.startDate} onChange={(value) => updateFormDates({endDate: value})} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold">Récurrence</label>
                                <Select value={form.recurrenceUnit || 'none'} onValueChange={(value) => updateFormDates({recurrenceUnit: value === 'none' ? '' : value, recurrenceLimit: value === 'none' ? '' : form.recurrenceLimit || form.endDate})}>
                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Aucune</SelectItem>
                                        <SelectItem value="jour">Quotidienne</SelectItem>
                                        <SelectItem value="hebdomadaire">Hebdomadaire</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DateTimePicker label="Jusqu’au" disabled={!form.recurrenceUnit} value={form.recurrenceLimit || form.endDate} min={form.endDate} onChange={(value) => updateFormDates({recurrenceLimit: value})} />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Type</label>
                            <Select value={form.type} onValueChange={(value) => setForm({...form, type: value})}>
                                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(TYPE_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Motif</label>
                            <Textarea value={form.reason} onChange={(event) => setForm({...form, reason: event.target.value})} placeholder="Ex: inventaire annuel, événement interne..." />
                        </div>
                    </div>
                    <DialogFooter className="shrink-0 gap-3 border-t px-6 py-4 sm:items-center sm:justify-between">
                        <label className="flex items-center gap-2 text-sm font-medium">
                            <Checkbox checked={form.visibleToUsers} onCheckedChange={(checked) => setForm({...form, visibleToUsers: Boolean(checked)})} />
                            Afficher le motif aux utilisateurs
                        </label>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Annuler</Button>
                            <Button type="button" disabled={!canSubmit} onClick={() => createMutation.mutate()}>
                                {createMutation.isPending ? <><Spinner className="h-4 w-4" />Création...</> : 'Créer l’indisponibilité'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
