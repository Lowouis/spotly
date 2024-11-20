'use client';
import SideBarWrapper from "@/app/components/admin/SideBarWrapper";
import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";


export default function Page({}){
    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/users');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <SideBarWrapper>
            <div className="flex flex-col gap-3 w-full mx-2">
                <ItemsOnTable items={items} name={"Utilisateurs"} />
            </div>
        </SideBarWrapper>
    );
}