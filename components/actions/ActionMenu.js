import React from "react";
import {Button} from "@/components/ui/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {TrashIcon} from "@heroicons/react/24/solid";
import ModalCheckingBooking from "@/components/modals/ModalCheckingBooking";
import {CheckIcon, ChatBubbleLeftRightIcon, PencilIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {CommentBeforeAction} from "@/components/modals/CommentBeforeAction";
import {useAdminDataManagerContext} from "@/features/shared/context/AdminDataManager";
import {addToast} from "@/lib/toast";
import {useEmail} from "@/features/shared/context/EmailContext";
import {useRouter} from "next/navigation";
import {Wrench} from "lucide-react";
import ResourceEventModal from "@/components/modals/ResourceEventModal";

const ActionTooltip = ({content, children}) => (
    <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
    </Tooltip>
);

const adminIconButtonClass = "h-10 w-10 border border-neutral-300 bg-white text-neutral-800 shadow-sm hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800";

export default function ActionMenuModerate({actions, entry, onActionDelete, onActionEdit, handleRefresh}) {
    const [isOpenCommentBeforeAction, setIsOpenCommentBeforeAction] = React.useState(false);
    const [isOpenResourceEvent, setIsOpenResourceEvent] = React.useState(false);
    const {updateEntryModerate, updateEntryGroupModerate} = useAdminDataManagerContext();
    const {mutate: sendEmail} = useEmail();
    const router = useRouter();
    const itemLabel = entry?.name || entry?.id || "l'élément";
    const hasDiscussion = Number(entry?._count?.messages || entry?.messages?.length || 0) > 0;
    const isRecurringGroup = Number(entry?.recurringGroupId || 0) > 0;
    const handleModeration = (moderate) => {
        if (isRecurringGroup) {
            updateEntryGroupModerate(entry, moderate);
        } else {
            updateEntryModerate(entry, moderate);
        }
        addToast({
            title: moderate === "ACCEPTED" ? "Réservation acceptée" : "Réservation refusée",
            description: isRecurringGroup
                ? (moderate === "ACCEPTED" ? "Toutes les réservations liées ont été acceptées." : "Toutes les réservations liées ont été refusées.")
                : (moderate === "ACCEPTED" ? "La réservation a été acceptée avec succès." : "La réservation a été refusée avec succès."),
            timeout: 5000,
            color: moderate === "ACCEPTED" ? "success" : "danger"
        });
        sendEmail({
            to: entry.user.email,
            subject: moderate === "ACCEPTED" ? "Votre réservation a été acceptée" : "Votre réservation a été refusée",
            templateName: moderate === "ACCEPTED" ? "reservationConfirmation" : "rejected",
            data: entry,
        });
    };

    return (
        <TooltipProvider>
            <div className="flex flex-row justify-start space-x-2">
            {actions.includes('edit') &&
                <div className="flex justify-center items-center ">
                    <ActionTooltip content="Modifier">
                        <Button
                            className={adminIconButtonClass}
                            size="icon"
                            variant="default"
                            onClick={onActionEdit}
                            aria-label={`Modifier ${itemLabel}`}
                        >
                            <PencilIcon width="18"/>
                        </Button>
                    </ActionTooltip>
                </div>
            }
            {actions.includes('delete') &&
                <div className="flex justify-center items-center">
                    <ActionTooltip content="Supprimer">
                        <Button
                        className={adminIconButtonClass}
                        size="icon"
                        variant="default"
                        onClick={()=>{
                            onActionDelete()
                        }}
                        aria-label={`Supprimer ${itemLabel}`}
                        >
                            <TrashIcon width="18"/>
                        </Button>
                    </ActionTooltip>
                </div>
            }
            {actions.includes('maintenance') &&
                <div className="flex justify-center items-center">
                    <ActionTooltip content="Ajouter un événement de maintenance">
                        <Button
                            className={adminIconButtonClass}
                            size="icon"
                            variant="default"
                            onClick={() => setIsOpenResourceEvent(true)}
                            aria-label={`Ajouter un événement pour ${itemLabel}`}
                        >
                            <Wrench className="h-5 w-5"/>
                        </Button>
                    </ActionTooltip>
                    <ResourceEventModal
                        open={isOpenResourceEvent}
                        onOpenChange={setIsOpenResourceEvent}
                        resource={entry}
                        mode="admin"
                        onCreated={handleRefresh}
                    />
                </div>
            }
            {actions.includes('reject') && (
                <div className="flex justify-center items-center">
                    <ActionTooltip content={isRecurringGroup ? "Refuser toute la série" : "Refuser"}>
                        <Button
                            className={adminIconButtonClass}
                            size="icon"
                            variant="default"
                            onClick={() => handleModeration("REJECTED")}
                            aria-label={`Refuser ${itemLabel}`}
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </Button>
                    </ActionTooltip>
                </div>
            )}
            {actions.includes('confirm') && (
                <div className="flex justify-center items-center">
                    <ActionTooltip content={isRecurringGroup ? "Accepter toute la série" : "Accepter"}>
                        <Button
                            className={adminIconButtonClass}
                            size="icon"
                            variant="default"
                            onClick={() => handleModeration("ACCEPTED")}
                            aria-label={`Accepter ${itemLabel}`}
                        >
                            <CheckIcon className="h-5 w-5" />
                        </Button>
                    </ActionTooltip>
                </div>
            )}
            {actions.includes('reject') && actions.includes('confirm') &&
                <div className="flex justify-center items-center">
                    <ActionTooltip content={hasDiscussion ? "Voir la discussion" : "Créer une discussion"}>
                        <Button
                            className={adminIconButtonClass}
                            size="icon"
                            variant="default"
                            onClick={() => {
                                if (hasDiscussion) {
                                    router.push(`/?msgId=${entry.id}`);
                                    return;
                                }

                                setIsOpenCommentBeforeAction(true);
                            }}
                            aria-label={`${hasDiscussion ? "Voir" : "Créer"} une discussion pour ${itemLabel}`}
                        >
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                        </Button>
                    </ActionTooltip>
                    <CommentBeforeAction
                        item={entry}
                        isOpen={isOpenCommentBeforeAction}
                        onOpenChange={setIsOpenCommentBeforeAction}
                    />
                </div>
            }
            {actions.includes('view') && (
                <ModalCheckingBooking entry={entry} adminMode={true} handleRefresh={handleRefresh}/>
            )}
            </div>
        </TooltipProvider>
    );
}
