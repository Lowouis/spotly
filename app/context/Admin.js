import { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export const useAdminContext = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
    const [activeSection, setActiveSection] = useState('dashboard');
    return (
        <AdminContext.Provider value={{ activeSection, setActiveSection }}>
            {children}
        </AdminContext.Provider>
    );
};