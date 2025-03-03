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
    Divider,
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
                                     color="primary"
                                     variant="underlined"
                                     selectedKey={selectedTab}
                                     onSelectionChange={handleTabChange}
                                 >
                                     <Tab
                                         key="search"
                                         title={
                                             <div className="flex items-center space-x-2">
                                                 <MagnifyingGlassCircleIcon width="24" height="24" color="black"/>
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
                                     <Button size="lg" onPress={onOpen} isIconOnly={true} radius="full">
                                        <span
                                            className="font-semibold  cursor-pointer bg-cyan-600 p-4 rounded-full place-content-center text-xl text-neutral-100 flex justify-center items-center">
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
                                                     <DrawerHeader className="flex flex-col gap-1">
                                                         <div className="flex flex-row ml-1 justify-start items-center">
                                                             <div className="bg-blue-700 rounded-full mr-3">

                                                                 <div className="m-1 text-2xl text-blue-100 p-5 ">
                                                                     {user?.name &&
                                                                         (
                                                                             <span>{user?.name[0].toUpperCase()}{user?.name[1].toUpperCase()}</span>
                                                                         )
                                                                     }
                                                                 </div>
                                                             </div>
                                                             <div className="flex flex-col justify-start items-start">
                                                                 <div
                                                                     className="flex flex-row justify-center items-center">
                                                                 <span
                                                                     className="text-xl font-extralight">{user?.name}&nbsp;{user?.surname}</span>
                                                                 </div>
                                                                 <div
                                                                     className="flex flex-row justify-center items-center font-thin">
                                                                 <span
                                                                     className="text-sm font-normal">{user?.email}</span>
                                                                 </div>
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

                                                                     </div>
                                                                 </div>
                                                             </Form>)}
                                                             <Divider className="my-2 text-gray-800"/>
                                                             <div className="flex flex-row h-full justify-center items-start ">
                                                                 {user.role !== 'USER' &&
                                                                    (<Button as={Link}
                                                                            variant="flat"
                                                                             fullWidth
                                                                            color="warning"
                                                                            size="lg"
                                                                            href="/admin"
                                                                            className="uppercase text-xs m-1 h-[10rem]">
                                                                        <span className={'flex flex-col justify-between items-center'}>
                                                                            <BsWrench size={30}  />
                                                                            <span>
                                                                                Administration
                                                                            </span>
                                                                        </span>
                                                                    </Button>)
                                                                }
                                                                 <Button
                                                                     variant="flat"
                                                                     color="danger"
                                                                     fullWidth
                                                                     size="lg"
                                                                     onPress={() => signOut().then(() => {
                                                                             addToast({
                                                                                    title: 'Déconnexion',
                                                                                    message: 'Vous avez été déconnecté',
                                                                                    type: 'success',
                                                                                    duration: 5000,
                                                                             });
                                                                     })}
                                                                     className="uppercase text-xs m-1 h-[10rem]">
                                                                     <span className={'flex flex-col justify-between items-center'}>
                                                                         <CiLogout size={30} />
                                                                         <span>
                                                                             Deconnexion
                                                                         </span>
                                                                     </span>
                                                                 </Button>
                                                             </div>
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


