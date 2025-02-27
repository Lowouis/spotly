import { createContext, useContext, useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";



const AdminDataManagerContext = createContext();


export const AdminDataManager = ({ children }) => {
    const queryClient = useQueryClient();
    
    const mutation = useMutation({
        mutationFn: async ({entry, moderate}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moderate: moderate,
                    lastUpdatedModerateStatus: new Date().toISOString(),
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update entry');
            }
            
            return response.json();
        },
        onSuccess: () => {
            // Invalider le cache pour forcer un rechargement des données
            queryClient.invalidateQueries(['entries']);
        },
    });

    const updateEntryModerate = (entry, moderate) => {
        mutation.mutate({entry, moderate}, {
            onSuccess: (data) => {
                console.log("Mutation successful", data);
            },
            onError: (error) => {
                console.log("Mutation error", error);
            }
        });
    }
    return (
        <AdminDataManagerContext.Provider value={{ updateEntryModerate }}>
            {children}
        </AdminDataManagerContext.Provider>
    );
};

export const useAdminDataManagerContext = () => useContext(AdminDataManagerContext);
