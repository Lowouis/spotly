'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";



const Domains = ({})=>{
    const [refresh, setRefresh] = useState(false);
    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['domains'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/domains`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
    const { data: owners, isLoading: isLoadingOwners, isError: isErrorOwners, error: errorOwners } = useQuery(
        {
            queryKey: ['owners'],
            queryFn: async () => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users?ownerable=1`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            },
        }
    )

    const DomainFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'code', type: 'number', label: 'Code' },
        { required: true, name: 'country', type: 'text', label: 'Pays' },
        { required: true, name: 'city', type: 'text', label: 'Ville' },
        { required: true, name: 'street_number', type: 'number', label: 'N°' },
        { required: true, name: 'address', type: 'text', label: 'Adresse' },
        { required: true, name: 'zip', type: 'number', label: 'Code Postal' },
        { required: true, name: 'phone', type: 'number', label: 'Téléphone' },
        { required: true, name: 'pickable', type: 'object', label: 'Niveau de protection', options : [
            {name : "Aucune confirmation", key : "FLUENT", id : 0},
            {name : "Confirmation de restitution par click", key : "HIGH_TRUST", id: 1},
            {name : "Confirmation de ramassage et de restitution par click", key : "LOW_TRUST", id: 2},
            {name : "Confirmation de ramassage et de restitution par code", key :  "DIGIT", id: 3},
            {name : "Confirmation de ramassage et de restitution avec code sans connexion", key : "LOW_AUTH", id: 4},
            {name : "Confirmation de ramassage et de restitution avec code et restriction de localisation", key : "HIGH_AUTH", id: 5}
            ],
            defaultValue : {name : "Aucune confirmation", key: "HIGH_TRUST", id: 1}
        },
        { required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: owners},
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
    ]
    useEffect(() => {
        if(refresh){
            refetch().then(()=>setRefresh(false))
        }
    }, [refetch, refresh, setRefresh]);
    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                setRefresh={setRefresh}
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