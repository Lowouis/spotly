import { createContext, useState, useContext, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';

// Création du contexte
const RefreshContext = createContext();

export const RefreshProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = useState(false);


    const refreshData = useCallback((queryKey) => {
        setIsRefreshing(true);
        queryClient.refetchQueries(queryKey).finally(() => {
            setIsRefreshing(false);
        });
    }, [queryClient]);

    const value = {
        isRefreshing,
        refreshData
    };

    return (
        <RefreshContext.Provider value={value}>
            {children}
        </RefreshContext.Provider>
    );
}

export const useRefreshContext = () => {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefreshContext must be used within a RefreshProvider');
    }
    return context;
};