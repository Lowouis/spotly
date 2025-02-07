
import React from "react";
import {Accordion, AccordionItem} from "@nextui-org/react";
import HeadTitle from "@/app/components/utils/HeadTitle";


export default function faq() {

    const defaultContent =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";



    return (
        <div className="flex justify-center items-center flex-col m-3 p-2">
            <div className="flex flex-row  items-start w-full">
                <div>
                    <HeadTitle title="Spotly"/>
                </div>
            </div>
            <div className="flex justify-center items-center">
                <h1 className="text-2xl font-bold text-left">Questions fréquentes sur Spotly</h1>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
                <div className="flex justify-center items-center w-2/3">
                    <Accordion selectionMode="multiple" variant="light">
                        <AccordionItem key="1" aria-label="créer un compte" title="Comment créer un compte ?">
                            {defaultContent}
                        </AccordionItem>
                        <AccordionItem key="2" aria-label="???? 2" title="???? 2">
                            {defaultContent}
                        </AccordionItem>
                        <AccordionItem key="3" aria-label="???? 3" title="???? 3">
                            {defaultContent}
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>


        </div>
    );
}

