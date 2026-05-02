'use client';

import React, {useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
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
                <Tabs value={selected} onValueChange={setSelected}>
                    <TabsList className="grid h-12 w-full grid-cols-2 gap-0 rounded-b-none rounded-t-xl border-b border-neutral-200 bg-neutral-50 p-0 dark:border-neutral-700 dark:bg-neutral-800/50">
                        <TabsTrigger value="login" className="h-12 rounded-none rounded-tl-xl data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100">Se connecter</TabsTrigger>
                        <TabsTrigger value="lucky" className="h-12 rounded-none rounded-tr-xl data-[state=active]:border-b-2 data-[state=active]:border-neutral-900 dark:data-[state=active]:border-neutral-100">J&apos;ai réservé</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="m-0 px-4 w-full">
                        <div className="p-6">
                            <LoginTab/>
                        </div>
                    </TabsContent>
                    <TabsContent value="lucky" className="m-0 px-4">
                        <div className="p-6">
                            <LuckyEntryTab setSelected={setSelected}/>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
