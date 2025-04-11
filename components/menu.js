'use client';

import {
    Badge,
    Divider,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Link,
    Tab,
    Tabs,
    Tooltip,
    useDisclosure,
} from "@nextui-org/react";
import {Button} from "@nextui-org/button";
import {ArrowPathIcon, BookmarkIcon, MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";
import {signOut} from "next-auth/react";
import {Form} from "@nextui-org/form";
import {Input} from "@nextui-org/input";
import React, {useState} from "react";
import {addToast} from "@heroui/toast";
import {BsWrench} from "react-icons/bs";
import {CiLogout, CiSettings, CiUser} from "react-icons/ci";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {User} from "@nextui-org/react";
import {firstLetterUppercase} from "@/global";
import {useMediaQuery} from 'react-responsive';

export function AlternativeMenu({user, handleSearchMode, userEntriesQuantity, handleRefresh}) {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const [selectedTab, setSelectedTab] = useState("search");
    const isMobile = useMediaQuery({query: '(max-width: 768px)'});

    const handleTabChange = (key) => {
        setSelectedTab(key);
        handleSearchMode(key);
        handleRefresh();
    };

    return (
        <div className="w-full">
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} w-full p-2 items-center justify-between`}>
                <div
                    className={`flex items-center ${isMobile ? 'w-full justify-center' : 'w-1/3 justify-start'} px-3 text-3xl cursor-pointer`}>
                    <div className="text-neutral-900 dark:text-neutral-200">
                        Spotly
                    </div>
                </div>
                <div
                    className={`flex ${isMobile ? 'flex-row justify-center w-full mt-2' : 'flex-col w-1/3 space-y-2 justify-center items-center'}`}>
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
                                <div className="flex items-center space-x-3">
                                    <MagnifyingGlassCircleIcon width="24" height="24"/>
                                    <span>Chercher</span>
                                </div>
                            }
                        />
                        <Tab
                            key="bookings"
                            title={
                                <div className="flex items-center space-x-3">
                                    {userEntriesQuantity >= 0 &&
                                        <Badge className="border-none" size="sm"
                                               content={userEntriesQuantity} color="default" shape="circle"
                                               variant="solid">
                                            <BookmarkIcon width="24" height="24"/>
                                        </Badge>
                                    }
                                    <span>Réservations</span>
                                </div>
                            }
                        />
                    </Tabs>
                </div>
                <div
                    className={`flex ${isMobile ? 'flex-row justify-center w-full mt-2' : 'w-1/3 justify-end items-center'}`}>
                    <div className="flex items-center space-x-4">
                        <DarkModeSwitch/>
                        <Button size="lg" onPress={onOpen} variant="flat" isIconOnly={true} radius="full">
                            <CiSettings size={25}/>
                        </Button>
                    </div>
                    <Modal
                        isOpen={isOpen}
                        onClose={onClose}
                        size="lg"
                        radius="lg"
                        backdrop="opaque"
                        motionProps={{
                            variants: {
                                enter: {
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                        duration: 0.15,
                                        ease: "easeOut",
                                    },
                                },
                                exit: {
                                    y: -20,
                                    opacity: 0,
                                    transition: {
                                        duration: 0.15,
                                        ease: "easeIn",
                                    },
                                },
                            },
                        }}
                    >
                        <ModalContent>
                            {(onClose) => (
                                <>
                                    <ModalHeader className="flex flex-col gap-2 p-4 bg-opacity-10">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center flex-1 gap-4">
                                                <User
                                                    name={`${user?.name} ${user?.surname}`}
                                                    description={user?.email}
                                                    color="default"
                                                    classNames={{
                                                        name: user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
                                                            ? 'text-orange-500'
                                                            : 'text-neutral-800'
                                                    }}
                                                    avatarProps={{
                                                        size: "lg",
                                                        className: `text-lg font-semibold text-neutral-800 ${
                                                            user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
                                                                ? 'bg-orange-500'
                                                                : 'bg-neutral-800'
                                                        }`,
                                                        radius: "lg",
                                                        showFallback: true,
                                                        fallback: <CiUser size={30}/>,
                                                    }}
                                                />
                                                <div className="flex flex-row gap-2 ml-auto mr-4">
                                                    {user.role !== 'USER' && (
                                                        <Tooltip content={"Administration"} showArrow
                                                                 color="foreground">
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
                                                    <Tooltip content={"Se déconnecter"} showArrow color="foreground">
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
                                        </div>
                                    </ModalHeader>
                                    <ModalBody>
                                        <div className="flex flex-col space-y-2 h-full">
                                            {!user?.external && (
                                                <Form className="w-full " validationBehavior="native"
                                                      onSubmit={onOpen}>
                                                    <div className="flex flex-row justify-between items-end w-full">
                                                        <div className="w-full">
                                                            <Input
                                                                label="Email"
                                                                size="sm"
                                                                value={user?.email}
                                                                labelPlacement="outside"
                                                                name="email"
                                                                placeholder="Enter your email"
                                                                type="email"
                                                            />
                                                        </div>
                                                        <div className="flex items-end ml-2">
                                                            <Tooltip content={"Changer l'email"}
                                                                     showArrow
                                                                     placement="top-end"
                                                                     color="foreground"
                                                            >
                                                                <Button
                                                                    onPress={() => console.log("refresh mail")}
                                                                    color="default"
                                                                    type="submit"
                                                                    variant="flat"
                                                                    isIconOnly
                                                                    size="sm"
                                                                >
                                                                    <ArrowPathIcon
                                                                        width="20"
                                                                        height="20"
                                                                        className={''}
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
                                                                size="sm"
                                                                value=""
                                                                labelPlacement="outside"
                                                                name="email"
                                                                placeholder="Entrer un nouveau mot de passe"
                                                                type="password"
                                                            />
                                                        </div>
                                                        <div className="flex items-end ml-2">
                                                            <Tooltip content={"Changer le mot de passe"}
                                                                     showArrow placement="top-end"
                                                                     color="foreground">
                                                                <Button
                                                                    onPress={() => console.log("refresh password")}
                                                                    color="default"
                                                                    type="submit"
                                                                    variant="flat"
                                                                    isIconOnly
                                                                    size="sm"
                                                                    disabled={user?.external}
                                                                >
                                                                    <ArrowPathIcon
                                                                        width="20"
                                                                        height="20"
                                                                        className={''}
                                                                    />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    </div>
                                                </Form>
                                            )}
                                        </div>
                                    </ModalBody>
                                </>
                            )}
                        </ModalContent>
                    </Modal>
                </div>
            </div>
        </div>
    );
}


