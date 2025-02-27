'use client';

import {
    ArrowLeftStartOnRectangleIcon,
    EnvelopeIcon,
    ServerIcon,
    Squares2X2Icon,
    TableCellsIcon,
    UserCircleIcon,
    GlobeEuropeAfricaIcon, HomeIcon, BookmarkIcon
} from "@heroicons/react/24/solid";
import {Badge, Divider, Link, ScrollShadow, Skeleton} from "@nextui-org/react";
import {useAdminContext} from "@/app/context/Admin";
import {RectangleStackIcon} from "@heroicons/react/16/solid";
import {
    ChartPieIcon,
    ClipboardDocumentListIcon,
    RectangleGroupIcon,
    UsersIcon,
    WrenchIcon
} from "@heroicons/react/24/solid/index";
import { useSession } from "next-auth/react";
import UserInitialsIcon from "@/app/components/utils/UserInitialsIcon";
import { useRouter } from "next/navigation";

export default function Sidebar() {
    const {data : session} = useSession();
    const router = useRouter();
    const {activeSection, setActiveSection} = useAdminContext();
    const sideItems = [
        {
            "title": "Administration",
            "icon": "Squares2X2Icon",
            "items": [
                {
                    "title": "Tableau de bord",
                    "href": "/admin",
                    "id" : "dashboard",
                    "icon": "RectangleGroup",
                },
            ]
        },
        {
            "title": "Données",
            "icon": "GlobeEuropeAfrica",
            "items": [
                {
                    "id" : "domains",
                    "title": "Sites",
                    "href": "/admin/site",
                    "icon": "GlobeEuropeAfrica",
                },
                {
                    "id" : "categories",
                    "title": "Catégories",
                    "href": "/admin/category",
                    "icon": "RectangleStack",

                },
                {
                    "id" : "resources",
                    "title": "Ressources",
                    "href": "/admin/resource",
                    "icon": "ClipboardDocumentList",
                }
            ]
        },
        {
            "title": "Utilisateurs",
            "icon": "UserCircleIcon",
            "items": [
                {
                    "id" : "users",
                    "title": "Utilisateurs",
                    "href": "/admin/users",
                    "icon": "Users",

                },
                {
                    "id" : "entries",
                    "title": "Réservations",
                    "href": "/admin/reservations",
                    "icon": "Bookmark",

                }
            ]
        },
        {
            "title": "Mail",
            "icon": "EnvelopeIcon",
            "items": [
                {
                    "id" : "smtp",
                    "title": "SMTP",
                    "href": "/admin/smtp",
                    "icon": "GlobeEuropeAfrica",

                },
                {
                    "id" : "templates",
                    "title": "Templates",
                    "href": "/admin/mails",
                    "icon": "GlobeEuropeAfrica",

                }
            ]
        },
        {
            "title": "LDAP",
            "icon": "ServerIcon",
            "items": [
                {
                    "id" : "ldap",
                    "title": "Configuration",
                    "href": "/admin/ldap",
                    "icon": "Wrench",

                }
            ]
        }
    ];



    return (
        <div className="bg-black text-white h-screen w-60 px-4 pt-4 mr-2 pb-2 flex flex-col justify-between group group-hover:w-[20px] transition-all duration-300">
            {/* Profile */}
            <Skeleton className="rounded-lg bg-black" isLoaded={!!session}>
                <div className="flex items-center gap-4 mb-8">
                    <UserInitialsIcon user={session?.user} />
                    <div>
                        <h3 className="font-bold text-lg">{session?.user.name} {session?.user.surname} </h3>
                        <p className="text-gray-400 text-sm">Rôle</p>
                    </div>
                </div>
            </Skeleton>

            {/* Overview Section */}
            <ScrollShadow hideScrollBar >
                <div>
                {sideItems.map((group, index)=> (
                    <div className="space-y-4 mb-2" key={index}>
                        <h4 className="text-gray-500 uppercase text-xs tracking-wider">{group.title}</h4>
                        <div className="space-y-2">
                            {group.items.map((item, index)=>(
                                <SidebarItem  key={ index } label={ item.title } icon={ item.icon } id={ item.id } setActiveSection={ setActiveSection } active={ activeSection === item.id }/>
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            </ScrollShadow>


            {/* Bouton Se Déconnecter */}
            <div>
                <Divider className="bg-neutral-500" orientation="horizontal"/>
                <div
                    className={`flex mt-3 text-neutral-300 items-center justify-between p-3 border-2 border-transparent transition rounded-lg hover:bg-red-700 hover:border-2 hover:border-red-500 bg-red-800 cursor-pointer`}>
                    <div className="flex items-center gap-3 w-full">
                        <ArrowLeftStartOnRectangleIcon className="h-9 w-9 mr-2"/>
                        <span className="w-full text-center">Se deconnecter</span>
                    </div>
                </div>
                <div
                    onClick={()=>router.push("/")}
                    className={`flex mt-3  text-neutral-300 items-center justify-between p-3 border-2 border-transparent transition rounded-lg hover:bg-blue-700 hover:border-2 hover:border-blue-500 bg-blue-800 cursor-pointer`}>
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-3xl text-white uppercase">S</span>
                        <span className="w-full text-center " >Spotly</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SidebarItem({label, icon, badge, id}) {
    const {activeSection, setActiveSection} = useAdminContext();
    const IconMapping = {
        Squares2X2Icon: Squares2X2Icon,
        TableCells: TableCellsIcon,
        UserCircleIcon: UserCircleIcon,
        EnvelopeIcon: EnvelopeIcon,
        ServerIcon: ServerIcon,
        GlobeEuropeAfrica: GlobeEuropeAfricaIcon,
        RectangleStack: RectangleStackIcon,
        ChartPie : ChartPieIcon,
        ClipboardDocumentList : ClipboardDocumentListIcon,
        Users: UsersIcon,
        Bookmark : BookmarkIcon,
        Wrench : WrenchIcon,
        RectangleGroup: RectangleGroupIcon

    };
    const Icon = IconMapping[icon];
    return (
        <div onClick={e => setActiveSection(id)}
             className={`flex items-center justify-between p-3 transition rounded-lg hover:bg-gray-900 ${activeSection === id ? "bg-gray-900 text-neutral-100" : "text-neutral-300"} cursor-pointer`}>
            <div className="flex items-center gap-3">
                <Icon className="h-6 w-6 mr-2" />
                <span className=''>{label}</span>
            </div>
            {badge && (
                <Badge
                    size="lg"
                    color={"default"}
                    className="bg-gray-700 text-white"
                    content={badge}
                 />


            )}
        </div>
    );
}
