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
import Localisations from "@/features/admin/sections/Localisations";
import {useAuth} from "@/features/shared/context/AuthContext";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {CiServer} from "react-icons/ci";
import {TbCertificate} from "react-icons/tb";
import {RiMailSettingsLine} from "react-icons/ri";
import {ConfigStatusProvider, useConfigStatus} from "@/features/shared/context/ConfigStatusContext";
import About from "@/features/admin/sections/About";
import ReservationSettings from "@/features/admin/sections/ReservationSettings";
import ProtectionLevels from "@/features/admin/sections/ProtectionLevels";
import MailConfig from "@/features/admin/sections/MailConfig";
import Maintenance from "@/features/admin/sections/Maintenance";

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
        case 'categories':
            return <Categories />;
        case 'resources':
            return <Resources />;
        case 'users':
            return <Users />;
        case 'entries':
            return <Entries />;
        case 'waitingEntries':
            return <Entries waitingOnly />;
        case 'maintenance':
            return <Maintenance />;
        case 'auth':
            return (
                <div className="p-3">
                    <div className="w-full max-w-2xl mx-auto">
                        <Tabs defaultValue="ldap">
                            <TabsList className="grid h-auto w-full grid-cols-3">
                            <TabsTrigger value="ldap">
                                    <div className="flex items-center space-x-2">
                                        <CiServer className="w-5 h-5"/>
                                        <span>LDAP</span>
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.ldap)}`}></div>
                                    </div>
                            </TabsTrigger>
                            <TabsTrigger value="sso">
                                    <div className="flex items-center space-x-2">
                                        <TbCertificate className="w-5 h-5"/>
                                        <span>SSO</span>
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.sso)}`}></div>
                                    </div>
                            </TabsTrigger>
                            <TabsTrigger value="smtp">
                                    <div className="flex items-center space-x-2">
                                        <RiMailSettingsLine className="w-5 h-5"/>
                                        <span>SMTP</span>
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusColor(configStatuses.smtp)}`}></div>
                                    </div>
                            </TabsTrigger>
                            </TabsList>
                            <TabsContent value="ldap">
                                <LDAP/>
                            </TabsContent>
                            <TabsContent value="sso">
                                <SSO/>
                            </TabsContent>
                            <TabsContent value="smtp">
                                <SMTPSettings/>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            );
        case 'locations':
            return <Localisations/>;
        case 'reservationSettings':
            return <ReservationSettings/>;
        case 'protectionLevels':
            return <ProtectionLevels/>;
        case 'mailConfig':
            return <div className="p-3"><div className="w-full max-w-4xl mx-auto"><MailConfig/></div></div>;
        case 'about':
            return <About/>;
        default:
            return <div>Section en cours de développement</div>;
    }
};
