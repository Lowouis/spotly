'use client';


import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/context/RefreshContext";

const Domains = ({})=>{
    const { isRefreshing } = useRefreshContext();

    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['domains'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/domains`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled : !isRefreshing
    });
    const DomainFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'pickable', type: 'object', label: 'Niveau de protection', options : "pickables"},
        {required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: "ownerables"},
    ];


    const columnsGreatNames = [
        "Nom",
        "Propriétaire",
        "Niveau de protection",
    ];

    const searchParams = [
        {tag: "nom", attr: "name"},
        {tag: "propriétaire", attr: "owner.username"},
    ]

    const filters = [
        {
            placeholder: "Filter par protection",
            filterBy: "pickable.distinguishedName"
        }
    ]

    return (
        <div className="flex flex-col gap-3 w-full">
                <ItemsOnTable
                    model="domains"
                    formFields={DomainFields}
                    isLoading={isLoading}
                    items={items}
                    name={"Sites"}
                    actions={["edit", "delete"]}
                    columnsGreatNames={columnsGreatNames}
                    filter={['updatedAt', 'createdAt', 'ownerId', 'id', 'pickableId']}
                    filters={filters}
                    searchParams={searchParams}
                />
        </div>
    );
}



export default Domains;