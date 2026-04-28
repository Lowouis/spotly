'use client'
import Dashboard from "@/features/admin/sections/Dashboard";
import Domains from "@/features/admin/sections/Domains";
import {AdminProvider, useAdminContext} from "@/features/shared/context/Admin";
import Categories from "@/features/admin/sections/Categories";
import Resources from "@/features/admin/sections/Resources";
import Users from "@/features/admin/sections/Users";
import Entries from "@/features/admin/sections/Entries";
import LDAP from "@/features/admin/sections/LDAP";
import SSO from "@/features/admin/sections/SSO";
import {useEffect, useState} from "react";
import {DataHandlerProvider} from "@/features/shared/context/DataHandler";
import Sidebar from "@/components/admin/Sidebar";
import SMTPSettings from "@/features/admin/sections/SMTP";
import {General} from "@/features/admin/sections/General";
import Localisations from "@/features/admin/sections/Localisations";
import {useAuth} from "@/features/shared/context/AuthContext";
import {Tab, Tabs} from "@heroui/react";
import {CiServer} from "react-icons/ci";
import {TbCertificate} from "react-icons/tb";
import {RiMailSettingsLine} from "react-icons/ri";
import Logs from "@/features/admin/sections/Logs";
import {ConfigStatusProvider, useConfigStatus} from "@/features/shared/context/ConfigStatusContext";

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
                <ConfigStatusProvider>
                    <div className="flex h-screen overflow-hidden">
                        <div className="flex flex-1">
                            <Sidebar/>
                            <main className="flex-1 overflow-y-auto">
                                <Content/>
                            </main>
                        </div>
                    </div>
                </ConfigStatusProvider>
            </DataHandlerProvider>
        </AdminProvider>
    )
}


const Content = () => {
    const {activeSection} = useAdminContext();
    const {configStatuses, getStatusColor} = useConfigStatus();

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
                            color="default"
                            variant="underlined"
                            size="lg"
                        >
                            <Tab
                                key="ldap"
                                title={
                                    <div className="flex items-center space-x-2">
                                        <CiServer className="w-5 h-5"/>
                                        <span>LDAP</span>
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.ldap)}`}></div>
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
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.sso)}`}></div>
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
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.smtp)}`}></div>
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
        case 'logs':
            return <Logs/>
        default:
            return <div>Section en cours de développement</div>;
    }
};