'use client'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Dashboard from "@/sections/Dashboard";
import Domains from "@/sections/Domains";
import {AdminProvider, useAdminContext} from "@/context/Admin";
import Categories from "@/sections/Categories";
import Resources from "@/sections/Resources";
import Users from "@/sections/Users";
import Entries from "@/sections/Entries";
import LDAP from "@/sections/LDAP";
import {ScrollShadow} from "@nextui-org/react";
import {useEffect, useState} from "react";
import {DataHandlerProvider} from "@/context/DataHandler";
import Sidebar from "@/components/admin/Sidebar";
import SMTPSettings from "@/sections/SMTP";
import {General} from "@/sections/General";

export default function Admin(){
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // or a loading spinner
    }
    return (

        <AdminProvider>
            <DataHandlerProvider>
            <div className={`flex flex-col ${GeistSans.variable} ${GeistMono.variable} antialiased h-full w-full`}>
                <div className="flex flex-row h-screen">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-y-auto">
                        <ScrollShadow className="h-screen" hideScrollBar size={25}>
                            <Content />
                        </ScrollShadow>
                    </div>
                </div>
            </div>
            </DataHandlerProvider>
        </AdminProvider>
    )
}


const Content = () => {
    const { activeSection } = useAdminContext()

    switch (activeSection) {
        case 'dashboard':
            return <Dashboard/>;
        case 'domains':
            return <Domains/>;
        case 'general':
            return <General/>;
        case 'categories':
            return <Categories />;
        case 'resources':
            return <Resources />;
        case 'users':
            return <Users />;
        case 'entries':
            return <Entries />;
        case 'ldap':
            return <LDAP />;
        case 'smtp':
            return <SMTPSettings/>;
        default:
            return <div>Section en cours de développement</div>;
    }
};