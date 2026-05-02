'use client';

import React, {useEffect, useRef, useState} from 'react';
import {useSession} from 'next-auth/react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Spinner} from '@/components/ui/spinner';
import {addToast} from '@/lib/toast';
import {PaperAirplaneIcon} from '@heroicons/react/24/solid';
import {PlusIcon} from '@heroicons/react/24/outline';

function getAuthorName(message, currentUserId) {
    if (Number(message.userId) === Number(currentUserId)) return 'Vous';
    return [message.user?.name, message.user?.surname].filter(Boolean).join(' ') || message.user?.username || 'Participant';
}

function formatMessageTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('fr-FR', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'}).format(new Date(value));
}

function getUserLabel(user) {
    return [user?.name, user?.surname].filter(Boolean).join(' ') || user?.username || user?.email || 'Utilisateur';
}

function getParticipantInitials(user) {
    const initials = [user?.name, user?.surname]
        .filter(Boolean)
        .map((value) => value.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return initials || (user?.username || user?.email || '?').charAt(0).toUpperCase();
}

function getParticipantColor(participant) {
    if (participant.role === 'OWNER') return 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800';
    if (participant.role === 'REPORTER') return 'bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800';
    if (participant.role === 'ADMIN' || ['ADMIN', 'SUPERADMIN'].includes(participant.user?.role)) return 'bg-red-100 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-800';
    return 'bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-800';
}

const statusLabels = {
    OPEN: 'Ouverte',
    RESOLVED: 'Résolue',
    ARCHIVED: 'Archivée',
};

export default function ConversationChat({conversationId, className = '', showParticipants = true, showHeader = true, subtitle = 'Conversation liée à l’événement', onMessageSent, onMessagesRead, manageParticipants = false}) {
    const {data: session} = useSession();
    const [conversation, setConversation] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isParticipantDialogOpen, setIsParticipantDialogOpen] = useState(false);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
    const [participantSearch, setParticipantSearch] = useState('');
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const bottomRef = useRef(null);
    const currentParticipant = conversation?.participants?.find((participant) => Number(participant.userId) === Number(session?.user?.id));
    const canManage = manageParticipants && (['ADMIN', 'SUPERADMIN'].includes(session?.user?.role) || currentParticipant?.role === 'OWNER');

    const fetchConversation = async () => {
        if (!conversationId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {credentials: 'include'});
            if (response.status === 404) {
                setConversation(null);
                return;
            }
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.message || 'Failed to fetch conversation');
            }
            setConversation(await response.json());
            onMessagesRead?.();
        } catch (error) {
            console.error(error);
            addToast({title: 'Erreur', description: error.message || 'Impossible de récupérer la discussion.', color: 'danger', timeout: 4000});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    useEffect(() => {
        if (!canManage) return;

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/users`, {credentials: 'include'});
                if (!response.ok) throw new Error('Failed to fetch users');
                setUsers(await response.json());
            } catch (error) {
                console.error(error);
            }
        };

        fetchUsers();
    }, [canManage]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [conversation?.messages]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const normalizedContent = content.trim();
        if (!normalizedContent || isSending) return;
        if (!conversationId) {
            addToast({title: 'Erreur', description: 'Discussion introuvable. Rechargez la page puis réessayez.', color: 'danger', timeout: 4000});
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({content: normalizedContent}),
            });
            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.message || 'Failed to send message');
            }
            const message = await response.json();
            setConversation((current) => ({...current, messages: [...(current?.messages || []), message]}));
            setContent('');
            onMessageSent?.(message);
        } catch (error) {
            console.error(error);
            addToast({title: 'Erreur', description: error.message || 'Impossible d’envoyer le message.', color: 'danger', timeout: 4000});
        } finally {
            setIsSending(false);
        }
    };

    const updateStatus = async (status) => {
        if (!canManage || conversation?.status === 'ARCHIVED' || status === conversation?.status) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({status}),
            });
            if (!response.ok) throw new Error('Failed to update status');
            const updatedConversation = await response.json();
            setConversation((current) => ({...current, status: updatedConversation.status}));
        } catch (error) {
            console.error(error);
            addToast({title: 'Erreur', description: 'Impossible de modifier le statut.', color: 'danger', timeout: 4000});
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusChange = (status) => {
        if (status === 'ARCHIVED') {
            setIsArchiveDialogOpen(true);
            return;
        }

        updateStatus(status);
    };

    const addParticipant = async () => {
        if (!selectedUserId || isUpdating) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({userId: selectedUserId}),
            });
            if (!response.ok) throw new Error('Failed to add participant');
            const participant = await response.json();
            setConversation((current) => ({...current, participants: [...(current?.participants || []).filter((item) => Number(item.userId) !== Number(participant.userId)), participant]}));
            setSelectedUserId('');
            setParticipantSearch('');
            setIsParticipantDialogOpen(false);
        } catch (error) {
            console.error(error);
            addToast({title: 'Erreur', description: 'Impossible d’ajouter le participant.', color: 'danger', timeout: 4000});
        } finally {
            setIsUpdating(false);
        }
    };

    const removeParticipant = async (userId) => {
        if (!canManage || isUpdating) return;

        setIsUpdating(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({removeUserId: userId}),
            });
            if (!response.ok) throw new Error('Failed to remove participant');
            setConversation((current) => ({...current, participants: (current?.participants || []).filter((participant) => Number(participant.userId) !== Number(userId))}));
        } catch (error) {
            console.error(error);
            addToast({title: 'Erreur', description: 'Impossible de retirer le participant.', color: 'danger', timeout: 4000});
        } finally {
            setIsUpdating(false);
        }
    };

    const messages = conversation?.messages || [];
    const participants = conversation?.participants || [];
    const participantIds = new Set((conversation?.participants || []).map((participant) => Number(participant.userId)));
    const availableUsers = users.filter((user) => !participantIds.has(Number(user.id)));
    const filteredUsers = availableUsers.filter((user) => {
        const query = participantSearch.trim().toLowerCase();
        if (!query) return true;
        return [user.name, user.surname, user.username, user.email]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
    });
    const inputDisabled = conversation?.status === 'ARCHIVED';

    return (
        <section className={`flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950 ${className}`}>
            {showHeader && <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-slate-50 px-5 py-4 dark:border-neutral-800 dark:from-neutral-950 dark:to-neutral-900">
                {showParticipants && participants.length > 0 && (
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            {participants.map((participant) => (
                                <span key={participant.id} className="group relative inline-flex">
                                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ring-1 ${getParticipantColor(participant)}`}>
                                        {getParticipantInitials(participant.user)}
                                    </span>
                                    <span className="absolute left-0 top-11 z-20 hidden w-56 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl group-hover:block dark:border-neutral-800 dark:bg-neutral-950">
                                        <span className="block text-sm font-black text-[#111827] dark:text-neutral-100">{getUserLabel(participant.user)}</span>
                                        <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-[#6b7585] dark:text-neutral-400">{participant.role}</span>
                                        {canManage && participant.role !== 'REPORTER' && Number(participant.userId) !== Number(session?.user?.id) && (
                                            <button type="button" onClick={() => removeParticipant(participant.userId)} disabled={isUpdating} className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950">
                                                Retirer de la discussion
                                            </button>
                                        )}
                                    </span>
                                </span>
                            ))}
                        </div>
                        {canManage && conversation?.status !== 'ARCHIVED' ? (
                            <div className="flex shrink-0 items-center gap-2">
                                <Button type="button" size="icon" variant="outline" onClick={() => setIsParticipantDialogOpen(true)} className="h-9 w-9 rounded-full" aria-label="Ajouter un participant">
                                    <PlusIcon className="h-4 w-4" />
                                </Button>
                                <select value={conversation?.status || 'OPEN'} onChange={(event) => handleStatusChange(event.target.value)} disabled={isUpdating} className="h-9 rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                                    {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                                </select>
                            </div>
                        ) : conversation?.status === 'ARCHIVED' ? (
                            <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">{statusLabels.ARCHIVED}</span>
                        ) : null}
                    </div>
                )}
            </div>}

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/40 p-5 [scrollbar-width:none] dark:bg-neutral-950 [&::-webkit-scrollbar]:hidden">
                {isLoading ? (
                    <div className="flex min-h-full items-center justify-center">
                        <Spinner className="h-8 w-8 text-[#ff2a2f]" />
                    </div>
                ) : messages.length ? messages.map((message) => {
                    const isMine = Number(message.userId) === Number(session?.user?.id);
                    if (message.system) {
                        return <div key={message.id} className="text-center text-xs font-semibold text-[#6b7585] dark:text-neutral-400">{message.content}</div>;
                    }

                    return (
                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                <span className="text-xs font-bold text-[#6b7585] dark:text-neutral-400">{getAuthorName(message, session?.user?.id)} · {formatMessageTime(message.createdAt)}</span>
                                <div className={`rounded-3xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${isMine ? 'rounded-tr-md bg-[#ff2a2f] text-white' : 'rounded-tl-md bg-white text-[#111827] ring-1 ring-slate-100 dark:bg-neutral-900 dark:text-neutral-100 dark:ring-neutral-800'}`}>{message.content}</div>
                            </div>
                        </div>
                    );
                }) : (
                    <p className="text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Aucun message pour cette discussion.</p>
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-end gap-3">
                    <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={inputDisabled ? 'Discussion archivée' : 'Écrire un message...'} rows={1} disabled={inputDisabled} className="min-h-12 resize-y rounded-2xl py-3 text-base" />
                    <Button type="submit" size="icon" disabled={inputDisabled || isSending || !content.trim()} className="h-12 w-12 shrink-0 rounded-2xl">
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </Button>
                </div>
            </form>
            <Dialog open={isParticipantDialogOpen} onOpenChange={(open) => {
                setIsParticipantDialogOpen(open);
                if (!open) {
                    setSelectedUserId('');
                    setParticipantSearch('');
                }
            }}>
                <DialogContent className="rounded-2xl border-slate-200 bg-white text-[#111827] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                    <DialogHeader>
                        <DialogTitle>Ajouter un participant</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <input value={participantSearch} onChange={(event) => setParticipantSearch(event.target.value)} placeholder="Rechercher un utilisateur" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition-colors focus:border-slate-400 dark:border-neutral-800 dark:bg-neutral-900" />
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                            {filteredUsers.length ? filteredUsers.map((user) => {
                                const isSelected = Number(selectedUserId) === Number(user.id);
                                return (
                                    <button key={user.id} type="button" onClick={() => setSelectedUserId(String(user.id))} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${isSelected ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200' : 'text-slate-700 hover:bg-slate-50 dark:text-neutral-200 dark:hover:bg-neutral-800'}`}>
                                        <span>{getUserLabel(user)}</span>
                                        {user.email && <span className="ml-3 truncate text-xs font-medium text-slate-400">{user.email}</span>}
                                    </button>
                                );
                            }) : (
                                <p className="px-3 py-6 text-center text-sm font-semibold text-slate-500">Aucun utilisateur trouvé.</p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsParticipantDialogOpen(false)}>Annuler</Button>
                        <Button type="button" onClick={addParticipant} disabled={!selectedUserId || isUpdating}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                <DialogContent className="rounded-2xl border-slate-200 bg-white text-[#111827] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                    <DialogHeader>
                        <DialogTitle>Archiver la discussion ?</DialogTitle>
                        <DialogDescription>Cette action est irréversible. Une fois archivée, la discussion ne pourra plus changer de statut ni recevoir de nouveaux messages.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>Annuler</Button>
                        <Button type="button" onClick={async () => {
                            await updateStatus('ARCHIVED');
                            setIsArchiveDialogOpen(false);
                        }} disabled={isUpdating} className="bg-red-600 text-white hover:bg-red-700">Archiver définitivement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
