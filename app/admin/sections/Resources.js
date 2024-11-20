'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";

const Resources = ({})=>{

    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['resources'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/resources');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable isLoading={isLoading} items={items} name={"Ressources"} />
        </div>
    );
}



export default Resources;