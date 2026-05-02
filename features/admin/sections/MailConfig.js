'use client';

import {useEffect, useState} from 'react';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Switch} from '@/components/ui/switch';
import {Spinner} from '@/components/ui/spinner';
import {EMAIL_TEMPLATE_GROUPS} from '@/config/emailTemplates';
import {addToast} from '@/lib/toast';

export default function MailConfig() {
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [savingTemplate, setSavingTemplate] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/settings`);
                const data = await response.json();

                if (!response.ok) throw new Error(data.message || 'Impossible de charger la configuration mail');
                setSettings(data.settings || {});
            } catch (error) {
                addToast({
                    title: 'Configuration mail',
                    description: error.message || 'Impossible de charger la configuration mail',
                    color: 'danger',
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    const setTemplateEnabled = async (templateName, enabled) => {
        const previousValue = settings[templateName] ?? true;
        setSavingTemplate(templateName);
        setSettings(prev => ({...prev, [templateName]: enabled}));

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/mail/settings`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({settings: {[templateName]: enabled}}),
            });
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Impossible de sauvegarder la configuration mail');
            setSettings(data.settings || {});
            addToast({
                title: 'Configuration mail',
                description: 'Préférence sauvegardée',
                color: 'success',
            });
        } catch (error) {
            setSettings(prev => ({...prev, [templateName]: previousValue}));
            addToast({
                title: 'Configuration mail',
                description: error.message || 'Impossible de sauvegarder la configuration mail',
                color: 'danger',
            });
        } finally {
            setSavingTemplate(null);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                    <p className="text-xl font-semibold">Configuration des notifications e-mail</p>
                    <p className="text-sm text-muted-foreground">Choisissez quels e-mails automatiques Spotly peut envoyer.</p>
                </div>
            </CardHeader>
            <CardContent className="border-t pt-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spinner label="Chargement de la configuration"/>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {EMAIL_TEMPLATE_GROUPS.map(group => (
                            <section key={group.id} className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-neutral-950 dark:text-neutral-50">{group.title}</h3>
                                    <p className="text-sm text-muted-foreground">{group.description}</p>
                                </div>
                                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {group.templates.map(template => {
                                        const enabled = settings[template.templateName] ?? true;

                                        return (
                                            <div key={template.templateName} className="flex items-center justify-between gap-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{template.label}</p>
                                                    <p className="text-xs text-muted-foreground">{template.templateName}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-medium text-muted-foreground">{enabled ? 'Oui' : 'Non'}</span>
                                                    {savingTemplate === template.templateName && <Spinner className="h-4 w-4"/>}
                                                    <Switch checked={enabled} disabled={Boolean(savingTemplate)} onCheckedChange={(checked) => setTemplateEnabled(template.templateName, checked)}/>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
