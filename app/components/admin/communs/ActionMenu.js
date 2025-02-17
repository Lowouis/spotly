import React from "react";
import { Button, ButtonGroup } from "@nextui-org/react";
import {CheckIcon, TrashIcon, XMarkIcon} from "@heroicons/react/24/solid";
import ModalCheckingBooking from "@/app/components/modals/ModalCheckingBooking";
import {PencilIcon} from "@heroicons/react/24/outline";
import {useAdminDataManagerContext} from "@/app/context/AdminDataManager";

export default function ActionMenuModerate({actions, entry, onActionDelete, onActionEdit}) {

    const { updateEntryModerate } = useAdminDataManagerContext()
    return (
        <>
            <div className="flex flex-row justify-start space-x-2">
            {actions.includes('edit') &&
                <div className="flex justify-center items-center ">
                    <Button
                        className="text-default-500 font-medium underline underline-offset-4"
                        size="sm"
                        variant="flat"
                        color="primary"
                        isIconOnly
                        radius="full"
                        onPress={onActionEdit}
                    >
                        <PencilIcon width="18" className="text-blue-500"/>
                    </Button>
                </div>
            }
            {actions.includes('delete') &&
                <div className="flex justify-center items-center">
                    <Button
                    className="text-default-500 font-medium underline underline-offset-4"
                    size="sm"
                    variant="flat"
                    color="danger"
                    isIconOnly
                    radius="full"
                    onPress={()=>{
                        onActionDelete()
                    }}
                    >
                        <TrashIcon width="18" className="text-red-500"/>
                    </Button>
                </div>
            }
            {actions.includes('confirm') &&
                <div className="flex justify-center items-center">
                    <Button
                    className="text-default-500 font-medium underline underline-offset-4"
                    size="sm"
                    variant="flat"
                    color="primary"
                    isIconOnly
                    radius="full"
                    onPress={()=>{
                        updateEntryModerate(entry, "ACCEPTED")
                    }}
                    >
                        <CheckIcon width="18" height="18" color={"green"}/>
                    </Button>
                </div>
            }
            {actions.includes('reject') &&
                <div className="flex justify-center items-center">
                    <Button
                        className="text-default-500 font-medium underline underline-offset-4"
                        size="sm"
                        variant="flat"
                        color="danger"
                        isIconOnly
                        radius="full"
                        onPress={()=>{
                            updateEntryModerate(entry, "REJECTED")
                        }}
                    >
                        <XMarkIcon width="18" height="18" color={"red"} />
                    </Button>
                </div>
            }
            {actions.includes('view') && (
                <ModalCheckingBooking entry={entry} adminMode={true} />
            )}
        </div>
            </>
    );
}