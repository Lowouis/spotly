'use client'
import React, {useState} from 'react'
import {signOut, useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {useAdminContext} from "@/context/Admin";
import {Skeleton} from "@heroui/react";
import {
    MdArrowForwardIos,
    MdBookmarkBorder,
    MdCategory,
    MdDashboard,
    MdDevices,
    MdDomain,
    MdEventNote,
    MdLocationOn,
    MdOutlineCategory,
    MdOutlineSpaceDashboard,
    MdPeople,
    MdSecurity,
    MdSettings
} from "react-icons/md";
import {CiCircleCheck, CiLocationOn, CiLogout, CiServer, CiSettings} from "react-icons/ci";
import UserInitialsIcon from "@/components/utils/UserInitialsIcon";
import {addToast} from "@heroui/toast";
import {IoMdGlobe} from "react-icons/io";
import {GrResources} from "react-icons/gr";
import {RiApps2Line} from "react-icons/ri";
import {FaRegUser} from "react-icons/fa";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";

const sideItems = [
    {
        "title": "Administration",
        "items": [
            {
                "title": "Tableau de bord",
                "id" : "dashboard",
                "icon": <MdOutlineSpaceDashboard />,
                "permission": "ADMIN"
            },
        ],
        "permission": "ADMIN"
    },
    {
        "title": "Global",
        "items": [
            {
                "id": "general",
                "title": "Général",
                "icon": <CiSettings/>,
                "permission": "SUPERADMIN"

            }
        ],
        "permission": "SUPERADMIN"
    },
    {
        "title": "Données",
        "items": [
            {
                "id" : "domains",
                "title": "Sites",
                "icon": <IoMdGlobe />,
                "permission": "ADMIN"
            },
            {
                "id" : "categories",
                "title": "Catégories",
                "icon": <MdOutlineCategory />,
                "permission": "ADMIN"

            },
            {
                "id" : "resources",
                "title": "Ressources",
                "icon": <GrResources />,
                "permission": "ADMIN"
            }
        ],
        "permission": "ADMIN"
    },
    {
        "title": "Utilisateurs",
        "items": [
            {
                "id" : "users",
                "title": "Utilisateurs",
                "icon": <FaRegUser />,
                "permission": "SUPERADMIN"

            },
            {
                "id" : "entries",
                "title": "Réservations",
                "icon": <MdBookmarkBorder />,
                "permission": "ADMIN"
            }
        ],
        "permission": "ADMIN"
    },
    {
        "title": "Liaisons",
        "items": [
            {
                "id": "auth",
                "title": "Configuration",
                "icon": <CiServer />,
                "permission": "SUPERADMIN"
            }
        ],
        "permission": "SUPERADMIN"
    },
    {
        "title": "Restriction",
        "items": [
            {
                "id": "locations",
                "title": "Localisations",
                "icon": <CiLocationOn/>,
                "permission": "SUPERADMIN"

            }
        ],
        "permission": "SUPERADMIN"
    },
    {
        "title": "Logs",
        "items": [
            {
                "id": "logs",
                "title": "Logs",
                "icon": <CiSettings/>,
                "permission": "SUPERADMIN"
            }
        ],
        "permission": "SUPERADMIN"
    }

];

const menuItems = [
    {
        key: 'dashboard',
        icon: <MdDashboard className="w-5 h-5"/>,
        label: 'Tableau de bord'
    },
    {
        key: 'domains',
        icon: <MdDomain className="w-5 h-5"/>,
        label: 'Domaines'
    },
    {
        key: 'general',
        icon: <MdSettings className="w-5 h-5"/>,
        label: 'Général'
    },
    {
        key: 'categories',
        icon: <MdCategory className="w-5 h-5"/>,
        label: 'Catégories'
    },
    {
        key: 'resources',
        icon: <MdDevices className="w-5 h-5"/>,
        label: 'Ressources'
    },
    {
        key: 'users',
        icon: <MdPeople className="w-5 h-5"/>,
        label: 'Utilisateurs'
    },
    {
        key: 'entries',
        icon: <MdEventNote className="w-5 h-5"/>,
        label: 'Réservations'
    },
    {
        key: 'auth',
        icon: <MdSecurity className="w-5 h-5"/>,
        label: 'Authentification'
    },
    {
        key: 'locations',
        icon: <MdLocationOn className="w-5 h-5"/>,
        label: 'Localisations'
    },
    {
        key: 'logs',
        icon: <CiCircleCheck className="w-5 h-5"/>,
        label: 'Logs'
    }
];

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(true)
    const {data: session, status} = useSession();
    const router = useRouter();
    const {setActiveSection} = useAdminContext();
    const toggleSidebar = () => setIsOpen(!isOpen)

    // Si la session n'est pas chargée ou l'utilisateur n'est pas défini, on ne rend rien
    if (status === "loading" || !session?.user) {
        return <></>;
    }



    return (
        <div
            className={`
        flex flex-col h-screen bg-white dark:border-neutral-700 dark:bg-neutral-900  border-r border-gray-200
        transition-all duration-300
        ${isOpen ? 'w-64' : 'w-14'} 
      `}
        >
            <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div
                    className="text-lg font-semibold text-gray-900 dark:text-gray-200 mr-auto flex items-center overflow-hidden">
                        <span
                            className={`
                  transition-all duration-300
                  overflow-hidden whitespace-nowrap
                  ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}
                `}
                        >
                            Spotly
              </span>

                </div>

                <button
                    onClick={toggleSidebar}
                    className="p-1 text-gray-500 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
                >
                    <MdArrowForwardIos className={`${isOpen ? "rotate-180" : "rotate-0"} transition-all duration-400`} size={18} />
                </button>
            </div>
            <nav className="flex-1 mt-2 overflow-y-auto max-h-[calc(100vh-13rem)]">
                {session?.user && sideItems.map((group, index) => {
                    return (session.user.role === group.permission || session.user.role === "SUPERADMIN") && (
                        <div className="space-y-2 mb-2" key={index}>
                            <SectionTitle title={group.title} isOpen={isOpen}/>
                            <div className="space-y-2">
                                {group.items.map((item, index) => {
                                    return (session.user.role === item.permission || session.user.role === "SUPERADMIN") && (
                                        <NavItem
                                            key={index}
                                            id={item.id}
                                            icon={item.icon}
                                            label={item.title}
                                            isOpen={isOpen}
                                            action={() => setActiveSection(item.id)}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </nav>
            <div className={`
                px-4 py-2 transition-all duration-100 flex items-center
                ${isOpen ? 'justify-between' : 'justify-center'}
                border-t border-neutral-200 dark:border-gray-500
            `}>
                <span className={`
                    text-sm text-gray-600 dark:text-gray-300
                    transition-all duration-100
                    ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                    overflow-hidden whitespace-nowrap
                `}>
                    Thème
                </span>
                <DarkModeSwitch size={'md'}/>
            </div>
            <div className="border-t border-neutral-200 dark:border-gray-500">
                <NavItem
                    icon={<RiApps2Line />}
                    label="Spotly"
                    isOpen={isOpen}
                    action={()=>router.push("/")}
                />
                <NavItem
                    icon={<CiLogout />}
                    label="Se deconnecter"
                    isOpen={isOpen}

                    action={() => signOut().then(() => {
                        router.push("/");
                        addToast({
                            title: "Déconnexion",
                            message: "Vous avez été déconnecté avec succès",
                            color: "success",
                            duration: 5000,
                        });
                    })}
                />


                <div className="flex p-2 items-center mt-4 overflow-hidden">
                    {/* Avatar toujours visible */}
                    <Skeleton className="rounded-lg bg-black" isLoaded={!!session}>
                        <UserInitialsIcon user={session?.user} />
                    </Skeleton>
                    {/* Bloc texte animé */}
                    <div
                        className={`
              ml-2 transition-all duration-300
              ${isOpen ? 'opacity-100 max-w-[200px]' : 'opacity-0 max-w-0'}
              overflow-hidden
            `}
                    >
                        <Skeleton className="rounded-lg bg-neutral-100 w-full"
                                  isLoaded={!!session}
                        >
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap text-black dark:text-white">
                                {session?.user?.name && `${session.user.name[0].toUpperCase()}${session.user.name.slice(1)} ${session.user.surname.toUpperCase()}`}
                            </p>
                            <p className="text-sm text-gray-500 whitespace-nowrap">
                                {session?.user?.role === "SUPERADMIN" ? "Administrateur" : "Manager"}
                            </p>
                        </Skeleton>
                    </div>
                </div>
            </div>
        </div>
    )
}


function SectionTitle({ title, isOpen }) {
    return (
        <h2
            className={`
        px-4 mb-2 text-xs font-semibold text-gray-400 uppercase
        transition-all duration-300
        ${isOpen ? 'opacity-100 max-h-6' : 'opacity-0 max-h-0'}
        overflow-hidden
      `}
        >
            {title}
        </h2>
    )
}


function NavItem({
                     icon,
                     label,
                     isOpen,
                     badge,
                     id,
                     color="bg-gray-200",
                     action
                 }) {
    const {activeSection, setActiveSection} = useAdminContext();
    return (
        <a
            onClick={action}
            href="#"
            className={`flex transition-all items-center text-gray-700 dark:text-gray-200 ${color && "hover:" + color + " hover:dark:bg-neutral-700"} px-1 py-2 ${activeSection === id && "bg-gray-200 dark:bg-gray-700 "}`}
        >
            <div className={`text-xl transition-all ml-3 ${isOpen && 'mr-2' }`}>{icon}</div>

            <div
                className={`
          flex items-center
          overflow-hidden
          transition-all duration-300
          ${isOpen ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}
        `}
            >
                <span className="whitespace-nowrap">{label}</span>
                {badge && (
                    <span className="px-2 ml-auto text-sm text-gray-500">{badge}</span>
                )}
            </div>
        </a>
    )
}
