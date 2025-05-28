'use client';
import {useDataHandlerContext} from "@/context/DataHandler";
import {ChartPieIcon, UsersIcon} from "@heroicons/react/24/solid/index";
import {BookmarkIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import {CubeIcon, ExclamationTriangleIcon, FireIcon} from "@heroicons/react/16/solid";
import Block from "@/components/admin/Block";
import ItemsOnTable from "@/components/listing/ItemsOnTable";


const Dashboard = ({})=>{

    const { activitiesStats, activitiesStatsLoading, waitingEntries, waitingEntriesLoading,  refresh } = useDataHandlerContext();
    const columnsGreatNames = [
        "ID",
        "Début",
        "Fin",
        "Code",
        "Utilisateur",
        "Ressource",
    ]


    return (
        <div className="h-full p-2">
            <div className="pb-4 w-full">
                <div className="flex flex-row gap-4 mb-6 min-w-max px-2">
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.usersTotal || 0}
                           label="utilisateurs"
                           logo={<UsersIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.entriesTotal || 0}
                           label="réservations"
                           logo={<BookmarkIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.availableResourcesTotal || 0}
                           label="disponibles"
                           logo={<CubeIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.bookedResourcesTotal || 0}
                           label="utilisées"
                           logo={<FireIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.delayedResourcesTotal || 0}
                           label="retards"
                           logo={<ExclamationTriangleIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={(activitiesStats?.ratio || 0) + "%"}
                           label="disponibilité"
                           logo={<ChartPieIcon color={"#374151"} width={48} height={48}/>}/>
                    <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.delayedResourcesTotal || 0}
                           label="attentes"
                           logo={<ShieldExclamationIcon color={"#374151"} width={48} height={48}/>}/>
                </div>
            </div>
            <div className="h-[calc(100%-200px)]">
                <ItemsOnTable
                    items={waitingEntries}
                    filter={['adminNote', 'moderate', 'updatedAt', 'createdAt', 'returned', 'comment', 'lastUpdatedModerateStatus', 'system', 'recurringGroupId']}
                    isLoading={waitingEntriesLoading}
                    selectionMode={false}
                    name={"Réservations en attente"}
                    create_hidden={true}
                    setRefresh={refresh}
                    columnsGreatNames={columnsGreatNames}
                    actions={["view", "confirm", "reject"]}
                    searchBy={{tag: "ressource", attr: "resource.name"}}
                    />
                </div>
            </div>
    )
}


export default Dashboard;