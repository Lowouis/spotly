import {createContext, useContext} from 'react';
import {useMutation, useQueryClient} from "@tanstack/react-query";


const AdminDataManagerContext = createContext();


export const AdminDataManager = ({ children }) => {
    const queryClient = useQueryClient();
    const invalidateEntries = () => {
        queryClient.invalidateQueries({queryKey: ['entry']});
        queryClient.invalidateQueries({queryKey: ['admin-dashboard']});
    };

    const entryMutation = useMutation({
        mutationFn: async ({entry, moderate}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/${entry.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    moderate: moderate,
                    adminNote: entry.adminNote !== undefined && entry.adminNote !== null && entry.adminNote !== "" ? entry.adminNote : null,
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update entry');
            }
            
            return response.json();
        },
        onSuccess: invalidateEntries,
    });

    const groupMutation = useMutation({
        mutationFn: async ({entry, moderate}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry/group/${entry.recurringGroupId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({moderate}),
            });

            if (!response.ok) {
                throw new Error('Failed to update recurring entry group');
            }

            return response.json();
        },
        onSuccess: invalidateEntries,
    });

    const updateEntryModerate = (entry, moderate) => {
        entryMutation.mutate({entry, moderate}, {
            onSuccess: (data) => {

            },
            onError: (error) => {
            }
        });
    }
    const updateEntryGroupModerate = (entry, moderate) => {
        groupMutation.mutate({entry, moderate}, {
            onSuccess: (data) => {

            },
            onError: (error) => {
            }
        });
    }
    return (
        <AdminDataManagerContext.Provider value={{ updateEntryModerate, updateEntryGroupModerate }}>
            {children}
        </AdminDataManagerContext.Provider>
    );
};

export const useAdminDataManagerContext = () => useContext(AdminDataManagerContext);
