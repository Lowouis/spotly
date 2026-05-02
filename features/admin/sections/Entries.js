'use client';

import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/features/shared/context/RefreshContext";
import {useState} from "react";

const statusMapping = {
    "ACCEPTED": "Accepté",
    "USED": "Utilisé",
    "REJECTED": "Rejeté",
    "ENDED": "Terminé",
    "WAITING": "En attente",
    "BLOCKED": "Bloqué"
};

const Entries = ({waitingOnly = false})=>{
    const { isRefreshing } = useRefreshContext();
    const [selectedStatus, setSelectedStatus] = useState(new Set([]));
    
    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['entry'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.map(({ userId, categoryId,resourceId, ...rest }) => rest);
        },
        enabled : !isRefreshing
    });

    // Filtrer les items en fonction du status sélectionné
    const filteredItems = items?.filter(item => {
        if (waitingOnly) return item.moderate === "WAITING";
        if (selectedStatus.size === 0) return true;
        return selectedStatus.has(item.moderate);
    });

    const columnsGreatNames = waitingOnly ? [
        "Créneau",
        "Utilisateur",
        "Ressource",
    ] : [
        "Status",
        "Créneau",
        "Utilisateur",
        "Ressource",
        "Code",
    ]

    const searchConfig = [
        {tag: "status", attr: "moderate"},
        {tag: "utilisateur", attr: "user.name"},
        {tag: "ressource", attr: "resource.name"}
    ];

    const filters = [
        {
            placeholder: "Filtrer par status",
            filterBy: "moderate"
        }
    ]

    return (
        <div className="flex flex-col gap-3 w-full">
            <ItemsOnTable
                create_hidden={true}
                isLoading={isLoading}
                items={filteredItems}
                name={waitingOnly ? "Réservations en attente" : "Réservations"}
                columnsGreatNames={columnsGreatNames}
                actions={waitingOnly ? ['view', 'confirm', 'reject'] : ['delete', 'view']}
                filter={['createdAt', 'updatedAt', 'id', 'comment', 'adminNote', 'recurringGroupId', 'system']}
                model={"entry"}
                variant={waitingOnly ? "waiting" : "default"}
                searchBy={searchConfig}
                filters={filters}
            />
        </div>
    );
}

export default Entries;
