'use client';


import {signOut} from "next-auth/react";
import {MenuButton} from "@/app/components/utils/button";
import {useState} from "react";
import {Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, User} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {CalendarDateRangeIcon} from "@heroicons/react/24/solid";


export function AlternativeMenu({user}) {

             return (
                 <div className="flex w-full m-5">
                     <div className="text-2xl w-2/3">
                         <Button size="sm" color="default"><CalendarDateRangeIcon width="24" height="24" color="black"/><span className="text-xl">Chronos</span></Button>
                     </div>
                    <Dropdown placement="bottom-end" className="w-1/3">
                        <DropdownTrigger>
                            <div className="flex flex-row">
                                 <span
                                     className="mr-1 cursor-pointer bg-blue-100 p-3 rounded-full place-content-center text-xs text-black">
                                {user?.username.charAt(0).toUpperCase()}
                                     {user?.username.charAt(1).toUpperCase()}
                            </span>
                                <span className="cursor-pointer">
                                    <span className="text-xs text-slate-800">
                                    <strong className="block font-medium">{user?.username}</strong>
                                            <span> {user?.email} </span>
                                        </span>
                                </span>
                            </div>

                        </DropdownTrigger>
                        <DropdownMenu aria-label="User Actions" variant="flat" className="text-black">
                            <DropdownItem key="settings">
                                General
                            </DropdownItem>
                            <DropdownItem key="team_settings">Réservations</DropdownItem>
                            <DropdownItem key="system">Historique</DropdownItem>
                            <DropdownItem key="logout" color="danger" onClick={()=>signOut().then(r => console.log("Successfull logout"))}>
                                Deconnexion
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </div>
        );
}


export default function Menu({user}){

    //plus s'occuper du hover ou click sur un bouton pour afficher le menu
    const [menuOpen, setMenuOpen] = useState(false);

    const [activePage, setActivePage] = useState("General");
    const menuItems = [
        {"label" : "General", "access" : "all"},
        {"label" : "Réservations", "access" : "all"},
        {"label" : "Historique", "access" : "all"},
        {"label" : "Deconnexion", "access" : "all"}
    ]


    const handleClick = (pageClicked) => {
        if(pageClicked === "Deconnexion") {
            signOut().then(r => console.log("Successfull logout"));
        } else {
            setActivePage(pageClicked);
        }
    }

    return (
        <div className="fixed flex h-screen flex-col justify-between border-e bg-white">
            <div className="px-4 py-6">
                <div className="flex justify-center items-center">
                    <span className="text-gray-700 font-medium mr-2">Chronos</span>
                    <span className="p-3 rounded-full place-content-center bg-gray-100 text-xs text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                        </svg>
                    </span>
                </div>

                <ul className="mt-6 space-y-1">
                    {menuItems.map((item, index) => (
                        //plus tard ajouter verification d'acces grace au groupe du user (pas encore mis dans le schema)
                        <MenuButton key={index} label={item.label} active={activePage===item.label} onClick={()=>handleClick(item.label)}/>
                    ))}
                </ul>
            </div>

            <div className="sticky inset-x-0 bottom-0 border-t border-gray-100">
                <a href="#" className="flex items-center gap-2 bg-white p-4 hover:bg-gray-50">
                   <span className="p-3 rounded-full place-content-center text-xs text-blue-800">
                        {user?.username.charAt(0).toUpperCase()}
                       {user?.username.charAt(1).toUpperCase()}
                    </span>

                    <div>
                        <p className="text-xs text-slate-800">
                            <strong className="block font-medium">{user?.username}</strong>


                            <span> {user?.email} </span>
                        </p>
                    </div>
                </a>
            </div>
        </div>

    );
}