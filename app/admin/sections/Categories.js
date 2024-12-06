'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";

const Categories = ({})=>{
    const CategoryFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'description', type: 'text', label: 'Description' },
        { required: true, name: 'comment', type: 'text', label: 'Commentaire' },
    ];
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


    useEffect(() => {
        console.log(refresh);
        if (refresh) {
            refetch().then(r => setRefresh(false))
        }
    }, [refresh, refetch, setRefresh]);

    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable model="categories" setRefresh={setRefresh} formFields={CategoryFields} isLoading={isLoading} items={items} name={"Catégories"} />
        </div>
    );
}



export default Categories;