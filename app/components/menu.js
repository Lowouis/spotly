'use client';

import {
    Link,
    Tabs,
    Badge,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure, Image,
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {BookmarkIcon} from "@heroicons/react/24/solid";
import {Tab} from "@nextui-org/react";
import { MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";
import {signOut} from "next-auth/react";


export function AlternativeMenu({user, handleSearchMode, userEntriesQuantity}) {
    const {isOpen, onOpen, onClose} = useDisclosure();

    return (
                 <div className="w-full">
                     <div className="flex w-full p-2">
                         <div className="text-2xl w-1/3">
                             <Image
                                 className="mx-5 my-2"
                                 alt="spotly_logo"
                                 src="logo.png"
                                 width={100}
                             />
                         </div>
                         <div className="flex flex-col w-1/3 space-y-2 justify-center items-center">
                             <Tabs size="lg" aria-label="Options" color="primary" variant="underlined" disableAnimation={true}>
                                     <Tab
                                         key="search"
                                         onClick={()=>console.log("rrr")}
                                         title={
                                             <div className="flex items-center space-x-2" onClick={()=>handleSearchMode("search")}>
                                                 <MagnifyingGlassCircleIcon width="24" height="24" color="black"/>
                                                 <span>Chercher</span>
                                             </div>
                                         }
                                     />
                                     <Tab
                                         key="bookings"
                                         onPress={handleSearchMode}
                                         title={
                                             <div className="flex items-center space-x-2" onClick={()=>handleSearchMode("bookings")} >
                                                 {userEntriesQuantity >= 0 && <Badge size="lg" content={userEntriesQuantity} color="secondary">
                                                     <BookmarkIcon width="24" height="24" color=""/>
                                                 </Badge>
                                                 }
                                                         <span>Réservations</span>
                                             </div>
                                         }
                                     />
                             </Tabs>

                         </div>



                         <div className="w-1/3 justify-end items-end">
                             <div className="flex justify-end">
                                 <Button size="lg" onPress={onOpen} isIconOnly={true} radius="full" >
                                        <span className="font-semibold  cursor-pointer bg-blue-300 p-4 rounded-full place-content-center text-xl text-black flex justify-center items-center">
                                            {user?.username.charAt(0).toUpperCase()}
                                            {user?.username.charAt(1).toUpperCase()}
                                        </span>
                                 </Button>
                                 <Drawer isOpen={isOpen} size="sm" onClose={onClose} backdrop="blur">
                                     <DrawerContent>
                                         {(onClose) => (
                                             <>
                                                 <DrawerHeader className="flex flex-col gap-1">

                                                 </DrawerHeader>
                                                 <DrawerBody>
                                                     <div className="flex flex-row ml-1 justify-start items-center">
                                                         <div className="bg-blue-700 rounded-full mr-2">
                                                             <Button disabled size="lg" radius="full" color="default" variant="flat" className="text-white" isIconOnly>
                                                                 {user?.name[0]}{user?.surname[0]}

                                                             </Button>
                                                         </div>
                                                         <div className="flex flex-col justify-start items-start">
                                                            <div className="flex flex-row justify-center items-center">
                                                                <span className="text-xl font-extralight">{user?.name}&nbsp;{user?.surname}</span>
                                                            </div>
                                                            <div className="flex flex-row justify-center items-center font-thin">
                                                                <span className="text-xs font-normal">{user?.email}</span>
                                                            </div>
                                                         </div>

                                                     </div>
                                                        <div className="flex flex-col space-y-2 ">
                                                            <Button variant="flat" size="lg" href="/profile" className="uppercase text-lg" as={Link}>General</Button>
                                                            <Button variant="flat" size="lg" href="/old" className="text-lg uppercase">Historique</Button>
                                                            {user.role !== 'USER' && <Button as={Link} variant="flat" color="secondary"
                                                                     size="lg" href="/admin"
                                                                     className="text-lg uppercase">administration</Button>}
                                                            <Button variant="faded" color="danger" size="lg" onPress={()=>signOut().then(r => console.log("Successfull logout"))} className="text-lg uppercase">Deconnexion</Button>
                                                        </div>
                                                 </DrawerBody>
                                                 <DrawerFooter>
                                                     <Button color="danger" variant="light" onPress={onClose}>
                                                         Fermer
                                                     </Button>
                                                 </DrawerFooter>
                                             </>
                                         )}
                                     </DrawerContent>
                                 </Drawer>

                             </div>
                         </div>

                     </div>
                </div>
        );
}


