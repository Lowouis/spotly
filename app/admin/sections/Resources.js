'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";
import {useRefreshContext} from "@/app/context/RefreshContext";
const Resources = ({})=>{
    const { isRefreshing } = useRefreshContext();

    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled : !isRefreshing
    });


    const ResourcesFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom', placeholder : "ex : P-ADMIN12, Audi A4 Bleu" },
        { required: true, name: 'description', type: 'text', label: 'Description', placeholder: "ex : FB1298SX, FB-365-VR" },
        { required: true, name: 'domains', type: 'object', label: 'Site', options: "domains", placeholder: "Choisir un site" },
        { required: true, name: 'category', type: 'object', label: 'Catégorie', options: "categories", placeholder: "Choisir une catégorie" },
        { required: true, name: 'moderate', type: 'boolean', label: 'Modérer'},
        { required: false, name: 'pickable', type: 'object', label: 'Niveau de protection', options : "pickables", placeholder: "Choix par héritage de la catégorie"},
        { required: false, name: 'owner', type: 'object', label: 'Propriétaire', options: "ownerables", placeholder: "Choix par héritage de la catégorie"},

    ];
    const columnsGreatNames = [
        "Nom",
        "Description",
        "Modérer",
        "Status",
        "Niveau de protection",
        "Site",
        "Catégorie",
        "Propriétaire",
    ]

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                model="resources"
                formFields={ResourcesFields}
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