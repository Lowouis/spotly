'use client';


import {useQuery} from "@tanstack/react-query";
import Block from "@/app/components/admin/Block";
import {ChartPieIcon, ClipboardDocumentListIcon, UsersIcon, BookmarkIcon, CubeIcon} from "@heroicons/react/24/outline/index";
import {ExclamationTriangleIcon, FireIcon} from "@heroicons/react/24/outline";
import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";

const Dashboard = ({})=>{
    const { data: stats, isLoading, isError, error } = useQuery({
        queryFn: async () => {
            const response = await fetch('http://localhost:3000/api/dashboard');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
    console.log(stats);
    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    return (
        <div className="w-full">
            <div className="font-semibold text-3xl">
                Tableau de bord
            </div>
            <div className="flex flex-row space-x-2 w-full py-3 ">
                <Block isLoaded={!isLoading} quantity={stats?.usersTotal} label="utilisateurs"
                       logo={<UsersIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={stats?.entriesTotal} label="réservations"
                       logo={<BookmarkIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={stats?.availableResourcesTotal} label="ressources disponible"
                       logo={<CubeIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={stats?.bookedResourcesTotal} label="ressources occupé"
                       logo={<FireIcon color={"#ea580c"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={stats?.delayedResourcesTotal} label="retards"
                       logo={<ExclamationTriangleIcon color={"#ef4444"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={stats?.ratio} label="% de disponibilité"
                       logo={<ChartPieIcon color={"#0369a1"} width={48} height={48}/>}/>
            </div>
            <div>
                <div className="font-semibold text-2xl">
                    Retards
                </div>
                <div>
                    <ItemsOnTable items={stats?.test} isLoading={isLoading} name={"Retards"} />
                </div>
            </div>
            <div>
                <div>
                    <ItemsOnTable items={stats?.test} isLoading={isLoading} name={"Réservations à modérer"}/>
                </div>
            </div>
        </div>
    )
}


export default Dashboard;