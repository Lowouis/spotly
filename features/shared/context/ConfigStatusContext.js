'use client';

import React, {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';

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
        ldap: 'loading',
        sso: 'loading',
        smtp: 'loading'
    });

    const updateConfigStatus = useCallback((service, status) => {
        setConfigStatuses(prev => ({
            ...prev,
            [service]: status
        }));
    }, []);

    const refreshConfigStatuses = useCallback(async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/config-statuses`, {
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch config statuses');
            setConfigStatuses(await response.json());
        } catch {
            setConfigStatuses({ldap: 'none', sso: 'none', smtp: 'none'});
        }
    }, []);

    useEffect(() => {
        refreshConfigStatuses();
    }, [refreshConfigStatuses]);

    const getStatusColor = useCallback((status) => {
        switch (status) {
            case 'loading':
                return 'bg-neutral-300';
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
        refreshConfigStatuses,
        getStatusColor
    }), [configStatuses, getStatusColor, refreshConfigStatuses, updateConfigStatus]);

    return (
        <ConfigStatusContext.Provider value={value}>
            {children}
        </ConfigStatusContext.Provider>
    );
};
