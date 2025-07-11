'use client'
import Dashboard from "@/sections/Dashboard";
import Domains from "@/sections/Domains";
import {AdminProvider, useAdminContext} from "@/context/Admin";
import Categories from "@/sections/Categories";
import Resources from "@/sections/Resources";
import Users from "@/sections/Users";
import Entries from "@/sections/Entries";
import LDAP from "@/sections/LDAP";
import SSO from "@/sections/SSO";
import {useEffect, useState} from "react";
import {DataHandlerProvider} from "@/context/DataHandler";
import Sidebar from "@/components/admin/Sidebar";
import SMTPSettings from "@/sections/SMTP";
import {General} from "@/sections/General";
import Localisations from "@/sections/Localisations";
import {useAuth} from "@/context/AuthContext";
import {Tab, Tabs} from "@heroui/react";
import {CiServer} from "react-icons/ci";
import {TbCertificate} from "react-icons/tb";
import {RiMailSettingsLine} from "react-icons/ri";
import TestSelect from "@/components/tests/TestSelect";

export default function Admin(){
    const [isClient, setIsClient] = useState(false);
    useAuth(); 

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
        case 'auth':
            return (
                <div className="p-3">
                    <div className="w-full max-w-2xl mx-auto">
                        <Tabs
                            aria-label="Options d'authentification"
                            color="primary"
                            variant="bordered"
                            size="lg"
                        >
                            <Tab
                                key="ldap"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <CiServer className="w-5 h-5"/>
                                        <span>LDAP</span>
                                    </div>
                                }
                            >
                                <LDAP/>
                            </Tab>
                            <Tab
                                key="sso"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <TbCertificate className="w-5 h-5"/>
                                        <span>SSO</span>
                                    </div>
                                }
                            >
                                <SSO/>
                            </Tab>
                            <Tab
                                key="smtp"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <RiMailSettingsLine className="w-5 h-5"/>
                                        <span>SMTP</span>
                                    </div>
                                }
                            >
                                <SMTPSettings/>
                            </Tab>
                        </Tabs>
                    </div>
                </div>
            );
        case 'locations':
            return <Localisations/>;
        case 'tests':
            return <TestSelect/>
        default:
            return <div>Section en cours de développement</div>;
    }
};