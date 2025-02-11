import { createContext, useContext, useState } from 'react';
import {useQuery} from "@tanstack/react-query";

const dataHandlerContext = createContext();

export const DataHandlerProvider = ({ children }) => {



    const { data: waitingEntries, isLoading: waitingEntriesLoading ,refetch: waitingEntriesReload } = useQuery({
        queryKey: ['waitingEntries'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?moderate=WAITING`);

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            const dtoArray = await response.json();
            return dtoArray.map(({ userId, resourceId, ...rest }) => rest);
        },
    });

    const { data: activitiesStats, isLoading: activitiesStatsLoading, refetch: activitiesStatsReload } = useQuery({
        queryKey: ['activitiesStats'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/dashboard`);

            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return await response.json();
        },
    });



    const refresh = () => {
        activitiesStatsReload();
        waitingEntriesReload();
    };
    return (
        <dataHandlerContext.Provider value={{ activitiesStats, activitiesStatsLoading, waitingEntries, waitingEntriesLoading, refresh}}>
            {children}
        </dataHandlerContext.Provider>
    );
};

export const useDataHandlerContext = () => useContext(dataHandlerContext);