'use client';

import React, {createContext, useContext, useState} from 'react';

const ConfigStatusContext = createContext();

export const useConfigStatus = () => {
    const context = useContext(ConfigStatusContext);
    if (!context) {
        throw new Error('useConfigStatus must be used within a ConfigStatusProvider');
    }
    return context;
};

export const ConfigStatusProvider = ({children}) => {
    const [configStatuses, setConfigStatuses] = useState({
        ldap: 'none',
        sso: 'none',
        smtp: 'none'
    });

    const updateConfigStatus = (service, status) => {
        setConfigStatuses(prev => ({
            ...prev,
            [service]: status
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'none':
                return 'bg-red-500';
            case 'valid':
                return 'bg-green-500';
            default:
                return 'bg-red-500';
        }
    };

    return (
        <ConfigStatusContext.Provider value={{
            configStatuses,
            updateConfigStatus,
            getStatusColor
        }}>
            {children}
        </ConfigStatusContext.Provider>
    );
};
