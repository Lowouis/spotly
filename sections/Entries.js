'use client';

import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/context/RefreshContext";
import {Select, SelectItem} from "@nextui-org/react";
import {useState} from "react";

const statusMapping = {
    "ACCEPTED": "Accepté",
    "USED": "Utilisé",
    "REJECTED": "Rejeté",
    "ENDED": "Terminé",
    "WAITING": "En attente",
    "BLOCKED": "Bloqué"
};

const Entries = ({})=>{
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
        if (selectedStatus.size === 0) return true;
        return selectedStatus.has(item.moderate);
    });

    const columnsGreatNames = [
        "Status",
        "Dernière modification",
        "Date de début",
        "Date de fin",
        "Restitué",
        "Code",
        "Utilisateur",
        "Ressource",
    ]

    const searchConfig = [
        {tag: "status", attr: "moderate"},
        {tag: "utilisateur", attr: "user.name"},
        {tag: "ressource", attr: "resource.name"}
    ];

    return (
        <div className="flex flex-col gap-3 w-full">
            <ItemsOnTable
                create_hidden={true}
                isLoading={isLoading}
                items={filteredItems}
                name={"Réservations"}
                columnsGreatNames={columnsGreatNames}
                actions={['delete', 'view']}
                filter={['createdAt', 'updatedAt', 'id', 'comment', 'adminNote', 'recurringGroupId', 'system']}
                model={"entry"}
                searchBy={searchConfig}
                filterableStatus={true}
            />
        </div>
    );
}

export default Entries;