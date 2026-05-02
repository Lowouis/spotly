'use client';

import * as React from 'react';
import {signOut, useSession} from 'next-auth/react';
import {useRouter} from 'next/navigation';
import {BarChart3, BookmarkCheck, ChevronRight, HardHat, Wrench} from 'lucide-react';
import {MdBookmarkBorder, MdOutlineCategory, MdOutlineSpaceDashboard} from 'react-icons/md';
import {CiLocationOn, CiLogout, CiServer, CiSettings} from 'react-icons/ci';
import {IoInformationCircleOutline} from 'react-icons/io5';
import {IoMdGlobe} from 'react-icons/io';
import {GrResources} from 'react-icons/gr';
import {RiApps2Line, RiMailSettingsLine} from 'react-icons/ri';
import {FaRegUser} from 'react-icons/fa';
import {TbShieldCog} from 'react-icons/tb';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Collapsible, CollapsibleContent, CollapsibleTrigger} from '@/components/ui/collapsible';
import {
    Sidebar as AdminSidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import DarkModeSwitch from '@/components/actions/DarkModeSwitch';
import UserInitialsIcon from '@/components/utils/UserInitialsIcon';
import SnakeLogo from '@/components/utils/SnakeLogo';
import {useAdminContext} from '@/features/shared/context/Admin';
import {useDataHandlerContext} from '@/features/shared/context/DataHandler';
import {addToast} from '@/lib/toast';
import {cn} from '@/lib/utils';

const sideItems = [
    {
        title: 'Administration',
        permission: 'ADMIN',
        items: [
            {id: 'dashboard', title: 'Tableau de bord', icon: MdOutlineSpaceDashboard, permission: 'ADMIN'},
        ],
    },
    {
        title: 'Données',
        permission: 'ADMIN',
        items: [
            {id: 'domains', title: 'Sites', icon: IoMdGlobe, permission: 'ADMIN'},
            {id: 'categories', title: 'Catégories', icon: MdOutlineCategory, permission: 'ADMIN'},
            {id: 'resources', title: 'Ressources', icon: GrResources, permission: 'ADMIN'},
        ],
    },
    {
        title: 'Activité',
        permission: 'ADMIN',
        items: [
            {id: 'users', title: 'Utilisateurs', icon: FaRegUser, permission: 'SUPERADMIN'},
            {id: 'entries', title: 'Réservations', icon: MdBookmarkBorder, permission: 'ADMIN'},
            {id: 'waitingEntries', title: 'En attente', icon: BookmarkCheck, permission: 'ADMIN', badge: 'waitingEntries'},
            {id: 'maintenance', title: 'Maintenance', icon: Wrench, permission: 'ADMIN', badge: 'maintenance'},
        ],
    },
    {
        title: 'Configuration',
        permission: 'SUPERADMIN',
        items: [
            {id: 'reservationSettings', title: 'Paramètres', icon: CiSettings, permission: 'SUPERADMIN'},
            {id: 'auth', title: 'Liaisons', icon: CiServer, permission: 'SUPERADMIN'},
            {id: 'mailConfig', title: 'Notifications e-mail', icon: RiMailSettingsLine, permission: 'SUPERADMIN'},
            {id: 'protectionLevels', title: 'Protections', icon: TbShieldCog, permission: 'SUPERADMIN'},
            {id: 'locations', title: 'Localisations', icon: CiLocationOn, permission: 'SUPERADMIN'},
        ],
    },
    {
        title: 'Aide',
        permission: 'ADMIN',
        items: [
            {id: 'about', title: 'À propos', icon: IoInformationCircleOutline, permission: 'ADMIN'},
            {id: 'migration', title: 'Migration', icon: CiSettings, permission: 'ADMIN'},
        ],
    },
];

const canAccess = (role, permission) => role === permission || role === 'SUPERADMIN';

export default function Sidebar() {
    const {data: session, status} = useSession();
    const router = useRouter();
    const {activeSection, setActiveSection, dashboardView, setDashboardView} = useAdminContext();
    const {activitiesStats, waitingEntries} = useDataHandlerContext();

    if (status === 'loading' || !session?.user) return null;

    const roleLabel = session.user.role === 'SUPERADMIN' ? 'Administrateur' : 'Manager';
    const visibleGroups = sideItems
        .filter((group) => canAccess(session.user.role, group.permission))
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => canAccess(session.user.role, item.permission)),
        }))
        .filter((group) => group.items.length > 0);

    const handleSignOut = () => {
        signOut().then(() => {
            router.push('/');
            addToast({
                title: 'Déconnexion',
                message: 'Vous avez été déconnecté avec succès',
                color: 'success',
                duration: 5000,
            });
        });
    };

    return (
        <AdminSidebar className="relative w-64 bg-white dark:bg-neutral-950">
            <SidebarHeader className="space-y-4">
                <button type="button" onClick={() => setActiveSection('dashboard')} className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-muted">
                    <SnakeLogo className="h-9 w-9" />
                    <span className="min-w-0">
                        <span className="block truncate text-lg font-black text-[#111827] dark:text-neutral-100">Spotly</span>
                        <span className="block text-xs font-semibold text-muted-foreground">Administration</span>
                    </span>
                </button>

                <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <UserInitialsIcon user={session.user} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            {[session.user?.name, session.user?.surname].filter(Boolean).join(' ') || session.user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">{roleLabel}</p>
                    </div>
                    <DarkModeSwitch size="md" />
                </div>
            </SidebarHeader>

            <SidebarContent className="gap-0">
                {visibleGroups.map((group) => (
                    <Collapsible key={group.title} defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild className="group/label text-sm hover:bg-muted hover:text-foreground">
                                <CollapsibleTrigger className="text-left">
                                    {group.title}
                                    <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            const waitingCount = waitingEntries?.length || 0;
                                            const maintenanceCount = activitiesStats?.maintenance?.metrics?.openDiscussions || 0;

                                            const isDashboard = item.id === 'dashboard';
                                            const isActive = activeSection === item.id;

                                            if (isDashboard) {
                                                return (
                                                    <SidebarMenuItem key={item.id}>
                                                        <SidebarMenuButton asChild isActive={isActive} className="relative text-left">
                                                            <div role="button" tabIndex={0} onClick={() => setActiveSection(item.id)} onKeyDown={(event) => event.key === 'Enter' && setActiveSection(item.id)}>
                                                                <Icon className="h-4 w-4 shrink-0" />
                                                                <span className="min-w-0 flex-1 truncate">{item.title}</span>
                                                                {isActive && (
                                                                    <span className="ml-auto flex shrink-0 rounded-lg border bg-background p-0.5 shadow-sm" onClick={(event) => event.stopPropagation()}>
                                                                        <button type="button" onClick={() => setDashboardView('activity')} aria-label="Vue activité" className={cn('flex h-6 w-6 items-center justify-center rounded-md transition-colors', dashboardView === 'activity' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                                                                            <BarChart3 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button type="button" onClick={() => setDashboardView('maintenance')} aria-label="Vue maintenance" className={cn('flex h-6 w-6 items-center justify-center rounded-md transition-colors', dashboardView === 'maintenance' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                                                                            <HardHat className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                );
                                            }

                                            return (
                                                <SidebarMenuItem key={item.id}>
                                                    <SidebarMenuButton
                                                        type="button"
                                                        isActive={isActive}
                                                        onClick={() => setActiveSection(item.id)}
                                                        className="relative text-left"
                                                    >
                                                        <Icon className="h-4 w-4 shrink-0" />
                                                        <span className="min-w-0 flex-1 truncate">{item.title}</span>
                                                        {item.badge === 'waitingEntries' && waitingCount > 0 && (
                                                            <Badge variant="warning" className="ml-auto px-2 text-[10px]">
                                                                {waitingCount}
                                                            </Badge>
                                                        )}
                                                        {item.badge === 'maintenance' && maintenanceCount > 0 && (
                                                            <Badge variant="warning" className="ml-auto px-2 text-[10px]">
                                                                {maintenanceCount}
                                                            </Badge>
                                                        )}
                                                    </SidebarMenuButton>
                                                </SidebarMenuItem>
                                            );
                                        })}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                ))}
            </SidebarContent>

            <div className="border-t p-2">
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => router.push('/')}>
                    <RiApps2Line className="h-4 w-4" />
                    Spotly
                </Button>
                <Button variant="ghost" className={cn('w-full justify-start gap-2 text-red-600 hover:text-red-700')} onClick={handleSignOut}>
                    <CiLogout className="h-4 w-4" />
                    Se déconnecter
                </Button>
            </div>

            <SidebarRail />
        </AdminSidebar>
    );
}
