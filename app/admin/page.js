'use client'
import Dashboard from "@/sections/Dashboard";
import Domains from "@/sections/Domains";
import {AdminProvider, useAdminContext} from "@/context/Admin";
import Categories from "@/sections/Categories";
import Resources from "@/sections/Resources";
import Users from "@/sections/Users";
import Entries from "@/sections/Entries";
import LDAP from "@/sections/LDAP";
import {useEffect, useState} from "react";
import {DataHandlerProvider} from "@/context/DataHandler";
import Sidebar from "@/components/admin/Sidebar";
import SMTPSettings from "@/sections/SMTP";
import {General} from "@/sections/General";
import Localisations from "@/sections/Localisations";

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
                <div className="flex h-screen overflow-hidden">
                    <div className="flex flex-1">
                        <Sidebar/>
                        <main className="flex-1 overflow-y-auto">
                            <Content />
                        </main>
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
        case 'locations':
            return <Localisations/>;
        default:
            return <div>Section en cours de développement</div>;
    }
};