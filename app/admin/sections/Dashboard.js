'use client';


import {useQuery} from "@tanstack/react-query";
import Block from "@/app/components/admin/Block";
import {ExclamationTriangleIcon, FireIcon, ChartPieIcon, ClipboardDocumentListIcon, UsersIcon, BookmarkIcon, CubeIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid/index";
import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useEffect, useState} from "react";

const Dashboard = ({})=>{
    const [refresh, setRefresh] = useState(false);
    const { data: DD, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const statsResponse = await fetch('http://localhost:3000/api/dashboard');
            const waitingEntriesResponse = await fetch('http://localhost:3000/api/entry?moderate=WAITING');

            if (!statsResponse.ok) {
                throw new Error('Failed to fetch stats');
            }

            if (!waitingEntriesResponse.ok) {
                throw new Error('Failed to fetch waiting entries');
            }

            const stats = await statsResponse.json();
            const waitingEntries = await waitingEntriesResponse.json();
            console.log(waitingEntries);
            waitingEntries.forEach(entry => {
                delete entry.resourceId;
                delete entry.userId;
                delete entry.createdAt;
                delete entry.updatedAt;
            });
            return { stats, waitingEntries };
        },
    });
    useEffect(() => {
        if (refresh) {
            refetch().then(r => setRefresh(false))
        }
    }, [refresh, refetch, setRefresh]);
    if (isError) {
        return <div>Error: {error.message}</div>;
    }
    const columnsGreatNames = [
        "ID",
        "Note de l'administrateur",
        "Status",
        "Mis à jour le",
        "Commentaire",
        "Début",
        "Fin",
        "Code",
        "Utilisateur",
        "Ressource",
    ]


    return (
        <div className="w-full">
            <div className="font-semibold text-3xl">
                Tableau de bord
            </div>
            <div className="flex flex-row space-x-2 w-full my-3 ">
                <Block isLoaded={!isLoading} quantity={DD?.stats?.usersTotal} label="utilisateurs"
                       logo={<UsersIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.entriesTotal} label="réservations"
                       logo={<BookmarkIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.availableResourcesTotal} label="disponibles"
                       logo={<CubeIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.bookedResourcesTotal} label="utilisées"
                       logo={<FireIcon color={"#ea580c"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.delayedResourcesTotal} label="retards"
                       logo={<ExclamationTriangleIcon color={"#ef4444"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.ratio} label="disponibilité"
                       logo={<ChartPieIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!isLoading} quantity={DD?.stats?.delayedResourcesTotal} label="en attentes"
                       logo={<ShieldExclamationIcon color={"#ef4444"} width={48} height={48}/>}/>
            </div>
            <div>
                <div>
                    <ItemsOnTable items={DD?.waitingEntries}
                                  isLoading={isLoading}
                                  selectionMode={false}
                                  name={"Réservations en attente"}
                                  create_hidden={true}
                                  setRefresh={setRefresh}
                                  columnsGreatNames={columnsGreatNames}
                                  actions={["view", "confirm", "reject"]}
                    />
                </div>
            </div>


        </div>
    )
}


export default Dashboard;