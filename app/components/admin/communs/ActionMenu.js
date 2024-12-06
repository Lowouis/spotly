import React from "react";
import { Button, ButtonGroup } from "@nextui-org/react";
import { CheckIcon, XMarkIcon} from "@heroicons/react/24/solid";
import ModalCheckingBooking from "@/app/components/modals/ModalCheckingBooking";

export default function ActionMenuModerate({actions, entry}) {
    console.log(typeof actions);
    return (
        <ButtonGroup variant="flat" color="primary" size="lg" >
            {actions.includes('view') && <ModalCheckingBooking entry={entry} adminMode={true} />}
            {actions.includes('confirm') &&
            <Button
                isIconOnly={true}
                className="block"
                size="lg"
                color="default"
                variant="ghost"
                radius="sm"
                >
                <span className="flex justify-center items-center"><CheckIcon width="32" height="32" color={"green"}  /></span>
            </Button>}
            {actions.includes('reject') &&
                <Button
                    isIconOnly={true}
                    className="block"
                    size="lg"
                    color="default"
                    variant="ghost"
                >
                    <span className="flex justify-center items-center"><XMarkIcon width="32" height="32" color={"red"} /></span>
                </Button>}

        </ButtonGroup>
    );
}