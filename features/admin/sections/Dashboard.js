'use client';

import React, {useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent} from "@/components/ui/chart";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {publicEnv} from "@/config/publicEnv";
import {useAdminContext} from "@/features/shared/context/Admin";
import {BuildingOffice2Icon, CalendarDaysIcon, ChartBarIcon, ClockIcon, CubeIcon, MapPinIcon, Squares2X2Icon} from "@heroicons/react/24/outline";
import {BarChart3, HardHat} from "lucide-react";
import {Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis} from "recharts";

const statusTone = {
    ACCEPTED: "text-emerald-600",
    USED: "text-emerald-600",
    WAITING: "text-orange-500",
    ENDED: "text-blue-600",
    REJECTED: "text-red-500",
};

const rangeLabels = {
    today: "Aujourd'hui",
    week: "Cette semaine",
    month: "Ce mois-ci",
};

const reservationsChartConfig = {
    count: {
        label: "Réservations",
        color: "hsl(var(--chart-1))",
    },
};

const statusChartConfig = {
    count: {
        label: "Réservations",
    },
    confirmed: {
        label: "Confirmée",
        color: "#22c55e",
    },
    waiting: {
        label: "En attente",
        color: "#f59e0b",
    },
    cancelled: {
        label: "Annulée",
        color: "#ef4444",
    },
    ended: {
        label: "Terminée",
        color: "#3b82f6",
    },
};

const topResourcesChartConfig = {
    count: {
        label: "Réservations",
        color: "#10b981",
    },
    label: {
        color: "hsl(var(--background))",
    },
};

const maintenanceChartConfig = {
    count: {
        label: "Événements",
        color: "#f97316",
    },
    label: {
        color: "hsl(var(--background))",
    },
};

const severityChartConfig = {
    count: {
        label: "Événements",
    },
    critical: {
        label: "Critique",
        color: "#ef4444",
    },
    medium: {
        label: "Moyenne",
        color: "#f59e0b",
    },
    low: {
        label: "Faible",
        color: "#22c55e",
    },
    unknown: {
        label: "Non qualifiée",
        color: "#94a3b8",
    },
};

function formatChartTick(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const weekday = new Intl.DateTimeFormat('fr-FR', {weekday: 'short'}).format(date).replace('.', '');
    const day = new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: '2-digit'}).format(date);
    return `${weekday} ${day}`;
}

function truncateChartLabel(value, maxLength = 18) {
    const label = String(value || "");
    return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

async function fetchDashboard({queryKey}) {
    const [, filters] = queryKey;
    const params = new URLSearchParams({range: filters.range, siteId: filters.siteId, categoryId: filters.categoryId});
    const response = await fetch(`${publicEnv.basePath}/api/dashboard?${params.toString()}`, {credentials: 'include'});

    if (!response.ok) throw new Error('Impossible de charger le tableau de bord');
    return response.json();
}

function formatDateTime(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isToday = start.toDateString() === new Date().toDateString();
    const date = isToday ? "Aujourd'hui" : new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short'}).format(start);
    const startTime = new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(start);
    const endTime = new Intl.DateTimeFormat('fr-FR', {hour: '2-digit', minute: '2-digit'}).format(end);
    return {date, time: `${startTime} - ${endTime}`};
}

function formatMaintenanceResolution(hours) {
    if (!hours) return "-";
    if (hours < 24) return `${hours}h`;
    return `${Math.round(hours / 24)}j`;
}

const MetricCard = ({title, value, helper, icon, accent = "orange"}) => {
    const tones = {
        orange: "bg-orange-50 text-orange-500",
        green: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        amber: "bg-amber-50 text-amber-500",
    };

    return (
        <Card className="h-full min-w-0 rounded-2xl border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="flex h-full items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight text-foreground">{title}</p>
                    <p className="mt-2 text-2xl font-black leading-none text-foreground">{value}</p>
                    {helper && <p className="mt-2 truncate text-xs font-medium text-muted-foreground">{helper}</p>}
                </div>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[accent] || tones.orange}`}>{icon}</span>
            </CardContent>
        </Card>
    );
};

const Dashboard = () => {
    const {setActiveSection, dashboardView} = useAdminContext();
    const [filters, setFilters] = useState({siteId: 'all', categoryId: 'all', range: 'week'});
    const {data, isLoading} = useQuery({queryKey: ['admin-dashboard', filters], queryFn: fetchDashboard});
    const reservationsChartData = (data?.reservationsByDay || []).map((item) => ({
        label: item.label,
        date: item.date,
        count: item.count,
    }));
    const statusChartData = (data?.statusItems || [])
        .filter((item) => item.count > 0)
        .map((item) => ({
            status: item.key,
            count: item.count,
            fill: `var(--color-${item.key})`,
        }));
    const topResourcesChartData = (data?.topResources || []).map((resource) => ({
        name: resource.name,
        count: resource.count,
        fill: "var(--color-count)",
    }));

    const metrics = data?.metrics || {};
    const maintenance = data?.maintenance || {};
    const maintenanceMetrics = maintenance.metrics || {};
    const maintenanceChartData = (maintenance.eventsByDay || []).map((item) => ({
        label: item.label,
        date: item.date,
        count: item.count,
    }));
    const severityChartData = (maintenance.severityItems || [])
        .filter((item) => item.count > 0)
        .map((item) => ({
            status: item.key,
            count: item.count,
            fill: `var(--color-${item.key})`,
        }));
    const maintenanceTopResourcesChartData = (maintenance.topResources || []).map((resource) => ({
        name: resource.name,
        count: resource.count,
        fill: "var(--color-count)",
    }));
    const isMaintenanceView = dashboardView === 'maintenance';
    const setFilter = (key, value) => {
        setFilters((previous) => previous[key] === value ? previous : {...previous, [key]: value});
    };

    return (
        <main className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-x-hidden p-3 text-foreground">
            <header className="mb-2 flex shrink-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-3xl font-black tracking-tight">Tableau de bord</h1>
                    <p className="mt-1 truncate text-sm font-medium text-muted-foreground">Vue d’ensemble des réservations et de l’utilisation des ressources</p>
                </div>
                <div className="grid shrink-0 gap-2 md:grid-cols-3 xl:w-[650px]">
                    <Select value={filters.siteId} onValueChange={(siteId) => setFilter('siteId', siteId)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm"><BuildingOffice2Icon className="mr-2 h-4 w-4" /><SelectValue placeholder="Tous les sites" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Tous les sites</SelectItem>{data?.filters?.domains?.map((domain) => <SelectItem key={domain.id} value={String(domain.id)}>{domain.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.range} onValueChange={(range) => setFilter('range', range)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm"><CalendarDaysIcon className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(rangeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={filters.categoryId} onValueChange={(categoryId) => setFilter('categoryId', categoryId)}>
                        <SelectTrigger className="h-10 rounded-xl text-sm"><Squares2X2Icon className="mr-2 h-4 w-4" /><SelectValue placeholder="Toutes catégories" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Toutes catégories</SelectItem>{data?.filters?.categories?.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-rows-[112px_minmax(0,1.25fr)_minmax(0,1fr)] gap-3">
                {isMaintenanceView ? (
                    <>
                <section className="grid min-h-0 min-w-0 grid-cols-[repeat(5,minmax(0,1fr))] gap-2">
                    <MetricCard title="Incidents ouverts" value={isLoading ? "..." : maintenanceMetrics.openEvents || 0} helper="Maintenance active" icon={<HardHat className="h-5 w-5" />} accent="amber" />
                    <MetricCard title="Ressources indisponibles" value={isLoading ? "..." : maintenanceMetrics.unavailableResources || 0} helper={`sur ${metrics.resourcesTotal || 0} au total`} icon={<CubeIcon className="h-5 w-5" />} />
                    <MetricCard title="Incidents critiques" value={isLoading ? "..." : maintenanceMetrics.criticalEvents || 0} helper="À prioriser" icon={<ChartBarIcon className="h-5 w-5" />} accent="orange" />
                    <MetricCard title="Temps moyen résolution" value={isLoading ? "..." : formatMaintenanceResolution(maintenanceMetrics.avgResolutionHours)} helper="Sur la période" icon={<ClockIcon className="h-5 w-5" />} accent="blue" />
                    <MetricCard title="Discussions ouvertes" value={isLoading ? "..." : maintenanceMetrics.openDiscussions || 0} helper="Événements actifs" icon={<BarChart3 className="h-5 w-5" />} accent="green" />
                </section>

                <section className="grid min-h-0 min-w-0 gap-3 xl:grid-cols-[1.55fr_0.65fr]">
                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="shrink-0 p-4 pb-1">
                            <CardTitle className="text-base">Incidents sur la période</CardTitle>
                            <CardDescription className="text-xs">Événements maintenance démarrés dans la période sélectionnée</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-4 pb-2 pt-0">
                            <ChartContainer config={maintenanceChartConfig} className="h-full min-h-0 w-full">
                                <BarChart accessibilityLayer data={maintenanceChartData} margin={{left: 0, right: 0, top: 8, bottom: 0}}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} tickMargin={8} axisLine={false} tickFormatter={formatChartTick} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="items-center p-4 pb-0 text-center">
                            <CardTitle className="text-base">Sévérité</CardTitle>
                            <CardDescription className="text-xs">Répartition des événements</CardDescription>
                        </CardHeader>
                        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 pb-5 pt-1">
                            {severityChartData.length ? (
                                <>
                                    <ChartContainer config={severityChartConfig} className="mx-auto aspect-square h-full max-h-[180px] min-h-0 w-full max-w-[180px]">
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={severityChartData} dataKey="count" nameKey="status" stroke="0" />
                                        </PieChart>
                                    </ChartContainer>
                                    <div className="grid grid-cols-2 justify-items-center gap-x-5 gap-y-2 text-sm font-medium">
                                        {severityChartData.map((item) => (
                                            <div key={item.status} className="flex items-center gap-2 whitespace-nowrap">
                                                <span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor: severityChartConfig[item.status]?.color || "#94a3b8"}} />
                                                <span>{severityChartConfig[item.status]?.label || item.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <p className="p-4 text-center text-sm text-muted-foreground">Aucune donnée.</p>}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid min-h-0 min-w-0 gap-3 xl:grid-cols-[1fr_1fr]">
                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="shrink-0 p-4 pb-1">
                            <CardTitle className="text-base">Ressources les plus impactées</CardTitle>
                            <CardDescription className="text-xs">Classement par événements maintenance</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-4 pt-0">
                            {maintenanceTopResourcesChartData.length ? (
                                <ChartContainer config={maintenanceChartConfig} className="h-full min-h-0 w-full">
                                    <BarChart accessibilityLayer data={maintenanceTopResourcesChartData} layout="vertical" margin={{left: 0, right: 8, top: 4, bottom: 4}}>
                                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={128} tickFormatter={(value) => truncateChartLabel(value)} />
                                        <XAxis dataKey="count" type="number" hide />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                        <Bar dataKey="count" radius={5} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>}
                        </CardContent>
                    </Card>

                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="flex shrink-0 flex-row items-start justify-between p-4 pb-1">
                            <CardTitle className="text-base leading-none">Maintenances à venir</CardTitle>
                            <button type="button" onClick={() => setActiveSection('maintenance')} className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Voir tout</button>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-0">
                            <div className="min-w-0 overflow-hidden rounded-xl">
                                {(maintenance.upcomingEvents || []).map((event) => {
                                    const date = formatDateTime(event.startDate, event.endDate || event.startDate);
                                    return <div key={event.id} className="grid h-10 grid-cols-[92px_minmax(120px,1fr)_110px_80px] items-center gap-3 border-b border-border px-3 last:border-b-0"><div className="text-xs leading-tight"><p className="font-semibold">{date.date}</p><p>{date.time}</p></div><div className="truncate text-sm font-semibold">{event.title}</div><div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"><MapPinIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{event.siteName}</span></div><div className="truncate text-right text-xs font-bold text-orange-600 dark:text-orange-400">{event.resourceName}</div></div>;
                                })}
                                {!maintenance.upcomingEvents?.length && <p className="p-4 text-sm text-muted-foreground">Aucune maintenance planifiée.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </section>
                    </>
                ) : (
                    <>
                <section className="grid min-h-0 min-w-0 grid-cols-[repeat(5,minmax(0,1fr))] gap-2">
                    <MetricCard title="Réservations aujourd'hui" value={isLoading ? "..." : metrics.todayReservations || 0} helper="Sur la journée" icon={<CalendarDaysIcon className="h-5 w-5" />} />
                    <MetricCard title={`Réservations ${rangeLabels[filters.range].toLowerCase()}`} value={isLoading ? "..." : metrics.periodReservations || 0} helper="Sur la période" icon={<CalendarDaysIcon className="h-5 w-5" />} />
                    <MetricCard title="Ressources disponibles" value={isLoading ? "..." : metrics.resourcesAvailable || 0} helper={`sur ${metrics.resourcesTotal || 0} au total`} icon={<CubeIcon className="h-5 w-5" />} accent="green" />
                    <MetricCard title="Taux d'occupation" value={isLoading ? "..." : `${metrics.occupancyRate || 0}%`} helper="Ressources non disponibles" icon={<ChartBarIcon className="h-5 w-5" />} accent="blue" />
                    <MetricCard title="Demandes en attente" value={isLoading ? "..." : metrics.waitingCount || 0} helper="À traiter" icon={<ClockIcon className="h-5 w-5" />} accent="amber" />
                </section>

                <section className="grid min-h-0 min-w-0 gap-3 xl:grid-cols-[1.55fr_0.65fr]">
                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="shrink-0 p-4 pb-1">
                            <CardTitle className="text-base">Réservations par période</CardTitle>
                            <CardDescription className="text-xs">Réservations dont le début est dans la période sélectionnée</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-4 pb-2 pt-0">
                            <ChartContainer config={reservationsChartConfig} className="h-full min-h-0 w-full">
                                <BarChart accessibilityLayer data={reservationsChartData} margin={{left: 0, right: 0, top: 8, bottom: 0}}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        tickMargin={8}
                                        axisLine={false}
                                        tickFormatter={formatChartTick}
                                    />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={8} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>

                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="items-center p-4 pb-0 text-center">
                            <CardTitle className="text-base">Répartition des statuts</CardTitle>
                            <CardDescription className="text-xs">Réservations qui chevauchent la période</CardDescription>
                        </CardHeader>
                        <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5 pb-5 pt-1">
                            {statusChartData.length ? (
                                <>
                                    <ChartContainer config={statusChartConfig} className="mx-auto aspect-square h-full max-h-[180px] min-h-0 w-full max-w-[180px]">
                                        <PieChart>
                                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                            <Pie data={statusChartData} dataKey="count" nameKey="status" stroke="0" />
                                        </PieChart>
                                    </ChartContainer>
                                    <div className="grid grid-cols-2 justify-items-center gap-x-5 gap-y-2 text-sm font-medium">
                                        {statusChartData.map((item) => (
                                            <div key={item.status} className="flex items-center gap-2 whitespace-nowrap">
                                                <span className="h-2.5 w-2.5 rounded-sm" style={{backgroundColor: statusChartConfig[item.status]?.color || "#94a3b8"}} />
                                                <span>{statusChartConfig[item.status]?.label || item.status}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : <p className="text-center text-sm text-muted-foreground">Aucune donnée sur la période.</p>}
                        </CardContent>
                    </Card>
                </section>

                <section className="grid min-h-0 min-w-0 gap-3 xl:grid-cols-[1fr_1fr]">
                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="shrink-0 p-4 pb-1">
                            <CardTitle className="text-base">Ressources les plus utilisées</CardTitle>
                            <CardDescription className="text-xs">Classement par nombre de réservations</CardDescription>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 p-4 pt-0">
                            {topResourcesChartData.length ? (
                                <ChartContainer config={topResourcesChartConfig} className="h-full min-h-0 w-full">
                                    <BarChart accessibilityLayer data={topResourcesChartData} layout="vertical" margin={{left: 0, right: 8, top: 4, bottom: 4}}>
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                            width={128}
                                            tickFormatter={(value) => truncateChartLabel(value)}
                                        />
                                        <XAxis dataKey="count" type="number" hide />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                        <Bar dataKey="count" radius={5} />
                                    </BarChart>
                                </ChartContainer>
                            ) : <p className="text-sm text-muted-foreground">Aucune donnée sur la période.</p>}
                        </CardContent>
                    </Card>

                    <Card className="flex min-h-0 min-w-0 flex-col rounded-2xl border-border bg-card text-card-foreground shadow-sm">
                        <CardHeader className="flex shrink-0 flex-row items-start justify-between p-4 pb-1">
                            <CardTitle className="text-base leading-none">Prochaines réservations</CardTitle>
                            <button type="button" onClick={() => setActiveSection('entries')} className="text-xs font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Voir tout</button>
                        </CardHeader>
                        <CardContent className="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-0">
                            <div className="min-w-0 overflow-hidden rounded-xl">
                                {(data?.upcomingEntries || []).map((entry) => {
                                    const date = formatDateTime(entry.startDate, entry.endDate);
                                    return <div key={entry.id} className="grid h-10 grid-cols-[92px_minmax(120px,1fr)_110px_78px] items-center gap-3 border-b border-border px-3 last:border-b-0"><div className="text-xs leading-tight"><p className="font-semibold">{date.date}</p><p>{date.time}</p></div><div className="truncate text-sm font-semibold">{entry.resourceName}</div><div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground"><MapPinIcon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{entry.siteName}</span></div><div className={`text-right text-xs font-bold ${statusTone[entry.moderate] || 'text-muted-foreground'}`}>{entry.moderate === 'WAITING' ? 'Attente' : 'Confirmée'}</div></div>;
                                })}
                                {!data?.upcomingEntries?.length && <p className="p-4 text-sm text-muted-foreground">Aucune prochaine réservation.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </section>
                    </>
                )}
            </div>
        </main>
    );
};

export default Dashboard;
