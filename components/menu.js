'use client';

import {
    Badge,
    Button,
    Form,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Tab,
    Tabs,
    Tooltip,
    useDisclosure,
    User
} from "@heroui/react";
import {ArrowPathIcon, BookmarkIcon, MagnifyingGlassCircleIcon} from "@heroicons/react/24/outline";
import {signOut, useSession} from "next-auth/react";
import React, {useEffect, useState} from "react";
import {addToast} from "@heroui/toast";
import {CiLogout, CiUser} from "react-icons/ci";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {useMediaQuery} from 'react-responsive';
import {useRouter} from "next/navigation";
import Image from "next/image";
import {BsWrench} from "react-icons/bs";
import nextConfig from '../next.config.mjs';

const basePath = nextConfig.basePath || '';

export function AlternativeMenu({handleSearchMode, userEntriesQuantity, handleRefresh, selectedTab}) {
    const [mounted, setMounted] = useState(false);
    const {isOpen, onOpen, onClose} = useDisclosure();
    const isMobile = useMediaQuery({query: '(max-width: 768px)'});
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const {data: session, status} = useSession();
    const [activeLogo, setActiveLogo] = useState(true); // Activé par défaut

    // États pour les modals de changement
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            // Récupère les paramètres de l'URL courante
            const params = window.location.search;
            router.push(`/login${params}`);
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

    if (!mounted) return null;

    const handleTabChange = (key) => {
        handleSearchMode(key);
        handleRefresh();
        if (isMobile) {
            setIsMenuOpen(false);
        }
    };

    // Fonction pour changer l'email
    const handleEmailChange = async (newEmail) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/users/update-email`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email: newEmail}),
                credentials: 'include'
            });

            if (response.ok) {
                addToast({
                    title: "Email mis à jour",
                    description: "Votre adresse email a été modifiée avec succès. Veuillez vous reconnecter pour voir les changements.",
                    color: "success",
                    timeout: 5000
                });

                setIsEmailModalOpen(false);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            addToast({
                title: "Erreur",
                description: error.message || "Impossible de mettre à jour l'email",
                color: "danger",
                timeout: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour changer le mot de passe
    const handlePasswordChange = async (newPassword) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/api/users/update-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({password: newPassword}),
                credentials: 'include'
            });

            if (response.ok) {
                addToast({
                    title: "Mot de passe mis à jour",
                    description: "Votre mot de passe a été modifié avec succès",
                    color: "success",
                    timeout: 5000
                });

                setIsPasswordModalOpen(false);
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de la mise à jour');
            }
        } catch (error) {
            addToast({
                title: "Erreur",
                description: error.message || "Impossible de mettre à jour le mot de passe",
                color: "danger",
                timeout: 5000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const menuItems = [
        {
            key: "search",
            icon: <MagnifyingGlassCircleIcon className="w-6 h-6"/>,
            label: "Chercher",
            badge: null,
            badgeColor: "foreground"
        },
        {
            key: "bookings",
            icon: <BookmarkIcon className="w-6 h-6"/>,
            label: "Réservations",
            badge: userEntriesQuantity.total > 0 ? userEntriesQuantity.total : null,
            badgeColor: userEntriesQuantity.delayed ? "danger" : "foreground"
        }
    ];


    const renderDesktopMenu = () => (
        <div
            className="w-full bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 mb-2">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo à gauche */}
                    <div className="flex items-center h-full w-1/4">
                        <div className="relative group h-full flex items-center">
                            {activeLogo && <div
                                className="relative z-10 flex items-center hover:rotate-0 rotate-45 transition-all">
                                <Image
                                    src={`${basePath}/banner.png`}
                                    alt="Spotly Logo"
                                    width={40}
                                    height={40}
                                    style={{width: 'auto', height: 'auto'}}
                                    className="transition-all duration-500"
                                    priority
                                />
                            </div>}
                        </div>
                    </div>

                    {/* Tabs centrés */}
                    <div className="flex-1 flex justify-center h-full w-2/4 ">
                        <Tabs
                            selectedKey={selectedTab}
                            onSelectionChange={handleTabChange}
                            variant="underlined"
                            color="default"
                            classNames={{
                                base: "overflow-visible h-full flex items-center",
                                tabList: "gap-8 h-full overflow-visible",
                                cursor: "w-full",
                                tab: "max-w-fit px-0 h-full flex items-center overflow-visible",
                                tabContent: "text-sm whitespace-nowrap"
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

                                                />
                                            )}
                                        </div>
                                    }
                                />
                            ))}
                        </Tabs>
                    </div>

                    {/* Bouton dropdown à droite */}
                    <div className="flex items-center h-full w-1/4 justify-end">
                        <div className="flex items-center gap-2">
                            <Tooltip content="Profil" placement="bottom" color="foreground" showArrow>
                                <Button
                                    size="lg"
                                    variant="light"
                                    startContent={<CiUser className="w-4 h-4"/>}
                                    onPress={onOpen}
                                    className="text-content-primary dark:text-dark-content-primary"
                                    isIconOnly
                                />
                            </Tooltip>
                            {session.user.role !== 'USER' && (
                                <Tooltip content="Administration" placement="bottom" color="warning" showArrow>
                                    <Button
                                        size="lg"
                                        variant="light"
                                        startContent={<BsWrench className="w-4 h-4 text-warning-500"/>}
                                        onPress={() => router.push('/admin')}
                                        className="text-content-primary dark:text-dark-content-primary"
                                        isIconOnly
                                    />
                                </Tooltip>
                            )}
                            <Tooltip content="Basculer le thème" placement="bottom" color="foreground" showArrow>
                                <DarkModeSwitch size="lg"/>
                            </Tooltip>
                            <Tooltip content="Se déconnecter" placement="bottom-end" color="foreground" showArrow>
                                <Button
                                    size="lg"
                                    variant="flat"
                                    color="danger"
                                    startContent={<CiLogout className="w-4 h-4"/>}
                                    onPress={() => signOut().then(() => {
                                        addToast({
                                            title: 'Déconnexion',
                                            message: 'Vous avez été déconnecté',
                                            type: 'success',
                                            duration: 5000,
                                        });
                                    })}
                                    className="text-danger"
                                    isIconOnly
                                />
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMobileMenu = () => (
        <>
            {/* Header mobile simplifié */}
            <div
                className="md:hidden w-full bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800">
                <div className="">
                    <div className="flex items-center justify-between">
                        {/* Bouton Profil à gauche */}
                        <button
                            onClick={onOpen}
                            className="flex items-center space-x-2 p-6  transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full"
                        >
                            <div
                                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                <CiUser className="w-4 h-4 text-neutral-600 dark:text-neutral-400"/>
                            </div>
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Profil</span>
                        </button>


                        {/* Bouton Déconnexion à droite */}
                        <button
                            onClick={() => signOut().then(() => {
                                addToast({
                                    title: 'Déconnexion',
                                    message: 'Vous avez été déconnecté',
                                    type: 'success',
                                    duration: 5000,
                                });
                            })}
                            className="flex items-center justify-end space-x-2 p-6 transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 w-full"
                        >
                            <span
                                className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Déconnexion</span>
                            <div
                                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                <CiLogout className="w-4 h-4 text-neutral-600 dark:text-neutral-400"/>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation mobile par tabs en bas */}
            <div
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 z-40">
                <div className="flex items-center justify-center">
                    {menuItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => handleTabChange(item.key)}
                            className={`flex flex-col items-center px-1 py-7 gap-2 transition-all duration-200 w-full h-full ${
                                selectedTab === item.key
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                            }`}
                        >
                            <div className="relative">
                                {item.icon}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

        </>
    );

    return (
        <>
            {!isMobile ? renderDesktopMenu() : renderMobileMenu()}

            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="lg"
                radius="lg"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700",
                    closeButton: "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full p-2 transition-colors duration-200"
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
                            <ModalHeader className="flex flex-col gap-2 p-6">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                            Profil
                                        </h2>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Gérez vos informations personnelles
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <User
                                        name={`${session.user?.name} ${session.user?.surname}`}
                                        color="default"
                                        classNames={{
                                            name: session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                ? 'text-orange-500 font-semibold text-lg'
                                                : 'text-neutral-800 dark:text-neutral-100 font-semibold text-lg',
                                            description: 'text-neutral-500 dark:text-neutral-400 text-sm'
                                        }}
                                        avatarProps={{
                                            size: "lg",
                                            className: `text-lg font-semibold text-white transition-transform duration-200 ${
                                                session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                    ? 'bg-orange-500'
                                                    : 'bg-neutral-900 dark:bg-neutral-100'
                                            }`,
                                            radius: "lg",
                                            showFallback: true,
                                            fallback: <CiUser className="w-6 h-6"/>,
                                        }}
                                    />
                                </div>
                            </ModalHeader>
                            {!session.user?.external && (
                                <ModalBody className="px-6">
                                    <Form className="w-full space-y-5" validationBehavior="native">
                                        <div className="flex flex-row justify-between items-end w-full gap-3">
                                            <Input

                                                size="md"
                                                value={session.user?.email}
                                                labelPlacement="outside"
                                                name="email"
                                                placeholder="Votre email"
                                                type="email"
                                                readOnly={true}
                                                variant="bordered"
                                                classNames={{
                                                    inputWrapper: "bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200 h-11",
                                                    input: "text-sm text-neutral-800 dark:text-neutral-200",
                                                    label: "text-sm font-medium text-neutral-700 dark:text-neutral-300",
                                                    errorMessage: "text-red-500 text-sm mt-1",
                                                }}
                                                endContent={
                                                    <Button
                                                        color="default"
                                                        variant="light"
                                                    isIconOnly
                                                        size="md"
                                                        onPress={() => setIsEmailModalOpen(true)}
                                                        className="h-8 bg-transparent transition-colors duration-200"

                                                >
                                                        <ArrowPathIcon
                                                            className="w-4 h-4 text-neutral-600 dark:text-neutral-400"/>
                                                    </Button>
                                                }
                                            />

                                        </div>
                                        <div className="flex flex-row justify-between items-end w-full gap-2">
                                            <Button
                                                color="default"
                                                variant="light"
                                                fullWidth={true}
                                                size="md"
                                                disabled={session.user?.external}
                                                onPress={() => setIsPasswordModalOpen(true)}
                                                className="hover:underline h-11 border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
                                            >
                                                Modifier le mot de passe
                                                </Button>
                                        </div>
                                    </Form>
                                </ModalBody>
                            )}
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal pour changer l'email */}
            <Modal
                isOpen={isEmailModalOpen}
                onOpenChange={setIsEmailModalOpen}
                size="md"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900 mx-4",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700 pt-4"
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
                isDismissable={false}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Changer l&apos;adresse email
                                </h3>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            Nouvelle adresse email
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="nouvelle.email@exemple.com"
                                            variant="bordered"
                                            size="lg"
                                            id="newEmail"
                                            classNames={{
                                                inputWrapper: "bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200",
                                                input: "text-sm text-neutral-800 dark:text-neutral-200"
                                            }}
                                        />
                                    </div>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p>Votre adresse email actuelle : <span
                                            className="font-medium">{session.user?.email}</span></p>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="bordered"
                                    onPress={onClose}
                                    className="border-neutral-300 dark:border-neutral-600"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    onPress={() => {
                                        const newEmail = document.getElementById('newEmail').value;
                                        if (newEmail && newEmail !== session.user?.email) {
                                            handleEmailChange(newEmail);
                                        } else {
                                            addToast({
                                                title: "Erreur",
                                                description: "Veuillez saisir une nouvelle adresse email valide",
                                                color: "danger",
                                                timeout: 3000
                                            });
                                        }
                                    }}
                                    isLoading={isLoading}
                                >
                                    Confirmer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal pour changer le mot de passe */}
            <Modal
                isOpen={isPasswordModalOpen}
                onOpenChange={setIsPasswordModalOpen}
                size="md"
                backdrop="blur"
                classNames={{
                    base: "bg-white dark:bg-neutral-900 mx-4",
                    header: "border-b border-neutral-200 dark:border-neutral-700 pb-4",
                    body: "py-6",
                    footer: "border-t border-neutral-200 dark:border-neutral-700 pt-4"
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
                isDismissable={false}
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Changer le mot de passe
                                </h3>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            Nouveau mot de passe
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="Nouveau mot de passe"
                                            variant="bordered"
                                            size="lg"
                                            id="newPassword"
                                            classNames={{
                                                inputWrapper: "bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200",
                                                input: "text-sm text-neutral-800 dark:text-neutral-200"
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            Confirmer le mot de passe
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="Confirmer le mot de passe"
                                            variant="bordered"
                                            size="lg"
                                            id="confirmPassword"
                                            classNames={{
                                                inputWrapper: "bg-transparent border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 focus-within:border-neutral-900 dark:focus-within:border-neutral-100 transition-colors duration-200",
                                                input: "text-sm text-neutral-800 dark:text-neutral-200"
                                            }}
                                        />
                                    </div>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p>Le mot de passe doit contenir au moins 8 caractères.</p>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    color="default"
                                    variant="bordered"
                                    onPress={onClose}
                                    className="border-neutral-300 dark:border-neutral-600"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    color="primary"
                                    variant="flat"
                                    onPress={() => {
                                        const newPassword = document.getElementById('newPassword').value;
                                        const confirmPassword = document.getElementById('confirmPassword').value;

                                        if (!newPassword || newPassword.length < 8) {
                                            addToast({
                                                title: "Erreur",
                                                description: "Le mot de passe doit contenir au moins 8 caractères",
                                                color: "danger",
                                                timeout: 3000
                                            });
                                            return;
                                        }

                                        if (newPassword !== confirmPassword) {
                                            addToast({
                                                title: "Erreur",
                                                description: "Les mots de passe ne correspondent pas",
                                                color: "danger",
                                                timeout: 3000
                                            });
                                            return;
                                        }

                                        handlePasswordChange(newPassword);
                                    }}
                                    isLoading={isLoading}
                                >
                                    Confirmer
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}


