'use client';

import {useEffect, useState} from 'react';
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import SnakeLogo from "@/components/utils/SnakeLogo";
import {metadata} from "@/config/metadata";
import packageJson from "@/package.json";

const repositoryUrl = "https://github.com/Lowouis/spotly";
const sponsorUrl = "https://buymeacoffee.com/glouis";

function normalizeVersion(version) {
    return String(version || '').replace(/^v/i, '').split('-')[0];
}

function compareVersions(left, right) {
    const leftParts = normalizeVersion(left).split('.').map((part) => Number.parseInt(part, 10) || 0);
    const rightParts = normalizeVersion(right).split('.').map((part) => Number.parseInt(part, 10) || 0);
    const maxLength = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < maxLength; index += 1) {
        const leftPart = leftParts[index] || 0;
        const rightPart = rightParts[index] || 0;
        if (leftPart > rightPart) return 1;
        if (leftPart < rightPart) return -1;
    }

    return 0;
}

const technicalItems = [
    {label: "Application", value: metadata.title},
    {label: "Version", value: packageJson.version},
    {label: "Environnement", value: process.env.NODE_ENV || "development"},
];

export default function About() {
    const [latestRelease, setLatestRelease] = useState(null);
    const [releaseError, setReleaseError] = useState(false);
    const updateAvailable = latestRelease?.tagName && compareVersions(latestRelease.tagName, packageJson.version) > 0;

    useEffect(() => {
        let active = true;

        fetch('/api/github/latest-release')
            .then((response) => response.ok ? response.json() : Promise.reject(new Error('release-check-failed')))
            .then((data) => {
                if (!active) return;
                setLatestRelease(data.available ? data : null);
            })
            .catch(() => {
                if (!active) return;
                setReleaseError(true);
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="p-4">
            <div className="mx-auto flex max-w-4xl flex-col gap-4">
                <Card className="shadow-none">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800">
                                <SnakeLogo className="h-10 w-10" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">À propos de Spotly</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">{metadata.description}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                            Spotly centralise la réservation, la gestion et le suivi des ressources partagées.
                            Cette interface admin permet de piloter les sites, catégories, ressources, utilisateurs,
                            réservations et intégrations système.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {technicalItems.map((item) => {
                                const isVersion = item.label === 'Version';

                                return (
                                    <div key={item.label} className="rounded-lg border bg-background p-3">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</div>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 font-medium">
                                            <span>{item.value}</span>
                                            {isVersion && updateAvailable && (
                                                <a href={latestRelease.htmlUrl} target="_blank" rel="noreferrer">
                                                    <Badge variant="warning">Nouvelle version disponible : {latestRelease.tagName}</Badge>
                                                </a>
                                            )}
                                            {isVersion && !updateAvailable && latestRelease?.tagName && <Badge variant="success">À jour</Badge>}
                                            {isVersion && releaseError && <Badge variant="neutral">Vérification release indisponible</Badge>}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Modules administrateur</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        {[
                            "Tableau de bord",
                            "Données",
                            "Réservations",
                            "Configuration",
                            "Restrictions",
                        ].map((module) => (
                            <Badge key={module} variant="neutral">{module}</Badge>
                        ))}
                    </CardContent>
                </Card>

                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle>Projet et contribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm leading-6 text-muted-foreground">
                            Spotly est maintenu comme un projet applicatif interne. Le dépôt permet de consulter le code,
                            suivre les évolutions, proposer des améliorations et préparer les contributions.
                        </p>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <a href={repositoryUrl} target="_blank" rel="noreferrer" className="rounded-lg border bg-background p-3 transition-colors hover:bg-muted">
                                <div className="text-sm font-semibold">GitHub</div>
                                <div className="mt-1 text-xs text-muted-foreground">Voir le dépôt</div>
                            </a>
                            <a href={`${repositoryUrl}/issues`} target="_blank" rel="noreferrer" className="rounded-lg border bg-background p-3 transition-colors hover:bg-muted">
                                <div className="text-sm font-semibold">Issues</div>
                                <div className="mt-1 text-xs text-muted-foreground">Signaler un problème</div>
                            </a>
                            <a href={`${repositoryUrl}/pulls`} target="_blank" rel="noreferrer" className="rounded-lg border bg-background p-3 transition-colors hover:bg-muted">
                                <div className="text-sm font-semibold">Contribuer</div>
                                <div className="mt-1 text-xs text-muted-foreground">Proposer une évolution</div>
                            </a>
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 shadow-none dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-neutral-950 dark:to-neutral-950">
                    <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <Badge variant="neutral" className="mb-3 bg-white/80 dark:bg-neutral-900/80">Carburant du projet</Badge>
                            <h3 className="text-lg font-black text-foreground">Offrir une pause café au serpent</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                                Si Spotly vous fait gagner du temps, vous pouvez soutenir son entretien, ses corrections
                                et les prochaines idées utiles. Promis, le café sera converti en commits.
                            </p>
                        </div>
                        <a href={sponsorUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] px-5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1f2937] dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-neutral-200">
                            Soutenir Spotly
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
