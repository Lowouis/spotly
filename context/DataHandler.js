import {createContext, useContext} from 'react';
import {useQuery} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import {addToast} from '@heroui/toast';

const dataHandlerContext = createContext();

export const DataHandlerProvider = ({ children }) => {
    const {data : session} = useSession();
    const fetchWaitingEntries = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?moderate=WAITING${session?.user.role !== "SUPERADMIN" ? `&owned=${session?.user?.id}` : ""}`);
        if (!response.ok) {
            addToast({
                title: "Erreur",
                description: "Erreur lors de la récupération des réservations en attente",
                status: "error",
                duration: 5000,
            })
            throw new Error('Échec de la récupération des réservations en attente');
        }
        const dtoArray = await response.json();
        return dtoArray.map(({ userId, resourceId, ...rest }) => rest);
    };

    const fetchActivitiesStats = async () => {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/dashboard`);
        console.log(response); // Ajout de cette ligne pour déboguer dans la
        if (!response.ok) {
            throw new Error('Échec de la récupération des statistiques');
        }
        return response.json();
    };

    const { 
        data: waitingEntries, 
        isLoading: waitingEntriesLoading,
        refetch: waitingEntriesReload 
    } = useQuery({
        queryKey: ['waitingEntries'],
        queryFn: fetchWaitingEntries,
        enabled: !!session?.user,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
    });

    const { 
        data: activitiesStats, 
        isLoading: activitiesStatsLoading,
        refetch: activitiesStatsReload 
    } = useQuery({
        queryKey: ['activitiesStats'],
        queryFn: fetchActivitiesStats,
        staleTime: 5 * 60 * 1000,
        cacheTime: 30 * 60 * 1000,
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