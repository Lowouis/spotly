'use client';


import {signOut} from "next-auth/react";
import {MenuButton} from "@/app/components/utils/button";
import {useState} from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Avatar,
    User,
    Divider,
    DropdownSection, Tabs, Badge
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {BookmarkIcon, CalendarDateRangeIcon} from "@heroicons/react/24/solid";
import {Tab} from "@nextui-org/react";
import { MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";


export function AlternativeMenu({user, handleSearchMode}) {



    return (
                 <div className="w-full">
                 <div className="flex w-full p-2">
                     <div className="text-2xl w-2/3">
                         <div className="flex flex-row space-x-2 items-center">
                             <CalendarDateRangeIcon width="48" height="48" color="black"/><span className="text-4xl font-bold">Chronos</span>
                         </div>
                     </div>
                     <div className="flex w-full flex-col">
                     <Tabs size="lg" aria-label="Options" color="primary" variant="bordered">

                             <Tab
                                 key="search"
                                 onPress={() => {
                                     console.log("Search clicked")
                                 }}
                                 title={
                                     <div className="flex items-center space-x-2" onClick={()=>handleSearchMode('search')}>

                                         <MagnifyingGlassCircleIcon width="24" height="24" color="black"/>

                                         <span>Chercher</span>
                                     </div>
                                 }
                             />

                             <Tab

                                 key="bookings"
                                 title={
                                     <div className="flex items-center space-x-2" onClick={handleSearchMode}>
                                         <Badge size="md" content="2" color="danger">
                                         <BookmarkIcon width="24" height="24" color=""/>
                                         </Badge>
                                                 <span>Réservations</span>

                                     </div>
                                 }
                                 onPress={handleSearchMode}

                             />

                     </Tabs>
                     </div>
                     <Dropdown
                         showArrow
                         placement="bottom-end"
                        className="w-1/3"
                        backdrop="blur"
                    >
                        <DropdownTrigger>
                            <div className="flex flex-row">
                                 <span
                                     className="mr-1 cursor-pointer bg-blue-300 p-4 rounded-full place-content-center text-xl text-black">
                                {user?.username.charAt(0).toUpperCase()}
                                     {user?.username.charAt(1).toUpperCase()}
                            </span>
                            {/*<span className="cursor-pointer">
                                <span className="text-xl text-slate-800">
                                <strong className="block font-medium">{user?.username}</strong>
                                        <span> {user?.email} </span>
                                    </span>
                            </span>*/}
                            </div>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User Actions" variant="faded" className="text-black" showDivider={true}>
                            <DropdownSection aria-label="Help & Feedback">
                                <DropdownItem key="general">
                                    General
                                </DropdownItem>
                                <DropdownItem key="bookings">Réservations</DropdownItem>
                                <DropdownItem key="history">Historique</DropdownItem>
                            </DropdownSection>
                            <DropdownSection aria-label="Help & Feedback" >
                                <DropdownItem key="logout" color="danger" onClick={()=>signOut().then(r => console.log("Successfull logout"))}>
                                    Deconnexion
                                </DropdownItem>
                            </DropdownSection>
                        </DropdownMenu>
                    </Dropdown>
                 </div>
                </div>
        );
}


