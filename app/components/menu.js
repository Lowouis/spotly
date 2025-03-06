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
    useDisclosure,
    Divider, Tooltip,
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {BookmarkIcon} from "@heroicons/react/24/outline";
import {Tab} from "@nextui-org/react";
import {ArrowPathIcon, MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";
import {signOut} from "next-auth/react";
import {Form} from "@nextui-org/form";
import {Input} from "@nextui-org/input";
import {useState} from "react";
import HeadTitle from "@/app/components/utils/HeadTitle";
import {addToast} from "@heroui/toast";
import { BsWrench  } from "react-icons/bs";
import {CiLogout} from "react-icons/ci";
import DarkModeSwitch from "@/app/components/utils/DarkModeSwitch";



export function AlternativeMenu({user, handleSearchMode, userEntriesQuantity, handleRefresh}) {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [selectedTab, setSelectedTab] = useState("search"); // Ajouter un état pour le tab sélectionné

    const handleTabChange = (key) => {
        setSelectedTab(key);
        handleSearchMode(key);
        handleRefresh();
    };


    return (
                 <div className="w-full">
                     <div className="flex w-full p-2">
                             <HeadTitle title="Spotly"/>
                             <div className="flex flex-col w-1/3 space-y-2 justify-center items-center">
                                 <Tabs
                                     size="lg"
                                     aria-label="Options"
                                     color="default"
                                     variant="underlined"
                                     selectedKey={selectedTab}
                                     onSelectionChange={handleTabChange}
                                 >
                                     <Tab
                                         key="search"
                                         title={
                                             <div className="flex items-center space-x-2">
                                                 <MagnifyingGlassCircleIcon width="24" height="24"/>
                                                 <span>Chercher</span>
                                             </div>
                                         }
                                     />
                                     <Tab
                                         key="bookings"
                                         title={
                                             <div className="flex items-center space-x-2">
                                                 {userEntriesQuantity >= 0 &&
                                                     <Badge size="lg" content={userEntriesQuantity} color="secondary">
                                                         <BookmarkIcon width="24" height="24"/>
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
                                     <div className="flex justify-center items-center mr-4">
                                         <DarkModeSwitch/>
                                     </div>
                                     <Button size="lg" onPress={onOpen} isIconOnly={true} radius="full">
                                        <span
                                            className="font-semibold cursor-pointer bg-blue-400 p-4 rounded-full place-content-center text-xl text-neutral-100 flex justify-center items-center">
                                            {user?.username.charAt(0).toUpperCase()}
                                            {user?.username.charAt(1).toUpperCase()}
                                        </span>
                                     </Button>
                                     <Drawer
                                         isOpen={isOpen}
                                         size="lg"
                                         onClose={onClose}
                                         backdrop="blur"
                                         motionProps={{
                                             variants: {
                                                 enter: {
                                                     opacity: 1,
                                                     x: 0,
                                                     duration: 0.3,
                                                 },
                                                 exit: {
                                                     x: 100,
                                                     opacity: 0,
                                                     duration: 0.3,
                                                 },
                                             },
                                         }}
                                         radius="none"
                                         shadow="lg"
                                     >
                                         <DrawerContent>
                                             {(onClose) => (
                                                 <>
                                                     <DrawerHeader
                                                         className="flex flex-col gap-2 p-4 bg-opacity-10 bg-gray-100">
                                                         <div className="flex items-center justify-between gap-4">
                                                             {/* Section utilisateur */}
                                                             <div className="flex items-center flex-1 gap-4">
                                                                 {/* Avatar */}
                                                                 <div
                                                                     aria-label="Avatar utilisateur"
                                                                     className="flex items-center justify-center bg-blue-500 rounded-full aspect-square w-14 text-blue-100"
                                                                 >
                                                                     {user?.name && (
                                                                         <span className="text-2xl font-medium">
                                                                            {user.name[0].toUpperCase()}
                                                                             {user.name[1]?.toUpperCase()}
                                                                         </span>
                                                                     )}
                                                                 </div>

                                                                 {/* Infos utilisateur */}
                                                                 <div className="flex flex-col flex-1 min-w-0">
                                                                     <h2 className="text-xl font-light truncate">
                                                                         {user?.name} {user?.surname}
                                                                     </h2>
                                                                     <p className="text-sm font-normal truncate text-gray-600">
                                                                         {user?.email}
                                                                     </p>
                                                                 </div>
                                                             </div>

                                                             {/* Boutons d'actions */}
                                                             <div className="flex flex-row gap-2 ml-auto mr-4">
                                                                 {user.role !== 'USER' && (
                                                                     <Tooltip content={"Administration"} showArrow>
                                                                         <Button
                                                                             as={Link}
                                                                             variant="flat"
                                                                             color="default"
                                                                             href="/admin"
                                                                             className="flex flex-col items-center justify-center px-2 py-1 text-xs uppercase"
                                                                             aria-label="Accéder à l'administration"
                                                                         >
                                                                             <BsWrench size={20} aria-hidden="true"/>
                                                                         </Button>
                                                                     </Tooltip>
                                                                 )}

                                                                 <Tooltip content={"Se déconnecter"} showArrow>
                                                                     <Button
                                                                         variant="flat"
                                                                         color="default"
                                                                         onPress={() => signOut().then(() => {
                                                                             addToast({
                                                                                 title: 'Déconnexion',
                                                                                 message: 'Vous avez été déconnecté',
                                                                                 type: 'success',
                                                                                 duration: 5000,
                                                                             });
                                                                         })}
                                                                         className="flex flex-col items-center justify-center px-2 py-1 text-xs uppercase"
                                                                         aria-label="Se déconnecter"
                                                                     >
                                                                         <CiLogout size={20} aria-hidden="true"/>
                                                                     </Button>
                                                                 </Tooltip>
                                                             </div>
                                                         </div>
                                                     </DrawerHeader>
                                                     <DrawerBody>
                                                         <div className="flex flex-col space-y-2 h-full">
                                                             {!user?.external && (
                                                                 <Form className="w-full " validationBehavior="native"
                                                                    onSubmit={onOpen}>

                                                                 <div
                                                                     className="flex flex-row justify-between items-end w-full">
                                                                     <div className="w-full">
                                                                         <Input
                                                                             label="Email"
                                                                             size="lg"
                                                                             value={user?.email}
                                                                             labelPlacement="outside"
                                                                             name="email"
                                                                             placeholder="Enter your email"
                                                                             type="email"

                                                                         />
                                                                     </div>
                                                                     <div className="m-1 flex items-end">
                                                                         <Tooltip content={"Changer l'email"} showArrow
                                                                                  placement="top-end">
                                                                             <Button
                                                                             onPress={() => console.log("refresh mail")}
                                                                             color="default"
                                                                             type="submit"
                                                                             variant="flat"
                                                                             isIconOnly
                                                                             size="md"
                                                                             >
                                                                             <ArrowPathIcon
                                                                                 width="20"
                                                                                 height="20"
                                                                                 className={'text-neutral-600'}
                                                                             />
                                                                             </Button>
                                                                         </Tooltip>

                                                                     </div>
                                                                 </div>
                                                                 <div
                                                                     className="flex flex-row justify-center items-end my-3  w-full">
                                                                     <div className="w-full">
                                                                         <Input
                                                                             label="Mot de passe"
                                                                             size="lg"
                                                                             value=""
                                                                             labelPlacement="outside"
                                                                             name="email"
                                                                             placeholder="Entrer un nouveau mot de passe"
                                                                             type="password"
                                                                         />
                                                                     </div>
                                                                     <div className="m-1">
                                                                         <Tooltip content={"Changer le mot de passe"}
                                                                                  showArrow placement="top-end">
                                                                             <Button
                                                                                 onPress={() => console.log("refresh password")}
                                                                                 color="default"
                                                                                 type="submit"
                                                                                 variant="flat"
                                                                                 isIconOnly
                                                                                 size="md"
                                                                                 disabled={user?.external}
                                                                             >
                                                                                 <ArrowPathIcon
                                                                                     width="20"
                                                                                     height="20"
                                                                                     className={'text-neutral-600'}
                                                                                 />
                                                                             </Button>
                                                                         </Tooltip>
                                                                     </div>
                                                                 </div>
                                                             </Form>)}
                                                             <Divider className="my-2 text-gray-800"/>
                                                         </div>
                                                     </DrawerBody>
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


