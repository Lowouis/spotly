import React from "react";
import {Button, Tooltip, useDisclosure} from "@nextui-org/react";
import {TrashIcon} from "@heroicons/react/24/solid";
import ModalCheckingBooking from "@/app/components/modals/ModalCheckingBooking";
import {PencilIcon} from "@heroicons/react/24/outline";
import {CommentBeforeAction} from "@/app/components/modals/CommentBeforeAction";
import {IoHammerOutline} from "react-icons/io5";

export default function ActionMenuModerate({actions, entry, onActionDelete, onActionEdit}) {
    const {
        isOpen: isOpenCommentBeforeAction,
        onOpen: onOpenCommentBeforeAction,
        onOpenChange: onOpenChangeCommentBeforeAction
    } = useDisclosure();

    return (
        <>
            <div className="flex flex-row justify-start space-x-2">
            {actions.includes('edit') &&
                <div className="flex justify-center items-center ">
                    <Tooltip content="Modifier" color="default"  size={'sm'} showArrow>
                        <Button
                            className="text-default-500 font-medium underline underline-offset-4"
                            size="sm"
                            variant="flat"
                            color="default"
                            isIconOnly
                            radius="sm"
                            onPress={onActionEdit}
                        >
                            <PencilIcon width="18" className="text-neutral-700"/>
                        </Button>
                    </Tooltip>
                </div>
            }
            {actions.includes('delete') &&
                <div className="flex justify-center items-center">
                    <Tooltip content="Supprimer" color="default"  size={'sm'} showArrow>
                        <Button
                        className="text-default-500 font-medium underline underline-offset-4"
                        size="sm"
                        variant="flat"
                        color="default"
                        isIconOnly
                        radius="sm"
                        onPress={()=>{
                            onActionDelete()
                        }}
                        >
                            <TrashIcon width="18" className="text-neutral-700"/>
                        </Button>
                    </Tooltip>
                </div>
            }
                {actions.includes('reject') && actions.includes('confirm') &&
                <div className="flex justify-center items-center">
                    <Tooltip content="Decider" color="default" size={'sm'} showArrow>
                        <Button
                            className="text-default-500 font-medium underline underline-offset-4"
                            size="sm"
                            variant="flat"
                            color="default"
                            isIconOnly
                            radius="sm"
                            onPress={onOpenChangeCommentBeforeAction}
                        >
                            <IoHammerOutline size={20}/>
                        </Button>
                    </Tooltip>
                    <CommentBeforeAction
                        item={entry}
                        isOpen={isOpenCommentBeforeAction}
                        onOpen={onOpenCommentBeforeAction}
                        onOpenChange={onOpenChangeCommentBeforeAction}
                    />
                </div>
            }
            {actions.includes('view') && (
                <ModalCheckingBooking entry={entry} adminMode={true} />
            )}

            </div>
            </>
    );
}