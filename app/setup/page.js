'use client';

import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import SnakeLogo from '@/components/utils/SnakeLogo';

const steps = [
    'Bienvenue',
    'Base de données',
    'SMTP',
    'LDAP',
    'SSO',
    'Données',
    'Identifiants',
];

const defaultForms = {
    smtp: {host: '', port: '587', username: '', password: '', fromEmail: '', fromName: 'Spotly', secure: false},
    ldap: {serverUrl: '', bindDn: '', adminCn: '', adminDn: '', adminPassword: '', emailDomain: ''},
    sso: {realm: '', kdc: '', adminServer: '', defaultDomain: '', serviceHost: '', keytabPath: ''},
};

function SpotlyLogo() {
    return (
        <div className="relative mx-auto h-28 w-28">
            <div className="absolute inset-2 rounded-full bg-[#ff2a2f]/10 blur-2xl setup-logo-glow" />
            <SnakeLogo className="relative h-28 w-28 text-[#111827] drop-shadow-sm setup-logo-float dark:text-neutral-50" title="Logo Spotly" />
        </div>
    );
}

function Stepper({currentStep}) {
    return (
        <div className="grid gap-2 rounded-2xl border border-[#dfe6ee] bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950 sm:grid-cols-7">
            {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-2 sm:block">
                    <div className={`h-2 flex-1 rounded-full ${index <= currentStep ? 'bg-[#d71920]' : 'bg-[#e8edf3] dark:bg-neutral-800'}`} />
                    <span className={`text-xs ${index === currentStep ? 'font-bold text-[#d71920]' : 'text-[#5f6b7a] dark:text-neutral-400'}`}>{step}</span>
                </div>
            ))}
        </div>
    );
}

function TextInput({label, type = 'text', value, onChange, placeholder}) {
    return (
        <label className="block space-y-1 text-sm">
            <span className="font-medium text-neutral-700 dark:text-neutral-200">{label}</span>
            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-11 w-full rounded-xl border border-[#dfe6ee] bg-white px-3 text-neutral-900 outline-none transition hover:border-neutral-400 focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/15 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
            />
        </label>
    );
}

function Card({title, description, children}) {
    return (
        <section className="rounded-3xl border border-[#dfe6ee] bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h1 className="text-2xl font-bold text-[#111827] dark:text-neutral-50">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{description}</p>
            <div className="mt-6">{children}</div>
        </section>
    );
}

function FooterActions({step, loading, children, onBack}) {
    return (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe6ee] pt-4 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={onBack} disabled={loading || step === 0} className="border-[#dfe6ee] text-[#5f6b7a] dark:border-neutral-700 dark:text-neutral-300">
                Retour
            </Button>
            <div className="flex flex-wrap justify-end gap-3">{children}</div>
        </div>
    );
}

async function postJson(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Action impossible');
    return data;
}

export default function SetupPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState(null);
    const [dbStatus, setDbStatus] = useState(null);
    const [forms, setForms] = useState(defaultForms);
    const [selectedMode, setSelectedMode] = useState('empty');
    const [credentials, setCredentials] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/setup/status')
            .then((response) => response.json())
            .then(setStatus)
            .catch(() => setStatus({completed: false, canDevReset: false}));
    }, []);

    useEffect(() => {
        if (step !== 1) return;
        fetch('/api/setup/database-status')
            .then((response) => response.json())
            .then(setDbStatus)
            .catch((requestError) => setDbStatus({ok: false, message: requestError.message}));
    }, [step]);

    const updateForm = (section, key, value) => {
        setForms((current) => ({...current, [section]: {...current[section], [key]: value}}));
    };

    const runAction = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action();
        } catch (actionError) {
            setError(actionError.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    const goBack = () => {
        setError('');
        setStep((current) => Math.max(0, current - 1));
    };

    const saveOptionalStep = (section) => runAction(async () => {
        await postJson(`/api/setup/${section}`, forms[section]);
        setStep((current) => current + 1);
    });

    const skipOptionalStep = (section) => runAction(async () => {
        await postJson(`/api/setup/${section}`, {skip: true});
        setStep((current) => current + 1);
    });

    const finalize = () => runAction(async () => {
        const result = await postJson('/api/setup/finalize', {mode: selectedMode});
        setCredentials(result);
        setStep(6);
    });

    const devReset = () => runAction(async () => {
        await postJson('/api/setup/dev-reset', {});
        setStatus({completed: false, canDevReset: true});
        setStep(0);
    });

    if (status?.completed && !status.canDevReset) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-neutral-50 p-6 dark:bg-neutral-950">
                <Card title="Spotly est déjà configuré" description="Le guide de premier lancement est fermé en production.">
                    <Button onClick={() => router.push('/login')}>Aller à la connexion</Button>
                </Card>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f8fb] px-4 py-8 text-[#111827] dark:bg-neutral-950 dark:text-neutral-50">
            <style jsx global>{`
                @keyframes setup-logo-float {
                    0%, 100% { transform: translateY(0) rotate(-2deg); }
                    50% { transform: translateY(-8px) rotate(2deg); }
                }
                @keyframes setup-logo-glow {
                    0%, 100% { opacity: .35; transform: scale(.96); }
                    50% { opacity: .75; transform: scale(1.08); }
                }
                .setup-logo-float { animation: setup-logo-float 3.2s ease-in-out infinite; }
                .setup-logo-glow { animation: setup-logo-glow 3.2s ease-in-out infinite; }
            `}</style>
            <div className="mx-auto max-w-4xl space-y-6">
                <header className="flex items-center justify-between rounded-2xl border border-[#dfe6ee] bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="flex items-center gap-3">
                        <SnakeLogo className="h-9 w-9 text-[#111827] dark:text-neutral-50" />
                        <div>
                            <div className="text-base font-bold">Spotly</div>
                            <div className="text-xs text-[#5f6b7a] dark:text-neutral-400">Guide de premier lancement</div>
                        </div>
                    </div>
                </header>
                <Stepper currentStep={step} />
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</div>}

                {status?.completed && status.canDevReset && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
                        <span>Mode développement : le setup est terminé, mais peut être relancé.</span>
                        <Button type="button" variant="outline" onClick={devReset} disabled={loading}>Relancer</Button>
                    </div>
                )}

                {step === 0 && (
                    <Card title="Bienvenue dans Spotly" description="Spotly centralise les réservations, la disponibilité et le suivi de maintenance de vos ressources internes : salles, véhicules, matériel informatique, audiovisuel ou tout autre équipement partagé.">
                        <SpotlyLogo />
                        <div className="mt-8 flex justify-center">
                            <Button size="lg" className="h-14 rounded-2xl bg-[#d71920] px-8 text-base text-white hover:bg-[#b9151b]" onClick={() => setStep(1)}>Configurer Spotly</Button>
                        </div>
                    </Card>
                )}

                {step === 1 && (
                    <Card title="Connexion à la base de données" description="Spotly utilise la variable DATABASE_URL fournie au démarrage. Cette étape vérifie seulement que l’application peut joindre la base configurée.">
                        <div className={`rounded-2xl border p-4 ${dbStatus?.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'}`}>
                            {dbStatus ? (dbStatus.ok ? 'Connexion réussie à MySQL.' : dbStatus.message || 'Connexion en cours...') : 'Vérification en cours...'}
                        </div>
                        <FooterActions step={step} loading={loading} onBack={goBack}>
                            <Button onClick={() => setStep(2)} disabled={!dbStatus?.ok} className="bg-[#d71920] text-white hover:bg-[#b9151b]">Continuer</Button>
                        </FooterActions>
                    </Card>
                )}

                {step === 2 && (
                    <Card title="Serveur SMTP" description="Configurez l’envoi des mails de réservation, maintenance et notifications. Vous pouvez ignorer cette étape et y revenir depuis l’administration.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextInput label="Host" value={forms.smtp.host} onChange={(value) => updateForm('smtp', 'host', value)} placeholder="smtp.example.com" />
                            <TextInput label="Port" value={forms.smtp.port} onChange={(value) => updateForm('smtp', 'port', value)} />
                            <TextInput label="Utilisateur" value={forms.smtp.username} onChange={(value) => updateForm('smtp', 'username', value)} />
                            <TextInput label="Mot de passe" type="password" value={forms.smtp.password} onChange={(value) => updateForm('smtp', 'password', value)} />
                            <TextInput label="Email expéditeur" value={forms.smtp.fromEmail} onChange={(value) => updateForm('smtp', 'fromEmail', value)} placeholder="spotly@example.com" />
                            <TextInput label="Nom expéditeur" value={forms.smtp.fromName} onChange={(value) => updateForm('smtp', 'fromName', value)} />
                        </div>
                        <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                            <input type="checkbox" checked={forms.smtp.secure} onChange={(event) => updateForm('smtp', 'secure', event.target.checked)} /> TLS direct
                        </label>
                        <FooterActions step={step} loading={loading} onBack={goBack}>
                            <Button type="button" variant="outline" onClick={() => skipOptionalStep('smtp')} disabled={loading}>Passer</Button>
                            <Button type="button" onClick={() => saveOptionalStep('smtp')} disabled={loading} className="bg-[#d71920] text-white hover:bg-[#b9151b]">{loading ? 'Test...' : 'Tester et continuer'}</Button>
                        </FooterActions>
                    </Card>
                )}

                {step === 3 && (
                    <Card title="Serveur LDAP" description="Configurez l’annuaire pour permettre la connexion et l’import d’utilisateurs. Cette étape est facultative.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextInput label="URL serveur" value={forms.ldap.serverUrl} onChange={(value) => updateForm('ldap', 'serverUrl', value)} placeholder="ldap://ldap.example.com" />
                            <TextInput label="Bind DN" value={forms.ldap.bindDn} onChange={(value) => updateForm('ldap', 'bindDn', value)} />
                            <TextInput label="Admin CN" value={forms.ldap.adminCn} onChange={(value) => updateForm('ldap', 'adminCn', value)} />
                            <TextInput label="Admin DN" value={forms.ldap.adminDn} onChange={(value) => updateForm('ldap', 'adminDn', value)} />
                            <TextInput label="Mot de passe admin" type="password" value={forms.ldap.adminPassword} onChange={(value) => updateForm('ldap', 'adminPassword', value)} />
                            <TextInput label="Domaine email" value={forms.ldap.emailDomain} onChange={(value) => updateForm('ldap', 'emailDomain', value)} placeholder="example.com" />
                        </div>
                        <FooterActions step={step} loading={loading} onBack={goBack}>
                            <Button type="button" variant="outline" onClick={() => skipOptionalStep('ldap')} disabled={loading}>Passer</Button>
                            <Button type="button" onClick={() => saveOptionalStep('ldap')} disabled={loading} className="bg-[#d71920] text-white hover:bg-[#b9151b]">{loading ? 'Test...' : 'Tester et continuer'}</Button>
                        </FooterActions>
                    </Card>
                )}

                {step === 4 && (
                    <Card title="SSO Kerberos" description="Activez la connexion automatique par ticket Kerberos. Cette étape est facultative et peut être configurée plus tard.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <TextInput label="Realm" value={forms.sso.realm} onChange={(value) => updateForm('sso', 'realm', value)} placeholder="EXAMPLE.LOCAL" />
                            <TextInput label="KDC" value={forms.sso.kdc} onChange={(value) => updateForm('sso', 'kdc', value)} placeholder="dc01.example.local:88" />
                            <TextInput label="Admin server" value={forms.sso.adminServer} onChange={(value) => updateForm('sso', 'adminServer', value)} placeholder="dc01.example.local:749" />
                            <TextInput label="Domaine par défaut" value={forms.sso.defaultDomain} onChange={(value) => updateForm('sso', 'defaultDomain', value)} placeholder="example.local" />
                            <TextInput label="Service host" value={forms.sso.serviceHost} onChange={(value) => updateForm('sso', 'serviceHost', value)} placeholder="spotly.example.local" />
                            <TextInput label="Chemin keytab" value={forms.sso.keytabPath} onChange={(value) => updateForm('sso', 'keytabPath', value)} placeholder="/etc/krb5.keytab" />
                        </div>
                        <FooterActions step={step} loading={loading} onBack={goBack}>
                            <Button type="button" variant="outline" onClick={() => skipOptionalStep('sso')} disabled={loading}>Passer
                            </Button>
                            <Button type="button" onClick={() => saveOptionalStep('sso')} disabled={loading} className="bg-[#d71920] text-white hover:bg-[#b9151b]">{loading ? 'Test...' : 'Tester et continuer'}</Button>
                        </FooterActions>
                    </Card>
                )}

                {step === 5 && (
                    <Card title="Démarrage des données" description="Choisissez comment initialiser Spotly. Si vous mettez à jour une installation 1.0.0, vos données existantes sont conservées et seules les configurations système manquantes sont ajoutées.">
                        <div className="grid gap-4 md:grid-cols-3">
                            {[
                                {mode: 'empty', title: 'Je démarre de 0', description: 'Crée uniquement les bases nécessaires et le compte administrateur.'},
                                {mode: 'demo', title: 'Je veux tester', description: 'Ajoute des sites, ressources, réservations et événements de démonstration.'},
                                {mode: 'upgrade', title: 'Je fais une mise à jour', description: 'Conserve les données d’une installation Spotly 1.0.0 et complète la configuration.'},
                            ].map((item) => (
                                <button key={item.mode} type="button" onClick={() => setSelectedMode(item.mode)} className={`rounded-2xl border p-5 text-left transition ${selectedMode === item.mode ? 'border-[#d71920] bg-[#fff1f1] dark:bg-red-950/20' : 'border-[#dfe6ee] bg-white dark:border-neutral-800 dark:bg-neutral-900'}`}>
                                    <span className="font-semibold text-neutral-950 dark:text-neutral-50">{item.title}</span>
                                    <span className="mt-2 block text-sm text-neutral-600 dark:text-neutral-300">{item.description}</span>
                                </button>
                            ))}
                        </div>
                        <FooterActions step={step} loading={loading} onBack={goBack}>
                            <Button type="button" onClick={finalize} disabled={loading} className="bg-[#d71920] text-white hover:bg-[#b9151b]">{loading ? 'Initialisation...' : selectedMode === 'upgrade' ? 'Finaliser la mise à jour' : 'Créer le compte admin'}</Button>
                        </FooterActions>
                    </Card>
                )}

                {step === 6 && credentials && (
                    <Card title={credentials.upgraded ? 'Mise à jour terminée' : 'Vos identifiants administrateur'} description={credentials.upgraded ? 'Votre installation existante est prête. Connectez-vous avec vos identifiants administrateur habituels.' : 'Copiez ces informations maintenant. Le mot de passe ne sera plus affiché après fermeture du guide.'}>
                        {credentials.upgraded ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                                Les données existantes ont été conservées. Spotly a uniquement complété les configurations nécessaires à la nouvelle version.
                            </div>
                        ) : (
                            <div className="space-y-3 rounded-2xl bg-neutral-950 p-5 font-mono text-sm text-neutral-50">
                                <div>Username: {credentials.username}</div>
                                <div>Email: {credentials.email}</div>
                                <div>Password: {credentials.password}</div>
                            </div>
                        )}
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            {!credentials.upgraded && <Button type="button" variant="outline" onClick={() => navigator.clipboard?.writeText(`Username: ${credentials.username}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`)}>Copier</Button>}
                            <Button type="button" onClick={() => router.push('/login')} className="bg-[#d71920] text-white hover:bg-[#b9151b]">Fermer le guide</Button>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}
