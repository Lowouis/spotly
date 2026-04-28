'use client';

import React, {createContext, useContext, useEffect, useState} from 'react';
import {useSession} from "next-auth/react";
import {redirect} from "next/navigation";

const AdminContext = createContext();

export function AdminProvider({children}) {
    const { data: session } = useSession();
    const [activeSection, setActiveSection] = useState('dashboard');

    // Restaurer l'active section depuis le localStorage au chargement
    useEffect(() => {
        const savedSection = localStorage.getItem('activeSection');
        if (savedSection) {
            setActiveSection(savedSection);
        }
    }, []);

    // Sauvegarder l'active section dans le localStorage quand elle change
    const updateActiveSection = (section) => {
        setActiveSection(section);
        localStorage.setItem('activeSection', section);
    };

    if (session?.user.role === "USER") {
        redirect("/");
        return null;
    }
    return (
        <AdminContext.Provider value={{activeSection, setActiveSection: updateActiveSection}}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdminContext() {
    const context = useContext(AdminContext);
    if (!context) {
        throw new Error('useAdminContext must be used within an AdminProvider');
    }
    return context;
}
