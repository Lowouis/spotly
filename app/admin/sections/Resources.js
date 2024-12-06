'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

const Resources = ({})=>{
    const [refresh, setRefresh] = useState(false);
    const ResourcesFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'description', type: 'text', label: 'Description' },
        { required: true, name: 'domains', type: 'object', label: 'Site' },
        { required: true, name: 'categories', type: 'object', label: 'Catégorie' },
        { required: true, name: 'moderate', type: 'boolean', label: 'Modérer' },
    ];

    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/resources');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
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
            <ItemsOnTable model="resource" formFields={ResourcesFields} setRefresh={setRefresh} isLoading={isLoading} items={items} name={"Ressources"} />
        </div>
    );
}



export default Resources;