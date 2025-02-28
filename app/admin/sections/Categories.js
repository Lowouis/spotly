'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";
import {useRefreshContext} from "@/app/context/RefreshContext";
const Categories = ({})=>{

    const { isRefreshing } = useRefreshContext();

    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/categories`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled : !isRefreshing
    });

    const CategoryFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom', placeholder : "ex : vidéo-projecteur, ordinateur" },
        { required: false, name: 'description', type: 'text', label: 'Description', placeholder : "ex : ordinateur 4gb ram & 500gb" },
        { required: true, name: 'pickable', type: 'object', label: 'Niveau de protection', options : "pickables", placeholder: "Choisir un niveau de protection"},
        { required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: "ownerables", placeholder: "Aucun"},
    ];
    const columnsGreatNames = [
        "Nom",
        "Description",
        "Niveau de protection",
        "Propriétaire",
    ]

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                model="categories"
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