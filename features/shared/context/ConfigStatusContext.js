'use client';

import React, {createContext, useCallback, useContext, useMemo, useState} from 'react';

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

    const updateConfigStatus = useCallback((service, status) => {
        setConfigStatuses(prev => ({
            ...prev,
            [service]: status
        }));
    }, []);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'none':
                return 'bg-red-500';
            case 'error':
                return 'bg-orange-500';
            case 'success':
                return 'bg-green-500';
            default:
                return 'bg-red-500';
        }
    }, []);

    const value = useMemo(() => ({
        configStatuses,
        updateConfigStatus,
        getStatusColor
    }), [configStatuses, getStatusColor, updateConfigStatus]);

    return (
        <ConfigStatusContext.Provider value={value}>
            {children}
        </ConfigStatusContext.Provider>
    );
};
