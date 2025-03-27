'use client';

import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/context/RefreshContext";

const Localisations = ({}) => {
    const {isRefreshing} = useRefreshContext();

    const {data: items, isLoading, isError, error, refetch} = useQuery({
        queryKey: ['authorized-location'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/authorized-location`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled: !isRefreshing
    });

    const LocationFields = [
        {
            required: true,
            name: 'libelle',
            type: 'text',
            label: 'Libellé',
            placeholder: "ex : Salle 101, Amphi A"
        },
        {
            required: true,
            name: 'ip',
            type: 'text',
            label: 'Adresse IP',
            placeholder: "ex : 192.168.1.1",
            pattern: '^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$',
            patternMessage: "Format d'IP invalide (ex: 192.168.1.1)"
        }
    ];

    const columnsGreatNames = [
        "Libellé",
        "Adresse IP"
    ];

    return (
        <div className="flex flex-col gap-3 w-full">
            <ItemsOnTable
                model="authorized-location"
                formFields={LocationFields}
                isLoading={isLoading}
                items={items}
                name={"Localisations autorisées"}
                columnsGreatNames={columnsGreatNames}
                actions={['edit', 'delete']}
                filter={['updatedAt', 'id', 'createdAt']}
                searchBy={{tag: "libellé", attr: "libelle"}}
            />
        </div>
    );
}

export default Localisations;