'use client';
import {useDataHandlerContext} from "@/app/context/DataHandler";
import {ChartPieIcon, UsersIcon} from "@heroicons/react/24/solid/index";
import {BookmarkIcon, ShieldExclamationIcon} from "@heroicons/react/24/solid";
import {CubeIcon, ExclamationTriangleIcon, FireIcon} from "@heroicons/react/16/solid";
import Block from "@/app/components/admin/Block";
import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import EntryDTO, {EntriesDTO} from "@/app/components/utils/DTO";

const Dashboard = ({})=>{

    const { activitiesStats, activitiesStatsLoading, waitingEntries, waitingEntriesLoading,  refresh } = useDataHandlerContext();

    if (!activitiesStats) {
        return <div>Error: XXXX</div>;
    }
    const columnsGreatNames = [
        "ID",
        "Début",
        "Fin",
        "Code",
        "Utilisateur",
        "Ressource",
    ]


    return (
        <div className="w-full">
            <div className="font-semibold text-3xl p-2 m-4">
                Tableau de bord
            </div>
            <div className="flex flex-row space-x-2 w-full my-3 ">
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.usersTotal} label="utilisateurs"
                       logo={<UsersIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.entriesTotal} label="réservations"
                       logo={<BookmarkIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.availableResourcesTotal} label="disponibles"
                       logo={<CubeIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.bookedResourcesTotal} label="utilisées"
                       logo={<FireIcon color={"#ea580c"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.delayedResourcesTotal} label="retards"
                       logo={<ExclamationTriangleIcon color={"#ef4444"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.ratio+"%"} label="disponibilité"
                       logo={<ChartPieIcon color={"#0369a1"} width={48} height={48}/>}/>
                <Block isLoaded={!activitiesStatsLoading} quantity={activitiesStats?.delayedResourcesTotal} label="en attentes"
                       logo={<ShieldExclamationIcon color={"#ef4444"} width={48} height={48}/>}/>
            </div>
            <div>
                <div>
                    <ItemsOnTable items={waitingEntries}
                                  filter={['adminNote', 'moderate', 'updatedAt', 'createdAt', 'returned', 'comment', 'lastUpdatedModerateStatus']}
                                  isLoading={waitingEntriesLoading}
                                  selectionMode={false}
                                  name={"Réservations en attente"}
                                  create_hidden={true}
                                  setRefresh={refresh}
                                  columnsGreatNames={columnsGreatNames}
                                  actions={["view", "confirm", "reject"]}
                    />
                </div>
            </div>


        </div>
    )
}


export default Dashboard;