import { createContext, useContext, useState } from 'react';
import {useSession} from "next-auth/react";
import {redirect} from "next/navigation";

const AdminContext = createContext();


export const AdminProvider = ({ children }) => {
    const { data: session } = useSession();
    const [activeSection, setActiveSection] = useState('dashboard');
    if (session?.user.role === "USER") {
        redirect("/");
        return null;
    }
    return (
        <AdminContext.Provider value={{ activeSection, setActiveSection }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdminContext = () => useContext(AdminContext);
