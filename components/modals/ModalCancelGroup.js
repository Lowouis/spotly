'use client';
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {addToast} from "@/lib/toast";

export default function ModalCancelGroup({isOpen, onOpenChange, entries, handleRefresh}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/group/${entries[0].recurringGroupId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.details || 'Erreur lors de l\'annulation du groupe');
            }
            return response.json();
        },
        onSuccess: () => {
            handleRefresh();
            queryClient.invalidateQueries({queryKey: ['isAvailable']});
            addToast({
                title: "Groupe annulé",
                description: "Toutes les réservations du groupe ont été annulées avec succès",
                color: "success"
            });
            onOpenChange(false);
        },
        onError: (error) => {
            addToast({
                title: "Erreur",
                description: error.message || "Une erreur est survenue lors de l'annulation du groupe",
                color: "danger"
            });
        },
    });

    const handleCancel = () => {
        mutation.mutate();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Annuler le groupe de réservations</DialogTitle>
                </DialogHeader>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Êtes-vous sûr de vouloir annuler toutes les réservations de ce groupe ? Cette action est irréversible et annulera {entries.length} réservation{entries.length > 1 ? 's' : ''}.
                </p>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Retour</Button>
                    <Button type="button" variant="destructive" onClick={handleCancel} disabled={mutation.isPending}>
                        {mutation.isPending ? "Annulation..." : "Annuler le groupe"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
