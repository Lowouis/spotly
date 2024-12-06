'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";

const Entries = ({})=>{

    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['entries'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/entry');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.map(({ userId, categoryId,resourceId, ...rest }) => rest);
        },
    });

    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable create_hidden={true} isLoading={isLoading} items={items} name={"Réservations"} />
        </div>
    );
}



export default Entries;