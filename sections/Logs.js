'use client'

import React, {useEffect, useMemo, useState} from 'react';
import {Button, Card, CardBody, CardHeader, Input, Listbox, ListboxItem, Spinner} from '@heroui/react';

export default function Logs() {
    const [files, setFiles] = useState([]);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState('');
    const [lines, setLines] = useState(null);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [loadingContent, setLoadingContent] = useState(false);
    const [error, setError] = useState('');

    const filteredFiles = useMemo(() => {
        if (!filter) return files;
        const f = filter.toLowerCase();
        return files.filter((name) => name.toLowerCase().includes(f));
    }, [files, filter]);

    async function loadFiles() {
        setLoadingFiles(true);
        setError('');
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/logs`);
            const data = await resp.json();
            const list = Array.isArray(data.files) ? data.files : [];
            setFiles(list);
            if (list.length && !selected) {
                setSelected(list[0]);
            }
        } catch (e) {
            setError('Erreur lors du chargement de la liste des fichiers.');
        } finally {
            setLoadingFiles(false);
        }
    }

    function extractDateFromFilename(name) {
        const m = name.match(/cron-(\d{4}-\d{2}-\d{2})\.log$/);
        return m ? m[1] : '';
    }

    async function loadContent(filename) {
        if (!filename) return;
        const date = extractDateFromFilename(filename);
        if (!date) {
            setLines([]);
            return;
        }
        setLoadingContent(true);
        setError('');
        setLines(null);
        try {
            const resp = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/logs/${date}`);
            if (resp.status === 404) {
                setError(`Aucun fichier de logs pour la date ${date}.`);
                setLines(null);
            } else if (!resp.ok) {
                const text = await resp.text();
                setError(text || 'Erreur lors de la récupération des logs.');
            } else {
                const data = await resp.json();
                setLines(Array.isArray(data.lines) ? data.lines : []);
            }
        } catch (e) {
            setError('Erreur réseau lors de la récupération des logs.');
        } finally {
            setLoadingContent(false);
        }
    }

    useEffect(() => {
        loadFiles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selected) {
            loadContent(selected);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    return (
        <div className="p-4 h-full overflow-hidden">
            <h1 className="text-xl font-semibold mb-4">Logs</h1>
            <div className="flex flex-row gap-4 h-full m-1">
                <div className="w-1/4 h-full sticky top-4 self-start">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex items-center justify-between gap-2">
                            <span className="font-medium">Fichiers</span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="flat" onPress={loadFiles} disabled={loadingFiles}>
                                    {loadingFiles ? '...' : 'Rafraîchir'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody className="flex flex-col min-h-0">
                            <Input
                                size="sm"
                                labelPlacement="outside"
                                placeholder="Filtrer (ex: 2025-03)"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="mb-2"
                            />
                            {loadingFiles ? (
                                <div className="flex items-center justify-center py-6">
                                    <Spinner label="Chargement..."/>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto min-h-0">
                                    <Listbox
                                        aria-label="Liste des fichiers de logs"
                                        selectionMode="single"
                                        selectedKeys={selected ? [selected] : []}
                                        onSelectionChange={(keys) => {
                                            const [key] = Array.from(keys);
                                            if (!key) {
                                                setSelected('');
                                                setLines(null);
                                                setError('');
                                                return;
                                            }
                                            setSelected(key);
                                        }}
                                        className="min-h-0"
                                    >
                                        {filteredFiles.length === 0 && (
                                            <ListboxItem key="__empty" isReadOnly>
                                                Aucun fichier
                                            </ListboxItem>
                                        )}
                                        {filteredFiles.map((name) => (
                                            <ListboxItem key={name} textValue={name}>
                                                {name}
                                            </ListboxItem>
                                        ))}
                                    </Listbox>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                <div className="w-3/4 h-full">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex items-center justify-between">
                            <span className="font-medium truncate"
                                  title={selected || ''}>{selected || 'Aucun fichier sélectionné'}</span>
                            {selected && (
                                <Button size="sm" variant="flat" onPress={() => loadContent(selected)}
                                        disabled={loadingContent}>
                                    {loadingContent ? '...' : 'Recharger'}
                                </Button>
                            )}
                        </CardHeader>
                        <CardBody className="flex-1 overflow-auto min-h-0">
                            {loadingContent && (
                                <div className="flex items-center justify-center py-6">
                                    <Spinner label="Chargement..."/>
                                </div>
                            )}
                            {!loadingContent && error && (
                                <div className="text-red-600 mb-2">{error}</div>
                            )}

                            {!loadingContent && lines && (
                                <div className="bg-black text-green-400 p-3 rounded text-sm">
                                    {lines.map((line, idx) => (
                                        <pre key={idx} className="whitespace-pre-wrap m-0">{line}</pre>
                                    ))}
                                </div>
                            )}
                            {!loadingContent && !error && lines && lines.length === 0 && (
                                <div className="text-sm text-gray-500">Fichier vide.</div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
} 