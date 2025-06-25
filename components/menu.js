'use client';

import {
    Badge,
    Button,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Form,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Tab,
    Tabs,
    Tooltip,
    useDisclosure,
    User
} from "@nextui-org/react";
import {ArrowPathIcon, BookmarkIcon, MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";
import {signOut, useSession} from "next-auth/react";
import React, {useEffect, useState} from "react";
import {addToast} from "@heroui/toast";
import {CiLogout, CiMenuBurger, CiMenuFries, CiSettings, CiUser} from "react-icons/ci";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {useMediaQuery} from 'react-responsive';
import {useRouter} from "next/navigation";
import Image from "next/image";
import {BsWrench} from "react-icons/bs";
import nextConfig from '../next.config.mjs';

const basePath = nextConfig.basePath || '';

export function AlternativeMenu({handleSearchMode, userEntriesQuantity, handleRefresh, selectedTab}) {
    const {isOpen, onOpen, onClose} = useDisclosure();
    const isMobile = useMediaQuery({query: '(max-width: 768px)'});
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const {data: session, status} = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            addToast({
                title: 'Session expirée',
                message: 'Veuillez vous reconnecter',
                type: 'warning',
                duration: 5000,
            });
        }
    }, [status, router, session]);

    // Si la session n'est pas chargée, on ne rend rien
    if (status === "loading" || !session?.user) {
        return <></>;
    }

    const handleTabChange = (key) => {
        handleSearchMode(key);
        handleRefresh();
        if (isMobile) {
            setIsMenuOpen(false);
        }
    };

    const menuItems = [
        {
            key: "search",
            icon: <MagnifyingGlassCircleIcon className="w-5 h-5"/>,
            label: "Chercher",
            badge: null,
            badgeColor: "primary"
        },
        {
            key: "bookings",
            icon: <BookmarkIcon className="w-5 h-5"/>,
            label: "Réservations",
            badge: userEntriesQuantity.total > 0 ? userEntriesQuantity.total : null,
            badgeColor: userEntriesQuantity.delayed ? "danger" : "primary"
        }
    ];

    const renderMobileMenu = () => (
        <div className="fixed inset-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm"
             style={{display: isMenuOpen ? 'block' : 'none'}}>
            <div className="flex flex-col h-full bg-red-500">
                <div
                    className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div
                        className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        Spotly
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => setIsMenuOpen(false)}
                        className="text-neutral-600 dark:text-neutral-400"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                        {menuItems.map((item) => (
                            <Button
                                key={item.key}
                                className={`w-full justify-start px-4 py-3 text-lg font-medium rounded-xl transition-all duration-200 overflow-visible ${
                                    selectedTab === item.key
                                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                }`}
                                onPress={() => handleTabChange(item.key)}
                            >
                                <div className="flex items-center space-x-2 gap-3 overflow-visible">
                                    {item.icon}
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <Badge
                                            content={item.badge}
                                            color={item.badgeColor}
                                            variant="shadow"
                                            size="sm"
                                            className="ml-2"
                                        />
                                    )}
                                </div>
                            </Button>
                        ))}
                    </div>
                </div>
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center justify-end">
                        <Dropdown placement="top-end">
                            <DropdownTrigger>
                                <Button
                                    variant="flat"
                                    className="bg-neutral-100 dark:bg-neutral-800"
                                    isIconOnly
                                >
                                    <CiSettings className="w-5 h-5"/>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Paramètres utilisateur"
                                          className="text-content-primary dark:text-dark-content-primary">
                                <DropdownItem
                                    key="profile"
                                    textValue="Profil"
                                    startContent={<CiUser className="w-4 h-4"/>}
                                    onPress={onOpen}
                                    className="text-content-primary dark:text-dark-content-primary"
                                >
                                    Profil
                                </DropdownItem>
                                {session.user.role !== 'USER' && (
                                    <DropdownItem
                                        key="admin"
                                        textValue="Administration"
                                        startContent={<BsWrench className="w-4 h-4"/>}
                                        onPress={() => router.push('/admin')}
                                        className="text-content-primary dark:text-dark-content-primary"
                                    >
                                        Administration
                                    </DropdownItem>
                                )}
                                <DropdownItem
                                    key="theme"
                                    className="flex items-center justify-between text-content-primary dark:text-dark-content-primary"
                                    endContent={<DarkModeSwitch/>}
                                >
                                    <span>Thème</span>
                                </DropdownItem>
                                <DropdownItem
                                    key="logout"
                                    className="text-danger"
                                    color="danger"
                                    textValue="Se déconnecter"
                                    startContent={<CiLogout className="w-4 h-4"/>}
                                    onPress={() => {
                                        localStorage.setItem('manualLogout', '1');
                                        signOut().then(() => {
                                            addToast({
                                                title: 'Déconnexion',
                                                message: 'Vous avez été déconnecté',
                                                type: 'success',
                                                duration: 5000,
                                            });
                                        });
                                    }}
                                >
                                    Se déconnecter
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDesktopMenu = () => (
        <div
            className="w-full bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 mb-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center h-full">
                        <div className="relative group h-full flex items-center">
                            <div className="relative z-10 flex items-center hover:rotate-0 rotate-45 transition-all">
                                <Image
                                    src={`${basePath}/banner.png`}
                                    alt="Spotly Logo"
                                    width={40}
                                    height={40}
                                    style={{width: 'auto', height: 'auto'}}
                                    className="transition-all duration-500"
                                    priority
                                />
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center h-full">
                        <Tabs
                            selectedKey={selectedTab}
                            onSelectionChange={handleTabChange}
                            color="primary"
                            variant="underlined"
                            classNames={{
                                base: "overflow-visible h-full flex items-center",
                                tabList: "gap-8 h-full overflow-visible",
                                cursor: "w-full bg-primary-500",
                                tab: "max-w-fit px-0 h-full flex items-center overflow-visible",
                                tabContent: "group-data-[selected=true]:text-primary-500 text-sm whitespace-nowrap"
                            }}
                        >
                            {menuItems.map((item) => (
                                <Tab
                                    key={item.key}
                                    title={
                                        <div className="flex items-center space-x-3 group overflow-visible">
                                            {item.icon}
                                            <span className="">{item.label}</span>
                                            {item.badge && (
                                                <Badge
                                                    showOutline={false}
                                                    content={item.badge}
                                                    color={item.badgeColor}
                                                    variant="flat"
                                                    size="sm"
                                                    className="ml-3"
                                                />
                                            )}
                                        </div>
                                    }
                                />
                            ))}
                        </Tabs>
                    </div>

                    <div className="flex items-center space-x-3 h-full ">
                        <Dropdown
                            size="lg"
                            placement="bottom-end"
                        >
                            <DropdownTrigger size="lg">
                                <Button
                                    variant="solid"
                                    size="lg"
                                    className="bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                    isIconOnly
                                >
                                    <CiMenuBurger className="w-5 h-5"/>
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Paramètres utilisateur"
                                          className="text-content-primary dark:text-dark-content-primary">
                                <DropdownItem
                                    size="lg"
                                    key="profile"
                                    textValue="Profil"
                                    startContent={<CiUser className="w-4 h-4"/>}
                                    onPress={onOpen}
                                    className="text-content-primary dark:text-dark-content-primary"
                                >
                                    Profil
                                </DropdownItem>
                                {session.user.role !== 'USER' && (
                                    <DropdownItem
                                        size="lg"
                                        key="admin"
                                        textValue="Administration"
                                        startContent={<BsWrench className="w-4 h-4"/>}
                                        onPress={() => router.push('/admin')}
                                        className="text-content-primary dark:text-dark-content-primary"
                                    >
                                        Administration
                                    </DropdownItem>
                                )}
                                <DropdownItem
                                    size="lg"
                                    showDivider
                                    key="logout"
                                    textValue="Se déconnecter"
                                    className="text-danger"
                                    color="danger"
                                    startContent={<CiLogout className="w-4 h-4"/>}
                                    onPress={() => {
                                        localStorage.setItem('manualLogout', '1');
                                        signOut().then(() => {
                                            addToast({
                                                title: 'Déconnexion',
                                                message: 'Vous avez été déconnecté',
                                                type: 'success',
                                                duration: 5000,
                                            });
                                        });
                                    }}
                                >
                                    Se déconnecter
                                </DropdownItem>
                                <DropdownItem
                                    size="lg"
                                    key="theme"
                                    textValue="Thème"
                                    className="flex items-center justify-between text-content-primary dark:text-dark-content-primary"
                                    endContent={<DarkModeSwitch size="sm"/>}
                                    closeOnSelect={false}
                                >
                                    <span>Thème</span>
                                </DropdownItem>
                            </DropdownMenu>
                        </Dropdown>
                        {isMobile && (
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => setIsMenuOpen(true)}
                            >
                                <CiMenuFries className="w-5 h-5"/>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {renderDesktopMenu()}
            {isMobile && renderMobileMenu()}

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="lg"
                radius="lg"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900",
                    header: "border-b border-neutral-200 dark:border-neutral-800",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-800",
                    closeButton: "text-blue-500 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full p-3 text-xl"
                }}
                motionProps={{
                    variants: {
                        enter: {
                            y: 0,
                            opacity: 1,
                            transition: {
                                duration: 0.2,
                                ease: "easeOut",
                            },
                        },
                        exit: {
                            y: -20,
                            opacity: 0,
                            transition: {
                                duration: 0.2,
                                ease: "easeIn",
                            },
                        },
                    },
                }}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-2 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <User
                                        name={`${session.user?.name} ${session.user?.surname}`}
                                        description={session.user?.email}
                                        color="default"
                                        classNames={{
                                            name: session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                ? 'text-orange-500 font-semibold'
                                                : 'text-neutral-800 dark:text-neutral-100 font-semibold',
                                            description: 'text-neutral-500 dark:text-neutral-400'
                                        }}
                                        avatarProps={{
                                            size: "lg",
                                            className: `text-lg font-semibold text-white transition-transform duration-200 hover:scale-105 ${
                                                session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                    ? 'bg-orange-500'
                                                    : 'bg-primary-500'
                                            }`,
                                            radius: "lg",
                                            showFallback: true,
                                            fallback: <CiUser className="w-6 h-6"/>,
                                        }}
                                    />
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                {!session.user?.external && (
                                    <Form className="w-full space-y-4" validationBehavior="native">
                                        <div className="flex flex-row justify-between items-end w-full gap-3">
                                            <Input
                                                label="Email"
                                                size="sm"
                                                value={session.user?.email}
                                                labelPlacement="outside"
                                                name="email"
                                                placeholder="Votre email"
                                                type="email"
                                                variant="bordered"
                                                classNames={{
                                                    label: "text-neutral-700 dark:text-neutral-300",
                                                    input: "text-sm"
                                                }}
                                            />
                                            <Tooltip content="Changer l'email" showArrow placement="top-end">
                                                <Button
                                                    onPress={() => console.log("refresh mail")}
                                                    color="primary"
                                                    variant="flat"
                                                    isIconOnly
                                                    size="sm"
                                                    className="mb-1"
                                                >
                                                    <ArrowPathIcon className="w-4 h-4"/>
                                                </Button>
                                            </Tooltip>
                                        </div>
                                        <div className="flex flex-row justify-between items-end w-full gap-3">
                                            <Input
                                                label="Mot de passe"
                                                size="sm"
                                                value=""
                                                labelPlacement="outside"
                                                name="password"
                                                placeholder="Nouveau mot de passe"
                                                type="password"
                                                variant="bordered"
                                                classNames={{
                                                    label: "text-neutral-700 dark:text-neutral-300",
                                                    input: "text-sm"
                                                }}
                                            />
                                            <Tooltip content="Changer le mot de passe" showArrow placement="top-end">
                                                <Button
                                                    onPress={() => console.log("refresh password")}
                                                    color="primary"
                                                    variant="flat"
                                                    isIconOnly
                                                    size="sm"
                                                    disabled={session.user?.external}
                                                    className="mb-1"
                                                >
                                                    <ArrowPathIcon className="w-4 h-4"/>
                                                </Button>
                                            </Tooltip>
                                        </div>
                                    </Form>
                                )}
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}


