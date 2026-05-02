# Refactor Notes

## Conversations génériques

Le modèle générique `conversation` a été introduit pour les discussions liées aux événements ressource, avec `contextType` et `contextId`.

### À migrer plus tard

- Remplacer progressivement `entryMessage` par `conversation` avec `contextType = ENTRY`.
- Créer une conversation automatiquement pour chaque réservation qui possède déjà des messages.
- Migrer les lignes `entryMessage` vers `conversationMessage` en conservant `createdAt`, `userId`, `content` et `readAt` via `conversationParticipant.readAt`.
- Remplacer les endpoints `/api/entry/[id]/messages` et `/api/messages/conversations` par des endpoints `conversation` génériques.
- Faire pointer `EntryChat` vers `ConversationChat`, puis supprimer la logique spécifique `entryMessage`.
- Ajouter une notification générique `CONVERSATION_UNREAD` pour remplacer `MESSAGE_UNREAD` à terme.

### Options à garder en tête

- Statuts de conversation : `OPEN`, `RESOLVED`, `ARCHIVED`.
- Ajout/retrait manuel de participants depuis l’UI Maintenance.
- Mentions `@utilisateur` avec notifications ciblées.
- Pièces jointes/photos pour les incidents matériels.
- Messages système automatiques : création, indisponibilité, modification de fin prévue, clôture, suppression.
- Flux push/SSE plus tard basé sur `conversation.updatedAt` et `conversationParticipant.readAt`.
