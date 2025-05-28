'use client';

import Banner from "@/components/utils/banner";
import React, {useState} from "react";
import {Card, CardBody, Tab, Tabs} from "@nextui-org/react";
import LoginTab from "./LoginTab";
import LuckyEntryTab from "./LuckyEntryTab";

export function ConnectionModal() {
    const [selected, setSelected] = useState("login");

    return (
        <div className="mx-auto mt-4">
            <Banner/>
            <div className="w-full flex justify-center items-center mt-5 flex-col">
                <Card fullWidth className="max-w-full w-[400px]" shadow="md">
                    <CardBody className="overflow-hidden">
                        <Tabs
                            fullWidth
                            aria-label="tabs_anons_actions"
                            selectedKey={selected}
                            size="lg"
                            onSelectionChange={setSelected}
                        >
                            <Tab key="login" title="Se connecter">
                                <LoginTab/>
                            </Tab>
                            <Tab key="sign-up" title="J'ai réservé">
                                <LuckyEntryTab setSelected={setSelected}/>
                            </Tab>
                        </Tabs>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

