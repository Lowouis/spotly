'use client'
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Sidebar from "@/app/components/admin/Sidebar";
import Dashboard from "@/app/admin/sections/Dashboard";
import Domains from "@/app/admin/sections/Domains";
import {AdminProvider, useAdminContext} from "@/app/context/Admin";
import Categories from "@/app/admin/sections/Categories";
import Resources from "@/app/admin/sections/Resources";
import Users from "@/app/admin/sections/Users";
import Entries from "@/app/admin/sections/Entries";
import LDAP from "@/app/admin/sections/LDAP";


export default function Admin(){

    return (
        <AdminProvider>
            <div className={`flex flex-col ${GeistSans.variable} ${GeistMono.variable} antialiased h-full w-full`}>
                <div className="flex flex-row">
                    <Sidebar  />
                    <div className="flex justify-start items-center w-full flex-col">
                        <div className="flex justify-center items-center h-16 text-neutral-700">
                            <span className="text-2xl font-bold">Admin</span>
                        </div>
                        <Content />
                    </div>
                </div>
            </div>
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
        default:
            return <div>Section en cours de développement</div>;
    }
};