'use client';

import React, {useState} from "react";
import {Tab, Tabs} from "@heroui/react";
import LoginTab from "./LoginTab";
import LuckyEntryTab from "./LuckyEntryTab";

export default function ConnectionModal() {
    const [selected, setSelected] = useState("login");

    return (
        <div className="w-full max-w-md mx-auto">
            {/* En-tête avec titre */}
            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Connexion
                </h1>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Accédez à votre espace ou vérifiez vos réservations
                </p>
            </div>

            {/* Container principal avec bordure subtile */}
            <div
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-sm">
                {/* Tabs avec design épuré */}
                <Tabs
                    selectedKey={selected}
                    onSelectionChange={setSelected}
                    classNames={{
                        tabList: "gap-0 p-0 bg-neutral-50 dark:bg-neutral-800/50 rounded-t-xl border-b border-neutral-200 dark:border-neutral-700",
                        tab: "flex-1 h-12 text-sm font-medium text-neutral-600 dark:text-neutral-400 data-[hover=true]:text-neutral-900 dark:data-[hover=true]:text-neutral-100 data-[selected=true]:text-neutral-900 dark:data-[selected=true]:text-neutral-100 data-[selected=true]:bg-white dark:data-[selected=true]:bg-neutral-900 data-[selected=true]:border-b-2 data-[selected=true]:border-neutral-900 dark:data-[selected=true]:border-neutral-100 transition-all duration-200",
                        tabContent: "group-data-[selected=true]:text-neutral-900 dark:group-data-[selected=true]:text-neutral-100",
                        cursor: "hidden" // Cache le curseur par défaut
                    }}
                    variant="light"
                    size="lg"
                    radius="none"
                    fullWidth={true}
                >
                    <Tab
                        key="login"
                        title="Se connecter"
                        className="px-4 w-full"
                    >
                        <div className="p-6">
                            <LoginTab/>
                        </div>
                    </Tab>
                    <Tab
                        key="lucky"
                        title="J'ai réservé"
                        className="px-4"
                    >
                        <div className="p-6">
                            <LuckyEntryTab setSelected={setSelected}/>
                        </div>
                    </Tab>
                </Tabs>
            </div>
        </div>
    );
}

