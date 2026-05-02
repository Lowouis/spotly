'use client';

import React, {useEffect, useState} from 'react';
import {addToast} from '@/lib/toast';
import ConversationChat from '@/components/messages/ConversationChat';

export default function EntryChat({entryId, className = '', onMessageSent, onMessagesRead, showHeader = true}) {
    const [conversationId, setConversationId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const fetchConversation = async () => {
            if (!entryId) return;

            setIsLoading(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry/${entryId}/messages`, {
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch entry conversation');

                const data = await response.json();
                if (!cancelled) setConversationId(data.conversation?.id || null);
            } catch (error) {
                console.error(error);
                addToast({title: 'Erreur', description: 'Impossible de récupérer les messages de la réservation.', color: 'danger', timeout: 4000});
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        fetchConversation();

        return () => {
            cancelled = true;
        };
    }, [entryId]);

    if (isLoading) {
        return (
            <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 ${className}`}>
                <p className="text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Chargement des messages...</p>
            </section>
        );
    }

    if (!conversationId) {
        return (
            <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950 ${className}`}>
                <p className="text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Aucune discussion pour cette réservation.</p>
            </section>
        );
    }

    return (
        <ConversationChat
            conversationId={conversationId}
            className={className}
            showHeader={showHeader}
            showParticipants={false}
            subtitle="Conversation liée à cette réservation"
            onMessageSent={onMessageSent}
            onMessagesRead={onMessagesRead}
        />
    );
}
