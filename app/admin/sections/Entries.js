'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import { useRefreshContext} from "@/app/context/RefreshContext";

const Entries = ({})=>{
    const { isRefreshing } = useRefreshContext();
    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['entry'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return data.map(({ userId, categoryId,resourceId, ...rest }) => rest);
        },
        enabled : !isRefreshing
    });


    const columnsGreatNames = [
        "Commentaire utilisateur",
        "Status",
        "Dernière modification",
        "Commentaire administrateur",
        "Date de début",
        "Date de fin",
        "Restitué",
        "Code",
        "Utilisateur",
        "Ressource",
    ]



    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                create_hidden={true}
                isLoading={isLoading}
                items={items}
                name={"Réservations"}
                columnsGreatNames={columnsGreatNames}
                actions={['delete', 'view']}
                filter={['createdAt', 'updatedAt', 'id']}
                model={"entry"}
            />
        </div>
    );
}



export default Entries;