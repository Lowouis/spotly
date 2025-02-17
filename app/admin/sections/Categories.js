'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

const Categories = ({})=>{

    const [refresh, setRefresh] = useState(false);
    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['category'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/categories');
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
    const CategoryFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'description', type: 'text', label: 'Description' },
        { required: true, name: 'comment', type: 'text', label: 'Commentaire' },
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
        "Commentaire",
        "Niveau de protection",
        "Propriétaire",
    ]


    useEffect(() => {
        if (refresh) {
            refetch().then(() => setRefresh(false))
        }
    }, [refresh, refetch, setRefresh]);

    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                model="categories"
                setRefresh={setRefresh}
                formFields={CategoryFields}
                isLoading={isLoading}
                items={items}
                name={"Catégories"}
                columnsGreatNames={columnsGreatNames}
                actions={['edit', 'delete']}
                filter={['updatedAt', 'id', 'ownerId', 'createdAt']}
            />
        </div>
    );
}



export default Categories;