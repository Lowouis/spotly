'use client';

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {ArrowPathIcon, BellIcon, BookmarkIcon, ChevronDownIcon, ExclamationCircleIcon, InformationCircleIcon, MagnifyingGlassIcon, Squares2X2Icon, TrashIcon} from "@heroicons/react/24/outline";
import {signOut, useSession} from "next-auth/react";
import React, {useEffect, useState} from "react";
import {addToast} from "@/lib/toast";
import {CiLogout, CiUser} from "react-icons/ci";
import DarkModeSwitch from "@/components/actions/DarkModeSwitch";
import {useMediaQuery} from 'react-responsive';
import {useRouter} from "next/navigation";
import {BsWrench} from "react-icons/bs";
import SnakeLogo from "@/components/utils/SnakeLogo";
import {getAutomaticReservationPhase} from "@/services/client/reservationModes";

const MenuTooltip = ({content, children}) => (
    <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
    </Tooltip>
);

export function AlternativeMenu({handleSearchMode, userEntriesQuantity, userEntries = [], handleRefresh, selectedTab}) {
    const [mounted, setMounted] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const isMobile = useMediaQuery({query: '(max-width: 768px)'});
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const router = useRouter();
    const {data: session, status} = useSession();
    // États pour les modals de changement
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCleanupLoading, setIsCleanupLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
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

    useEffect(() => {
        if (!session?.user?.id) return;

        const fetchNotifications = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/notifications`, {
                    credentials: 'include',
                });

                if (!response.ok) return;

                const data = await response.json();
                setNotifications(data.notifications || []);
                setUnreadNotifications(data.unreadCount || 0);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        fetchNotifications();
    }, [session?.user?.id]);

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

    const markNotificationsAsRead = async () => {
        if (unreadNotifications === 0) return;

        setNotifications((currentNotifications) => currentNotifications.map((notification) => ({
            ...notification,
            readAt: notification.readAt || new Date().toISOString(),
        })));
        setUnreadNotifications(0);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/notifications`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({}),
            });
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        const notificationToDelete = notifications.find((notification) => notification.id === notificationId);
        setNotifications((currentNotifications) => currentNotifications.filter((notification) => notification.id !== notificationId));
        if (notificationToDelete && !notificationToDelete.readAt) {
            setUnreadNotifications((currentUnread) => Math.max(0, currentUnread - 1));
        }

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/notifications`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({id: notificationId}),
            });
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const deleteAllNotifications = async () => {
        if (!notifications.length) return;

        setNotifications([]);
        setUnreadNotifications(0);

        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/notifications`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({}),
            });
        } catch (error) {
            console.error('Failed to delete notifications:', error);
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

    const getCleanupEntries = () => userEntries.filter((entry) => {
        if (!entry) return false;
        if (entry.moderate === "REJECTED") return true;
        if (getAutomaticReservationPhase(entry) === "ended") return true;
        if (entry.moderate === "ENDED" && entry.returned) return true;
        return entry.endDate <= new Date().toISOString() && entry.moderate === "ACCEPTED";
    });

    const handleCleanup = async () => {
        setIsCleanupLoading(true);
        try {
            const entriesToDelete = getCleanupEntries().map((entry) => entry.id);

            if (entriesToDelete.length === 0) {
                addToast({
                    title: "Aucune réservation à nettoyer",
                    description: "Toutes les réservations sont déjà à jour",
                    color: "warning",
                    timeout: 4000,
                });
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/entry`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ids: entriesToDelete}),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erreur lors du nettoyage');
            }

            const result = await response.json();
            addToast({
                title: "Nettoyage réussi",
                description: `${result.count} réservation(s) supprimée(s)`,
                color: "success",
                timeout: 4000,
            });
            handleRefresh?.();
        } catch (error) {
            console.error('Erreur nettoyage:', error);
            addToast({
                title: "Erreur lors du nettoyage",
                description: error.message || "Impossible de supprimer les réservations",
                color: "danger",
                timeout: 5000,
            });
        } finally {
            setIsCleanupLoading(false);
            setIsCleanupModalOpen(false);
        }
    };

    const menuItems = [
        {
            key: "search",
            icon: <MagnifyingGlassIcon className="h-5 w-5"/>,
            label: "Rechercher",
            badge: null,
            badgeColor: "foreground"
        },
        {
            key: "bookings",
            icon: <BookmarkIcon className="h-5 w-5"/>,
            label: "Réservations",
            badge: userEntriesQuantity.total > 0 ? userEntriesQuantity.total : null,
            badgeColor: userEntriesQuantity.delayed ? "danger" : "foreground"
        },
        {
            key: "home",
            icon: <Squares2X2Icon className="h-5 w-5"/>,
            label: "Mon espace",
            badge: null,
            badgeColor: "foreground"
        }
    ];

    const userInitial = (session.user?.name || session.user?.email || "N").charAt(0).toUpperCase();
    const userDisplayName = [session.user?.name, session.user?.surname].filter(Boolean).join(" ") || session.user?.username || session.user?.email || "Profil";

    const NotificationAlert = ({tone = "info", title, description, actionLabel, onAction, onDelete, read = false}) => {
        const isWarning = tone === "warning";

        return (
            <div className={`rounded-xl border p-4 ${read ? "opacity-70" : ""} ${isWarning ? "border-red-200 bg-red-50 text-red-950 dark:border-red-950 dark:bg-red-950/30 dark:text-red-100" : "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100"}`}>
                <div className="flex items-start gap-3">
                    {isWarning ? <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#ff2a2f]" /> : <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />}
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold">{title}</div>
                        <div className="mt-1 text-sm leading-5 opacity-80">{description}</div>
                        {actionLabel && (
                            <Button type="button" variant="outline" size="sm" onClick={onAction} className="mt-3 h-9 rounded-lg bg-white/70 font-bold dark:bg-neutral-950/60">
                                {actionLabel}
                            </Button>
                        )}
                    </div>
                    {onDelete && (
                        <button type="button" onClick={onDelete} className="rounded-lg p-1.5 opacity-60 transition hover:bg-white/70 hover:opacity-100 dark:hover:bg-neutral-950/60" aria-label="Supprimer la notification">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const getNotificationTone = (type) => (
        ['RESERVATION_DELAYED', 'RESERVATION_START_MISSED', 'RESERVATION_REJECTED', 'RESOURCE_PROBLEM_REPORTED', 'RESOURCE_PICKUP_BLOCKED'].includes(type) ? 'warning' : 'info'
    );

    const getNotificationActionLabel = (type) => {
        if (type === 'RESERVATION_WAITING_CONFIRMATION') return 'Voir l’administration';
        if (type === 'RESOURCE_PROBLEM_REPORTED') return 'Voir la maintenance';
        if (type === 'RESOURCE_PICKUP_BLOCKED') return 'Voir la réservation';
        if (['MESSAGE_UNREAD', 'CONVERSATION_UNREAD'].includes(type)) return 'Voir le message';
        return 'Voir les réservations';
    };

    const handleNotificationAction = (notification) => {
        if (notification.type === 'RESERVATION_WAITING_CONFIRMATION') {
            router.push('/admin');
            return;
        }

        if (notification.type === 'RESOURCE_PROBLEM_REPORTED') {
            router.push('/admin');
            return;
        }

        if (notification.type === 'RESOURCE_PICKUP_BLOCKED' && notification.entryId) {
            router.push(`/?resId=${notification.entryId}&tab=bookings`);
            return;
        }

        if (['MESSAGE_UNREAD', 'CONVERSATION_UNREAD'].includes(notification.type) && notification.entryId) {
            router.push(`/?msgId=${notification.entryId}`);
            return;
        }

        if (notification.type === 'CONVERSATION_UNREAD') {
            router.push('/?tab=home');
            return;
        }

        handleTabChange("bookings");
    };

    const NotificationButton = ({compact = false}) => (
        <DropdownMenu onOpenChange={(open) => open && markNotificationsAsRead()}>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={`${compact ? "h-9 w-9 rounded-full" : "h-11 w-11 rounded-xl"} relative text-[#111827] hover:bg-[#f6f8fb] dark:text-neutral-200 dark:hover:bg-neutral-900`}
                    aria-label="Afficher les notifications"
                >
                    <BellIcon className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#ff2a2f] dark:border-neutral-950" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 rounded-xl border-[#dfe6ee] bg-white p-3 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                <div className="flex items-center justify-between gap-3 px-1 py-2">
                    <DropdownMenuLabel className="p-0 text-sm font-bold text-[#111827] dark:text-neutral-100">
                        Notifications{unreadNotifications > 0 ? ` (${unreadNotifications})` : ''}
                    </DropdownMenuLabel>
                    {notifications.length > 0 && (
                        <button type="button" onClick={deleteAllNotifications} className="text-xs font-bold text-[#ff2a2f] transition hover:text-red-700">
                            Tout effacer
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                <div className="space-y-3">
                    {notifications.length > 0 ? notifications.map((notification) => (
                        <NotificationAlert
                            key={notification.id}
                            tone={getNotificationTone(notification.type)}
                            title={notification.title}
                            description={notification.message}
                            read={Boolean(notification.readAt)}
                            actionLabel={getNotificationActionLabel(notification.type)}
                            onAction={() => handleNotificationAction(notification)}
                            onDelete={() => deleteNotification(notification.id)}
                        />
                    )) : (
                        <NotificationAlert
                            title="Aucune notification"
                            description="Vous n’avez pas d’alerte active pour le moment. Les réservations importantes apparaîtront ici."
                        />
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const ProfileDropdown = ({compact = false}) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={`${compact ? "h-9 rounded-full border-0 bg-transparent p-0" : "h-12 rounded-xl border-[#dfe6ee] bg-white px-3 pr-2 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"} gap-3 text-[#111827] hover:bg-[#f6f8fb] dark:text-neutral-100 dark:hover:bg-neutral-900`}
                    aria-label="Ouvrir le menu profil"
                >
                    <span className={`${compact ? "h-9 w-9" : "h-9 w-9"} flex items-center justify-center rounded-full bg-[#ff2a2f] text-sm font-bold text-white`}>
                        {userInitial}
                    </span>
                    {!compact && <ChevronDownIcon className="h-4 w-4 text-[#5f6b7a]" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl border-[#dfe6ee] bg-white p-2 shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
                <DropdownMenuLabel className="px-3 py-2">
                    <span className="block truncate text-sm font-bold text-[#111827] dark:text-neutral-100">{userDisplayName}</span>
                    {session.user?.email && <span className="block truncate text-xs font-normal text-[#5f6b7a] dark:text-neutral-400">{session.user.email}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="cursor-pointer rounded-lg px-3 py-2">
                    <CiUser className="h-4 w-4" />
                    Profil
                </DropdownMenuItem>
                {session.user.role !== 'USER' && (
                    <DropdownMenuItem onClick={() => router.push('/admin')} className="cursor-pointer rounded-lg px-3 py-2">
                        <BsWrench className="h-4 w-4 text-amber-500" />
                        Administration
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => signOut().then(() => {
                        addToast({title: 'Déconnexion', message: 'Vous avez été déconnecté', type: 'success', duration: 5000});
                    })}
                    className="cursor-pointer rounded-lg px-3 py-2 text-[#d71920] focus:text-[#d71920]"
                >
                    <CiLogout className="h-4 w-4" />
                    Se déconnecter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );


    const renderDesktopMenu = () => (
        <div className="sticky top-0 z-50 w-full border-b border-[#dfe6ee] bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95">
            <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between px-8">
                <button type="button" onClick={() => router.push('/')} className="flex items-center gap-3">
                    <SnakeLogo className="h-10 w-10" />
                    <span className="text-2xl font-bold tracking-tight text-[#111827] dark:text-neutral-100">Spotly</span>
                </button>

                <div className="flex gap-2 rounded-xl border border-[#dfe6ee] bg-white p-1 shadow-sm dark:border-neutral-800 dark:bg-neutral-950" role="tablist" aria-label="Navigation principale">
                    {menuItems.map((item) => {
                        const active = selectedTab === item.key || (item.key === "home" && selectedTab === "home");

                        return (
                            <button
                                key={item.key}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => handleTabChange(item.key)}
                                className={`relative flex h-12 items-center justify-center gap-3 rounded-lg px-5 text-sm font-bold transition-colors ${active ? 'min-w-44' : 'w-14'} ${active
                                    ? 'bg-[#fff1f1] text-[#d71920]'
                                    : 'text-[#5f6b7a] hover:bg-[#f6f8fb] hover:text-[#111827] dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100'}`}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                {active && <span>{item.label}</span>}
                                {item.badge && <Badge variant={item.badgeColor === "danger" ? "danger" : "neutral"} className={active ? "" : "absolute -right-1 -top-1"}>{item.badge}</Badge>}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-3">
                    <NotificationButton />
                    <MenuTooltip content="Basculer le thème">
                        <DarkModeSwitch size="lg" />
                    </MenuTooltip>
                    <ProfileDropdown />
                </div>
            </div>
        </div>
    );

    const renderMobileMenu = () => (
        <div className="sticky top-0 z-50 border-b border-[#dfe6ee] bg-white/95 px-4 pb-2 pt-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 md:hidden">
            <div className="flex h-10 items-center justify-between">
                <button type="button" onClick={() => router.push('/')} className="flex items-center gap-2">
                    <SnakeLogo className="h-8 w-8" />
                    <span className="text-base font-bold text-[#111827] dark:text-neutral-100">Spotly</span>
                </button>
                <div className="flex items-center gap-2">
                    <NotificationButton compact />
                    <DarkModeSwitch size="lg" />
                    <ProfileDropdown compact />
                </div>
            </div>

            <div className="mt-3 flex justify-center gap-2 rounded-xl border border-[#dfe6ee] bg-white p-1 dark:border-neutral-800 dark:bg-neutral-950" role="tablist" aria-label="Navigation principale">
                {menuItems.map((item) => {
                    const active = selectedTab === item.key;

                    return (
                        <button
                            key={item.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => handleTabChange(item.key)}
                            className={`relative flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-[11px] font-bold transition-colors ${active ? 'min-w-28' : 'w-11'} ${active
                                ? 'bg-[#fff1f1] text-[#d71920]'
                                : 'text-[#5f6b7a] hover:bg-[#f6f8fb] dark:text-neutral-400 dark:hover:bg-neutral-900'}`}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {active && <span>{item.label}</span>}
                            {item.badge && <Badge variant={item.badgeColor === "danger" ? "danger" : "neutral"} className={active ? "" : "absolute -right-1 -top-1 scale-75"}>{item.badge}</Badge>}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <TooltipProvider>
            {!isMobile ? renderDesktopMenu() : renderMobileMenu()}

            <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogContent className="border border-neutral-200 bg-white p-0 dark:border-neutral-700 dark:bg-neutral-900 sm:max-w-lg">
                            <DialogHeader className="flex flex-col gap-2 border-b border-neutral-200 p-6 pb-4 dark:border-neutral-700">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                                            Profil
                                        </DialogTitle>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                            Gérez vos informations personnelles
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-lg text-lg font-semibold text-white transition-transform duration-200 ${
                                            session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                ? 'bg-orange-500'
                                                : 'bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900'
                                        }`}>
                                            <CiUser className="w-6 h-6"/>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className={session.user?.role === 'ADMIN' || session.user?.role === 'SUPERADMIN'
                                                ? 'text-orange-500 font-semibold text-lg'
                                                : 'text-neutral-800 dark:text-neutral-100 font-semibold text-lg'}>
                                                {session.user?.name} {session.user?.surname}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            {!session.user?.external && (
                                <div className="px-6 py-6">
                                    <form className="w-full space-y-5">
                                        <div className="flex flex-row justify-between items-end w-full gap-3">
                                            <div className="relative w-full space-y-2">
                                                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
                                                <Input
                                                    value={session.user?.email}
                                                    name="email"
                                                    placeholder="Votre email"
                                                    type="email"
                                                    readOnly={true}
                                                    className="h-11 bg-transparent pr-10 text-sm text-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setIsEmailModalOpen(true)}
                                                    className="absolute bottom-1.5 right-1 h-8 w-8 bg-transparent transition-colors duration-200"
                                                >
                                                    <ArrowPathIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400"/>
                                                </Button>
                                            </div>

                                        </div>
                                        <div className="flex flex-row justify-between items-end w-full gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                disabled={session.user?.external}
                                                onClick={() => setIsPasswordModalOpen(true)}
                                                className="w-full hover:underline h-11 border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 bg-transparent hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors duration-200"
                                            >
                                                Modifier le mot de passe
                                                </Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                            <div className="border-t border-neutral-200 px-6 py-5 dark:border-neutral-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCleanupModalOpen(true)}
                                    className="w-full justify-center border-red-200 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/20"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                    Nettoyer mes réservations
                                </Button>
                            </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isCleanupModalOpen} onOpenChange={setIsCleanupModalOpen}>
                <DialogContent className="border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                    <DialogHeader className="flex flex-col gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-700">
                        <DialogTitle className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            Nettoyer les réservations
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                        <div className="flex items-center space-x-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                            <ExclamationCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-medium">Attention !</p>
                                <p>Cette action est irréversible.</p>
                            </div>
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                            <p className="mb-2 font-medium">Réservations qui seront supprimées :</p>
                            <ul className="ml-4 space-y-1">
                                <li>• Réservations terminées</li>
                                <li>• Réservations refusées</li>
                                <li>• Réservations expirées</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                        <Button
                            variant="outline"
                            onClick={() => setIsCleanupModalOpen(false)}
                            className="border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300"
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCleanup}
                            disabled={isCleanupLoading}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {isCleanupLoading ? "Nettoyage en cours..." : "Nettoyer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal pour changer l'email */}
            <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
                <DialogContent className="mx-4 bg-white dark:bg-neutral-900" onInteractOutside={(event) => event.preventDefault()}>
                    {(() => {
                        const onClose = () => setIsEmailModalOpen(false);
                        return (
                        <>
                            <DialogHeader className="border-b border-neutral-200 pb-4 dark:border-neutral-700">
                                <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Changer l&apos;adresse email
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                    <div>
                                        <label
                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            Nouvelle adresse email
                                        </label>
                                        <Input
                                            type="email"
                                            placeholder="nouvelle.email@exemple.com"
                                            id="newEmail"
                                            className="h-11 bg-transparent text-sm text-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
                                        />
                                    </div>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p>Votre adresse email actuelle : <span
                                            className="font-medium">{session.user?.email}</span></p>
                                    </div>
                            </div>
                            <DialogFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-neutral-300 dark:border-neutral-600"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
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
                                    disabled={isLoading}
                                >
                                    Confirmer
                                </Button>
                            </DialogFooter>
                        </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Modal pour changer le mot de passe */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="mx-4 bg-white dark:bg-neutral-900" onInteractOutside={(event) => event.preventDefault()}>
                    {(() => {
                        const onClose = () => setIsPasswordModalOpen(false);
                        return (
                        <>
                            <DialogHeader className="border-b border-neutral-200 pb-4 dark:border-neutral-700">
                                <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Changer le mot de passe
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-6">
                                    <div>
                                        <label
                                            className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2 block">
                                            Nouveau mot de passe
                                        </label>
                                        <Input
                                            type="password"
                                            placeholder="Nouveau mot de passe"
                                            id="newPassword"
                                            className="h-11 bg-transparent text-sm text-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
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
                                            id="confirmPassword"
                                            className="h-11 bg-transparent text-sm text-neutral-800 border-neutral-300 dark:border-neutral-600 dark:text-neutral-200 hover:border-neutral-400 dark:hover:border-neutral-500 focus-visible:ring-neutral-900 dark:focus-visible:ring-neutral-100 transition-colors duration-200"
                                        />
                                    </div>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        <p>Le mot de passe doit contenir au moins 8 caractères.</p>
                                    </div>
                            </div>
                            <DialogFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="border-neutral-300 dark:border-neutral-600"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
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
                                    disabled={isLoading}
                                >
                                    Confirmer
                                </Button>
                            </DialogFooter>
                        </>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
