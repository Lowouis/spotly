'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/app/context/RefreshContext";

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
        { required: true, name: 'code', type: 'number', label: 'Code' },
        { required: true, name: 'country', type: 'text', label: 'Pays' },
        { required: true, name: 'city', type: 'text', label: 'Ville' },
        { required: true, name: 'street_number', type: 'number', label: 'N°' },
        { required: true, name: 'address', type: 'text', label: 'Adresse' },
        { required: true, name: 'zip', type: 'number', label: 'Code Postal' },
        { required: false, name: 'phone', type: 'number', label: 'Téléphone' },
        { required: true, name: 'pickable', type: 'object', label: 'Niveau de protection', options : "pickables"},
        { required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: "ownerables"},
    ];


    const columnsGreatNames = [
        "Nom",
        "Code",
        "Adresse",
        "Ville",
        "Pays",
        "Ville",
        "Code postal",
        "Téléphone",
        "Niveau de protection",
        "Propriétaire",
    ];


    return (
        <div className="flex flex-col gap-3 w-full mx-2">
                <ItemsOnTable
                    model="domains"
                    formFields={DomainFields}
                    isLoading={isLoading}
                    items={items}
                    name={"Sites"}
                    actions={["edit", "delete"]}
                    columnsGreatNames={columnsGreatNames}
                    filter={['updatedAt', 'createdAt', 'ownerId', 'id']}
                />
        </div>
    );
}



export default Domains;