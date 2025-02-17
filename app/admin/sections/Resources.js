'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

const Resources = ({})=>{
    const [refresh, setRefresh] = useState(false);
    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    const { data: owners} = useQuery(
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
    const { data: domains } = useQuery(
        {
            queryKey: ['domains'],
            queryFn: async () => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/domains`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            },
        }
    )
    const { data: categories } = useQuery(
        {
            queryKey: ['categories'],
            queryFn: async () => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/categories`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            },
        }
    )
    const ResourcesFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'description', type: 'text', label: 'Description' },
        { required: true, name: 'domains', type: 'object', label: 'Site', options: domains},
        { required: true, name: 'category', type: 'object', label: 'Catégorie', options: categories},
        { required: true, name: 'moderate', type: 'boolean', label: 'Modérer' },
        { required: true, name: 'pickable', type: 'object', label: 'Niveau de protection', options : [
                {name : "Aucune confirmation", id : "FLUENT"},
                {name : "Confirmation de restitution par click", id : "HIGH_TRUST"},
                {name : "Confirmation de ramassage et de restitution par click", id : "LOW_TRUST"},
                {name : "Confirmation de ramassage et de restitution par code", id :  "DIGIT"},
                {name : "Confirmation de ramassage et de restitution avec code sans connexion", id : "LOW_AUTH"},
                {name : "Confirmation de ramassage et de restitution avec code et restriction de localisation", id : "HIGH_AUTH"}
            ],
            defaultValue : {name : "Aucune confirmation", id : "HIGH_TRUST"}
        },
        { required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: owners},

    ];
    const columnsGreatNames = [
        "Nom",
        "Description",
        "Modérer",
        "Status",
        "Niveau de protection",
        "Site",
        "Catégorie",
    ]
    useEffect(()=>{
        if(refresh){
            refetch().then(r=>setRefresh(true))
        }
    }, [refetch, refresh, setRefresh])

    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                model="resources"
                formFields={ResourcesFields}
                setRefresh={setRefresh}
                isLoading={isLoading}
                items={items}
                name={"Ressources"}
                actions={['edit', 'delete']}
                columnsGreatNames={columnsGreatNames}
                filter={['updatedAt', 'id', 'ownerId','domainId', 'categoryId', 'createdAt']}
            />
        </div>
    );
}



export default Resources;