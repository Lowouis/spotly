'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";


const Domains = ({})=>{
    const [refresh, setRefresh] = useState(false);
    const DomainFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'code', type: 'number', label: 'Code' },
        { required: true, name: 'country', type: 'text', label: 'Pays' },
        { required: true, name: 'city', type: 'text', label: 'Ville' },
        { required: true, name: 'street_number', type: 'number', label: 'N°' },
        { required: true, name: 'address', type: 'text', label: 'Adresse' },
        { required: true, name: 'zip', type: 'number', label: 'Code Postal' },
        { required: true, name: 'phone', type: 'number', label: 'Téléphone' },
    ];
    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['domains'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/domains');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
    const columnsGreatNames = [
        "ID",
        "Ville",
        "a del",
        "Adresse",
        "Code",
        "Pays",
        "Ville",
        "Code postal",
        "Téléphone",
        "N°",
        "Début",
    ]
    useEffect(() => {
        if(refresh){
            refetch().then(r=>setRefresh(false))
        }
    }, [refetch, refresh, setRefresh]);
    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    console.log(items);
    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable setRefresh={setRefresh} model="domains" formFields={DomainFields} isLoading={isLoading} items={items} name={"Sites"} columnsGreatNames={columnsGreatNames}   />
        </div>
    );
}



export default Domains;