import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {addToast} from "@/lib/toast";
import {useRouter} from "next/navigation";
import {useState} from "react";

export const CommentBeforeAction = ({item, isOpen, onOpenChange}) => {
    const router = useRouter();
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleCreateDiscussion = async () => {
        const normalizedMessage = message.trim();
        if (!normalizedMessage || isSending) return;

        setIsSending(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry/${item.id}/messages`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({content: normalizedMessage}),
            });

            if (!response.ok) throw new Error('Impossible de créer la discussion');

            setMessage("");
            onOpenChange(false);
            router.push(`/?msgId=${item.id}`);
        } catch (error) {
            console.error(error);
            addToast({
                title: "Erreur",
                description: error.message || "Impossible de créer la discussion.",
                timeout: 5000,
                color: "danger"
            });
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle asChild>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                     <svg className="w-5 h-5 text-neutral-600 dark:text-neutral-400" fill="none"
                                          stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
                                     </svg>
                                      <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">Créer une discussion</h3>
                            </div>
                             <p className="text-sm font-normal text-neutral-500 dark:text-neutral-400">Envoyez un message lié à cette réservation. La discussion sera accessible depuis Mon espace &gt; Messages.</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <form className="space-y-4">
                    <div className="form-group space-y-2">
                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="discussionMessage">Message</label>
                        <Textarea
                            id="discussionMessage"
                            name="discussionMessage"
                            rows={6}
                            className="form-input bg-neutral-50 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300"
                            placeholder="Écrire un message au demandeur..."
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                        />
                    </div>
                </form>
                <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCreateDiscussion}
                                    disabled={isSending || !message.trim()}
                                >
                                    {isSending ? "Création..." : "Créer la discussion"}
                                </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
