import {FormProvider, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SelectField from './SelectField';
import React, {useCallback, useEffect, useRef, useState} from "react";
import {AlternativeMenu} from "@/components/menu";
import {
    ArrowRightIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    ChevronLeftIcon,
    InformationCircleIcon,
    MapPinIcon,
    RectangleGroupIcon,
    StarIcon as StarOutlineIcon,
    TrashIcon,
    TruckIcon
} from "@heroicons/react/24/outline";
import {StarIcon as StarSolidIcon} from "@heroicons/react/24/solid";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import ReservationUserListing from "@/components/listing/Listings";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useSession} from "next-auth/react";
import MatchingEntriesTable from "@/components/listing/MatchingEntriesTable";
import {addToast} from "@/lib/toast";
import {useMediaQuery} from 'react-responsive';
import DateRangePickerSplitted from '@/components/form/DateRangePickerSplitted';
import ShadcnDatePicker from '@/components/form/ShadcnDatePicker';
import {useRouter, useSearchParams} from "next/navigation";
import {getCategoryIcon} from "@/lib/category-icons";
import ConversationChat from "@/components/messages/ConversationChat";
import AppTutorial from "@/components/tutorial/AppTutorial";

const TUTORIAL_DASHBOARD_WINDOW_MS = 48 * 60 * 60 * 1000;

const schemaFirstPart = yup.object().shape({
    site: yup.object().required('Vous devez choisir un site'),
    category: yup.object().required('Vous devez choisir une ressource'),
    resource: yup.object().optional().default(null).nullable(),
    date: yup.object().required('Vous devez choisir une date'),
    recursive_limit: yup.string().when('isRecurrent', {
        is: true,
        then: (schema) => schema.required('Vous devez choisir une date de fin'),
        otherwise: (schema) => schema.optional()
    })
});

const ReservationSearch = () => {
    const { data: session  } = useSession();
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const resIdParam = searchParams.get("resId");
    const msgIdParam = searchParams.get("msgId");

    const [searchMode, setSearchMode] = useState("home");
    const [autoOpenResId, setAutoOpenResId] = useState(null);
    const [favoriteManagerType, setFavoriteManagerType] = useState(null);
    const [favoriteManagerSearch, setFavoriteManagerSearch] = useState("");
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [conversationFilter, setConversationFilter] = useState('all');
    const [pendingConversationEntryId, setPendingConversationEntryId] = useState(null);
    const [isConversationsLoading, setIsConversationsLoading] = useState(false);
    const [conversationToDelete, setConversationToDelete] = useState(null);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const resultsRef = useRef(null);

    // Effet centralisé pour gérer les paramètres d'URL
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        let urlHasChanged = false;

        if (tabParam) {
            setSearchMode(tabParam);
            newSearchParams.delete('tab');
            urlHasChanged = true;
        }

        if (resIdParam) {
            setAutoOpenResId(parseInt(resIdParam));
            newSearchParams.delete('resId');
            urlHasChanged = true;
        }

        if (msgIdParam) {
            setSearchMode('home');
            setPendingConversationEntryId(Number(msgIdParam));
            newSearchParams.delete('msgId');
            urlHasChanged = true;
        }

        if (urlHasChanged) {
            router.replace(`?${newSearchParams.toString()}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabParam, resIdParam, msgIdParam]);

    const handleSearchMode = (current) => {
        setSearchMode(current);
        setAutoOpenResId(null); // Réinitialiser l'ID pour ne pas rouvrir le modal
    };

    const shouldShowDashboardTutorialButton = () => {
        if (!session?.user?.createdAt) return false;
        return Date.now() - new Date(session.user.createdAt).getTime() <= TUTORIAL_DASHBOARD_WINDOW_MS;
    };

    const [data, setData] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [hasSearchedAvailability, setHasSearchedAvailability] = useState(false);
    const [isRecurrent, setIsRecurrent] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [stepDirection, setStepDirection] = useState("forward");
    const isMobile = useMediaQuery({query: '(max-width: 768px)'}); // Détecte les écrans de moins de 768px
    const router = useRouter();

    const fetchConversations = useCallback(async () => {
        if (!session?.user?.id) return;

        setIsConversationsLoading(true);
        try {
            const query = new URLSearchParams();
            if (pendingConversationEntryId) query.set('entryId', pendingConversationEntryId);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations?${query.toString()}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.message || 'Failed to fetch conversations');
            }

            const payload = await response.json();
            setConversations(payload.conversations || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsConversationsLoading(false);
        }
    }, [pendingConversationEntryId, session?.user?.id]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!pendingConversationEntryId || !conversations.length) return;

        const conversation = conversations.find((item) => Number(item.entryId) === Number(pendingConversationEntryId));
        if (!conversation) return;

        setSelectedConversation(conversation);
        setPendingConversationEntryId(null);
    }, [conversations, pendingConversationEntryId]);

    const deleteConversation = async (conversationId) => {
        if (!conversationId) return;

        try {
            setSelectedConversation((currentConversation) => Number(currentConversation?.conversationId) === Number(conversationId) ? null : currentConversation);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || ''}/api/conversations/${conversationId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload.message || 'Impossible de supprimer la discussion');
            }

            setConversations((currentConversations) => currentConversations.filter((conversation) => Number(conversation.conversationId) !== Number(conversationId)));
            addToast({
                title: "Discussion supprimée",
                description: "La discussion a été supprimée.",
                color: "success",
                timeout: 4000,
            });
        } catch (error) {
            console.error(error);
            addToast({
                title: "Erreur",
                description: error.message || "Impossible de supprimer la discussion.",
                color: "danger",
                timeout: 5000,
            });
        }
    };

    const requestDeleteConversation = (conversation) => {
        if (!conversation?.conversationId || conversation.contextType !== 'ENTRY') return;
        setConversationToDelete(conversation);
    };

    const confirmDeleteConversation = async () => {
        const conversationId = conversationToDelete?.conversationId;
        setConversationToDelete(null);
        await deleteConversation(conversationId);
    };

    const markConversationReadLocally = useCallback(() => {
        const conversationId = selectedConversation?.conversationId;
        if (!conversationId) return;

        setConversations((currentConversations) => {
            let changed = false;
            const nextConversations = currentConversations.map((conversation) => {
                if (Number(conversation.conversationId) !== Number(conversationId) || conversation.unreadCount <= 0) return conversation;
                changed = true;
                return {...conversation, unreadCount: 0};
            });

            return changed ? nextConversations : currentConversations;
        });
        setSelectedConversation((currentConversation) => (
            Number(currentConversation?.conversationId) === Number(conversationId) && currentConversation.unreadCount > 0 ? {...currentConversation, unreadCount: 0} : currentConversation
        ));
    }, [selectedConversation?.conversationId]);

    const filteredConversations = conversations.filter((conversation) => {
        if (conversationFilter === 'unread') return conversation.unreadCount > 0;
        if (conversationFilter === 'entries') return conversation.contextType === 'ENTRY';
        if (conversationFilter === 'events') return conversation.contextType === 'RESOURCE_EVENT';
        return true;
    });

    const conversationFilters = [
        {key: 'all', label: 'Tous', count: conversations.length},
        {key: 'unread', label: 'Non lus', count: conversations.filter((conversation) => conversation.unreadCount > 0).length},
        {key: 'entries', label: 'Réservations', count: conversations.filter((conversation) => conversation.contextType === 'ENTRY').length},
        {key: 'events', label: 'Événements', count: conversations.filter((conversation) => conversation.contextType === 'RESOURCE_EVENT').length},
    ];

    const methods = useForm({
        resolver: yupResolver(schemaFirstPart),
        mode: 'onSubmit',
    });

    const {watch, setValue, formState: {errors}} = methods;

    const {data: favorites = {sites: [], resources: []}} = useQuery({
        queryKey: ['favorites', session?.user?.id],
        enabled: !!session?.user?.id,
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/favorites`, {
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer les favoris');
            }

            return response.json();
        },
    });

    useEffect(() => {
        if (searchMode !== "search") return;
        if (watch("site") || !favorites.sites.length) return;

        setValue("site", favorites.sites[0]);
        setValue("category", null);
        setValue("resource", null);
    }, [favorites.sites, searchMode, setValue, watch]);

    const {data: favoriteManagerSites = [], isLoading: isFavoriteManagerSitesLoading} = useQuery({
        queryKey: ['favorite-manager-sites'],
        enabled: favoriteManagerType === "sites",
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/domains`, {
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer les sites');
            }

            return response.json();
        },
    });

    const {data: favoriteManagerResources = [], isLoading: isFavoriteManagerResourcesLoading} = useQuery({
        queryKey: ['favorite-manager-resources'],
        enabled: favoriteManagerType === "resources",
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/resources`, {
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Impossible de récupérer les ressources');
            }

            return response.json();
        },
    });

    const addFavoriteMutation = useMutation({
        mutationFn: async ({type, itemId}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/favorites`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({type, itemId}),
            });

            if (!response.ok) {
                throw new Error('Impossible d’ajouter le favori');
            }

            return response.json();
        },
        onSuccess: (nextFavorites) => {
            queryClient.setQueryData(['favorites', session?.user?.id], nextFavorites);
        },
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: async ({type, itemId}) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/favorites`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({type, itemId}),
            });

            if (!response.ok) {
                throw new Error('Impossible de retirer le favori');
            }

            return response.json();
        },
        onSuccess: (nextFavorites) => {
            queryClient.setQueryData(['favorites', session?.user?.id], nextFavorites);
        },
    });

    const navigateStep = (nextStep) => {
        setStepDirection(nextStep >= activeStep ? "forward" : "backward");
        setActiveStep(nextStep);
    };

    const addFavorite = (type, item) => {
        if (!item) return;

        const key = type === "sites" ? "sites" : "resources";
        if (favorites[key].some((favorite) => favorite.id === item.id)) return;

        addFavoriteMutation.mutate({type: key, itemId: item.id});
        addToast({
            title: "Favori ajouté",
            description: `${item.name} est maintenant disponible en raccourci.`,
            color: "success",
            duration: 3000,
        });
    };

    const removeFavorite = (type, favoriteId) => {
        const key = type === "sites" ? "sites" : "resources";
        removeFavoriteMutation.mutate({type: key, itemId: favoriteId});
    };

    const openFavoriteManager = (type) => {
        setFavoriteManagerType(type);
        setFavoriteManagerSearch("");
    };

    const closeFavoriteManager = () => {
        setFavoriteManagerType(null);
        setFavoriteManagerSearch("");
    };

    const applyFavorite = (type, favorite) => {
        setSearchMode("search");
        if (type === "sites") {
            setValue("site", favorite);
            setValue("category", null);
            setValue("resource", null);
            navigateStep(2);
        } else {
            setValue("site", favorite.domains || null);
            setValue("category", favorite.category || null);
            setValue("resource", favorite);
            navigateStep(4);
        }
        setData(null);
        setIsSubmitted(false);
        setHasSearchedAvailability(false);
        queryClient.invalidateQueries({queryKey: ['isAvailable']});
    };

    // Effet pour synchroniser l'état lors du changement de taille d'écran
    useEffect(() => {
        // Réinitialiser les erreurs lors du changement de layout
        if (Object.keys(errors).length > 0) {
            methods.clearErrors();
        }
    }, [isMobile, methods, errors]);

    const handleRefresh = ()=>{
        handleResetAllFilters();
        userEntriesRefetch();
        setIsSubmitted(false);
        setData(null);
        setHasSearchedAvailability(false);

        setIsRecurrent(false);

    }

    const handleRefreshOnCreateEntry = () => {
        handleRefresh();
        setSearchMode("bookings");
    }

    const isAvailable = async ({queryKey}) => {
        const [_, data] = queryKey;

        const startDate = data.date.start.toISOString();
        const endDate = data.date.end.toISOString();

        // Gestion des paramètres récurrents
        let recurrentParams = '';
        if (isRecurrent && data.recursive_unit && data.recursive_limit) {
            const limit = new Date(data.recursive_limit);
            recurrentParams = `recurrent_limit=${limit.toISOString()}&recurrent_unit=${data.recursive_unit.name}&`;
        }

        const params = new URLSearchParams({
            siteId: data.site.id,
            categoryId: data.category.id,
            domainId: data.site.id,
            startDate,
            endDate,
        });

        if (data.resource?.id) params.set("resourceId", data.resource.id);
        if (recurrentParams) {
            params.set("recurrent_limit", new Date(data.recursive_limit).toISOString());
            params.set("recurrent_unit", data.recursive_unit.name);
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/reservation?${params.toString()}`
        ).catch((error) => {
            console.error('Error fetching data:', error);
            throw error;
        })

        setIsSubmitted(false);
        if (response.status === 200) {
            addToast({
                title: 'Ressources disponibles récupérées avec succès',
                color: 'success',
                duration: 5000,
            });
            return await response.json();
        } else if (response.status === 204) {
            addToast({
                title: 'Aucune ressource disponible',
                description: "Essayer un autre intervalle de date ou d'autres critères.",
                color: 'warning',
                duration: 5000,
            });
        } else {
            addToast({
                title: 'Une erreur est survenue',
                color: 'danger',
                duration: 5000,
            });
        }
        ;
        setIsSubmitted(false);


        return null;
    }

    const { data: userEntries, refetch : userEntriesRefetch } = useQuery({
        queryKey: ['userEntries', session?.user?.id],
        enabled: !!session?.user?.id,
        queryFn: async ({ queryKey }) => {
            const userId = queryKey[1];
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/entry?userId=${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }
    });

    const [delayed, setDelayed] = useState(0);
    const [resetKeytResetKey] = useState(0);

    useEffect(() => {
        if (!userEntries) {
            setDelayed(0);
            return;
        }

        const numDelayed = userEntries.filter(
            (entry) => entry.moderate === "USED" && new Date(entry.endDate) < new Date()
        ).length;

        setDelayed(numDelayed);

        if (numDelayed > 0) {
            addToast({
                title: 'Retard',
                description: `Vous avez ${numDelayed} réservation${numDelayed > 1 ? 's' : ''} en retard.`,
                color: 'warning',
                duration: 5000,
            });
        }
    }, [userEntries]);

    const {data: availableResources, refetch: refetchARD, isFetching: isLoadingAvailableResources} = useQuery({
        queryKey: ['isAvailable', data],
        queryFn: isAvailable,
        enabled: isSubmitted,
    });

    useEffect(() => {
        if (!hasSearchedAvailability || (!isLoadingAvailableResources && !availableResources)) return;

        window.requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({behavior: 'smooth', block: 'start'});
        });
    }, [availableResources, hasSearchedAvailability, isLoadingAvailableResources]);

    const handleResourceOnReset = () => {
        setValue('resource', null);
        setData({...data, resource: null});
        queryClient.invalidateQueries({queryKey: ['resource']});
        methods.trigger('resource');
    }

    const handleResetAllFilters = ()=>{
        methods.reset({
            site : null,
            category : null,
            resource : null,
            date : null,
        });
        setData(null);
        queryClient.invalidateQueries({queryKey: ['isAvailable']})
        queryClient.invalidateQueries(['domains']);
        queryClient.invalidateQueries(['categories']);
        queryClient.invalidateQueries(['resources']);
        setIsRecurrent(false);
        setHasSearchedAvailability(false);
    }

    const onSubmit = async (formData) => {
        console.log('DEBUG - onSubmit called with formData:', formData);

        // Vérifier si le formulaire est valide
        const isValid = await methods.trigger();
        console.log('DEBUG - Form validation result:', isValid);

        if (!isValid) {
            console.log('DEBUG - Form validation failed');
            addToast({
                title: 'Formulaire invalide',
                description: 'Veuillez remplir tous les champs requis',
                color: 'warning',
                duration: 5000,
            });
            return;
        }

        // Si isRecurrent est true, vérifier que les champs récurrents sont remplis
        if (isRecurrent) {
            const recursiveUnit = watch('recursive_unit');
            const recursiveLimit = watch('recursive_limit');

            if (!recursiveUnit || !recursiveLimit) {
                addToast({
                    title: 'Champs manquants',
                    description: 'Veuillez remplir la fréquence et la date de fin pour la récurrence',
                    color: 'warning',
                    duration: 5000,
                });
                return;
            }
        }

        // Ajouter les champs récurrents au formData si nécessaire
        const finalFormData = {
            ...formData,
            recursive_unit: isRecurrent ? watch('recursive_unit') : null,
            recursive_limit: isRecurrent ? watch('recursive_limit') : null
        };

        setData(finalFormData);
        setIsSubmitted(true);
        setHasSearchedAvailability(true);

        // Nettoyer les erreurs de validation
        methods.clearErrors();
    };


    const isRecurrentValid = useCallback((unit) => {
        const startDate = watch('date')?.start;
        const endDate = watch('date')?.end;

        if (!startDate || !endDate) return false;

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Vérifier que la date de fin est après la date de début
        if (end <= start) return false;

        const diffInMilliseconds = end.getTime() - start.getTime();
        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

        switch (unit) {
            case "jour":
                // Pour une récurrence journalière, vérifier que c'est le même jour
                return start.getDate() === end.getDate() &&
                    start.getMonth() === end.getMonth() &&
                    start.getFullYear() === end.getFullYear();

            case "hebdomadaire":
                // Pour une récurrence hebdomadaire, vérifier que c'est moins d'une semaine
                return diffInHours <= 24 * 7;

            default:
                return false;
        }
    }, [watch]);

    const handleDateChangeCheck = useCallback(() => {
        if (!isRecurrentValid("hebdomadaire") && !isRecurrentValid("jour")) {
            setIsRecurrent(false);
        }
    }, [isRecurrentValid, setIsRecurrent]);

    const getOngoingAndDelayedEntries = () => {
        const ongoingEntries = userEntries?.filter((entry) => entry.moderate === "USED" || entry.moderate === "ACCEPTED" || entry.moderate === "WAITING");
        const delayedEntries = ongoingEntries?.filter((entry) => new Date(entry.endDate) < new Date());
        return {
            total: ongoingEntries?.length + delayedEntries?.length,
            delayed: delayedEntries?.length > 0,
        };
    }

    const site = watch('site');
    const category = watch('category');
    const resource = watch('resource');
    const date = watch('date');

    let step = 1;
    if (site) step = 2;
    if (site && category) step = 4;

    useEffect(() => {
        if (activeStep > step) {
            setStepDirection("backward");
            setActiveStep(step);
        }
    }, [activeStep, step]);

    const stepDetails = {
        1: {
            title: "Choisissez un site",
            description: "Sélectionnez le site sur lequel vous souhaitez effectuer une réservation.",
            helper: "Les catégories seront disponibles après la sélection d’un site.",
            icon: <BuildingOffice2Icon className="h-20 w-20" />,
            cta: "Continuer"
        },
        2: {
            title: "Choisissez une catégorie",
            description: "Affinez votre recherche selon le type de ressource à réserver.",
            helper: "Les ressources seront filtrées selon le site et la catégorie sélectionnés.",
            icon: <RectangleGroupIcon className="h-20 w-20" />,
            cta: "Continuer"
        },
        3: {
            title: "Choisissez une ressource",
            description: "Sélectionnez une ressource précise ou continuez pour chercher toutes les ressources disponibles.",
            helper: "La ressource est optionnelle : laissez ce champ vide pour afficher toutes les disponibilités compatibles.",
            icon: <TruckIcon className="h-20 w-20" />,
            cta: "Continuer"
        },
        4: {
            title: "Choisissez une date et une heure",
            description: "Définissez le créneau souhaité, puis lancez la recherche de disponibilités.",
            helper: "La récurrence devient disponible lorsque le créneau sélectionné est compatible.",
            icon: <CalendarDaysIcon className="h-20 w-20" />,
            cta: "Rechercher"
        }
    };

    const currentStepDetails = stepDetails[activeStep];

    const handleContinueStep = async () => {
        if (activeStep === 1) {
            const isValid = await methods.trigger('site');
            if (!isValid || !site) return;
            navigateStep(2);
            return;
        }

        if (activeStep === 2) {
            const isValid = await methods.trigger('category');
            if (!isValid || !category) return;
            navigateStep(3);
            return;
        }

        if (activeStep === 3) {
            navigateStep(4);
            return;
        }

        methods.handleSubmit(onSubmit)();
    };

    const selectClassNames = {
        label: "text-sm font-semibold text-[#111827] dark:text-neutral-100",
        trigger: "h-11 rounded-xl border-[#d8e0ea] bg-white px-4 text-sm shadow-none hover:border-[#aebbcc] focus:ring-[#ff2a2f] dark:border-neutral-700 dark:bg-neutral-950",
        value: "text-[#111827] dark:text-neutral-100",
        placeholder: "text-[#6b7585] dark:text-neutral-400"
    };

    const getHomeEntryStatus = (entry) => {
        if (!entry) return "unknown";
        const nowDate = new Date();
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);

        if (entry.moderate === "WAITING") return "waiting";
        if (entry.moderate === "REJECTED") return "rejected";
        if (entry.moderate === "ENDED" || entry.returned) return "ended";
        if (entry.moderate === "USED" && end < nowDate) return "delayed";
        if (entry.moderate === "USED" || (entry.moderate === "ACCEPTED" && start <= nowDate && end >= nowDate)) return "ongoing";
        if (start > nowDate) return "upcoming";
        return "unknown";
    };

    const formatHomeDate = (date) => new Date(date).toLocaleDateString("fr-FR", {day: "numeric", month: "short", year: "numeric"});
    const formatHomeTimeRange = (entry) => `${new Date(entry.startDate).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})} - ${new Date(entry.endDate).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}`;
    const formatAvailabilityDate = (date) => new Date(date).toLocaleDateString("fr-FR", {day: "2-digit", month: "2-digit"});
    const normalizeSearchValue = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const getFavoriteAvailabilityLabel = (resource) => {
        const nowDate = new Date();
        const nextReservation = (userEntries || [])
            .filter((entry) => entry.resource?.id === resource?.id && new Date(entry.startDate) > nowDate)
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

        return nextReservation ? `Disponible jusqu’au ${formatAvailabilityDate(nextReservation.startDate)}` : "Disponible";
    };

    const CategoryIconBox = ({category, tone = "blue"}) => {
        const {Icon} = getCategoryIcon(category?.iconKey);
        const iconSvg = category?.iconSvg;
        const toneClass = tone === "red" ? "bg-red-50 text-red-500" : tone === "orange" ? "bg-orange-50 text-orange-500" : tone === "green" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600";

        return (
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${toneClass}`}>
                {iconSvg ? <span className="h-7 w-7" dangerouslySetInnerHTML={{__html: iconSvg}} /> : <Icon className="h-7 w-7" />}
            </span>
        );
    };

    const HomeCard = ({children, className = ""}) => (
        <div className={`rounded-2xl border border-[#e2e8f0] bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950 ${className}`}>{children}</div>
    );

    const FavoriteResourceCard = ({resource}) => (
        <button type="button" onClick={() => applyFavorite("resources", resource)} className="flex min-h-32 min-w-0 flex-col rounded-2xl border border-[#e2e8f0] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
            <span className="flex min-w-0 items-start gap-3">
                <CategoryIconBox category={resource?.category} tone="green" />
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-[#111827] dark:text-neutral-100">{resource?.name}</span>
                    <span className="mt-1 block truncate text-sm text-[#6b7585] dark:text-neutral-400">{resource?.category?.name || "Ressource"}</span>
                </span>
            </span>
            <span className="mt-3 flex items-start gap-2 text-xs font-bold leading-snug text-emerald-600"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><span>Disponible<br />{getFavoriteAvailabilityLabel(resource).replace(/^Disponible\s*/, "")}</span></span>
        </button>
    );

    const FavoriteSiteCard = ({site}) => {
        const resourceCount = Number(site?.resourceCount || 0);

        return (
        <button type="button" onClick={() => applyFavorite("sites", site)} className="flex min-h-32 min-w-0 items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white p-4 text-left shadow-sm transition-colors hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#6b7585] ring-1 ring-slate-100 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-800">
                <MapPinIcon className="h-7 w-7" />
            </span>
            <span className="min-w-0">
                <span className="block truncate text-sm font-black text-[#111827] dark:text-neutral-100">{site?.name}</span>
                <span className="mt-1 block truncate text-sm font-medium text-[#8a94a6] dark:text-neutral-500">
                    {resourceCount} ressource{resourceCount > 1 ? 's' : ''}
                </span>
            </span>
        </button>
        );
    };

    const FavoriteManagerDialog = () => {
        const type = favoriteManagerType === "sites" ? "sites" : "resources";
        const isSitesManager = type === "sites";
        const items = isSitesManager ? favoriteManagerSites : favoriteManagerResources;
        const safeItems = Array.isArray(items) ? items : [];
        const isLoading = isSitesManager ? isFavoriteManagerSitesLoading : isFavoriteManagerResourcesLoading;
        const favoriteIds = new Set(favorites[type].map((favorite) => favorite.id));
        const search = normalizeSearchValue(favoriteManagerSearch.trim());
        const filteredItems = safeItems.filter((item) => {
            const label = item?.name || item?.distinguishedName || "";
            const description = isSitesManager ? "Site" : [item?.domains?.name, item?.category?.name, item?.description, item?.status].filter(Boolean).join(" ");
            return normalizeSearchValue(`${label} ${description} ${item?.id}`).includes(search);
        });
        const favoriteItems = filteredItems.filter((item) => favoriteIds.has(item.id));
        const otherItems = filteredItems.filter((item) => !favoriteIds.has(item.id));
        const renderFavoriteManagerItem = (item) => {
            const isFavorite = favoriteIds.has(item.id);
            const label = item?.name || item?.distinguishedName || "Sans nom";
            const description = isSitesManager ? "Site" : [item?.domains?.name, item?.category?.name].filter(Boolean).join(" • ") || "Ressource";

            return (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-[#edf1f6] p-4 last:border-b-0 dark:border-neutral-800">
                    <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-[#111827] dark:text-neutral-100">{label}</span>
                        <span className="mt-1 block truncate text-sm text-[#6b7585] dark:text-neutral-400">{description}</span>
                    </div>
                    <button
                        type="button"
                        disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                        onClick={() => isFavorite ? removeFavorite(type, item.id) : addFavorite(type, item)}
                        aria-label={isFavorite ? "Supprimer des favoris" : "Ajouter aux favoris"}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-red-500 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-red-950/30"
                    >
                        {isFavorite ? <StarSolidIcon className="h-6 w-6" /> : <StarOutlineIcon className="h-6 w-6" />}
                    </button>
                </div>
            );
        };

        return (
            <Dialog open={favoriteManagerType !== null} onOpenChange={(open) => !open && closeFavoriteManager()}>
                <DialogContent className="max-w-2xl rounded-2xl border-[#dfe6ee] bg-white p-0 text-[#111827] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                    <DialogHeader className="border-b border-[#edf1f6] p-6 text-left dark:border-neutral-800">
                        <DialogTitle className="text-2xl font-black">Gérer les {isSitesManager ? "sites favoris" : "ressources favorites"}</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-[#6b7585] dark:text-neutral-400">
                            Recherchez puis cliquez sur l’étoile pour ajouter ou supprimer un favori.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 p-6">
                        <Input
                            type="search"
                            value={favoriteManagerSearch}
                            onChange={(event) => setFavoriteManagerSearch(event.target.value)}
                            placeholder={isSitesManager ? "Rechercher un site" : "Rechercher une ressource"}
                            className="h-12 rounded-xl border-[#dfe6ee] bg-white px-4 text-base font-semibold dark:border-neutral-800 dark:bg-neutral-900"
                        />

                        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-[#edf1f6] dark:border-neutral-800">
                            {isLoading && <p className="p-5 text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Chargement...</p>}
                            {!isLoading && !filteredItems.length && <p className="p-5 text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Aucun résultat.</p>}
                            {!isLoading && favoriteItems.map(renderFavoriteManagerItem)}
                            {!isLoading && favoriteItems.length > 0 && otherItems.length > 0 && <div className="my-2 h-px bg-[#edf1f6] dark:bg-neutral-800" />}
                            {!isLoading && otherItems.map(renderFavoriteManagerItem)}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    const ReservationRow = ({entry}) => {
        const status = getHomeEntryStatus(entry);
        const statusClass = status === "ongoing" ? "bg-emerald-50 text-emerald-600" : status === "waiting" ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600";
        const statusLabel = status === "ongoing" ? "En cours" : status === "waiting" ? "En attente" : "À venir";

        return (
            <div className="grid gap-4 border-t border-[#edf1f6] px-4 py-4 md:grid-cols-[minmax(0,1fr)_120px_180px_24px] md:items-center dark:border-neutral-800">
                <div className="flex min-w-0 items-center gap-4">
                    <CategoryIconBox category={entry.resource?.category} tone={status === "ongoing" ? "green" : "blue"} />
                    <div className="min-w-0">
                        <div className="truncate text-base font-black text-[#111827] dark:text-neutral-100">{entry.resource?.name || "Ressource inconnue"}</div>
                        <div className="mt-1 truncate text-sm text-[#6b7585] dark:text-neutral-400">{entry.resource?.domains?.name || "Site"} <span className="mx-1">•</span> {entry.resource?.category?.name || "Catégorie"}</div>
                    </div>
                </div>
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>{statusLabel}</span>
                <div className="text-sm font-semibold text-[#5f6b7a] dark:text-neutral-400">
                    <div>{formatHomeDate(entry.startDate)}</div>
                    <div className="mt-1">{formatHomeTimeRange(entry)}</div>
                </div>
                <ArrowRightIcon className="hidden h-5 w-5 text-[#8a96a8] md:block" />
            </div>
        );
    };

    const ConversationRow = ({conversation}) => (
        <div className="flex w-full items-start gap-3 border-t border-[#edf1f6] px-5 py-4 transition-colors hover:bg-[#f8fafc] dark:border-neutral-800 dark:hover:bg-neutral-900">
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1f1] text-sm font-black text-[#d71920]">
                {conversation.ownerInitials || 'R'}
            </span>
            <button type="button" onClick={() => setSelectedConversation(conversation)} className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-black text-[#111827] dark:text-neutral-100">{conversation.ownerName || 'Responsable'}</span>
                    {conversation.unreadCount > 0 && (
                        <span className="rounded-full bg-[#ff2a2f] px-2 py-0.5 text-[10px] font-black text-white">{conversation.unreadCount}</span>
                    )}
                </span>
                <span className="mt-1 block truncate text-xs font-semibold text-[#6b7585] dark:text-neutral-400">{conversation.resourceName}</span>
                <span className="mt-1 block truncate text-xs font-semibold text-[#6b7585] dark:text-neutral-400">{conversation.reservationLabel}</span>
            </button>
            {conversation.contextType === 'ENTRY' && (
                <button type="button" aria-label="Supprimer la discussion" onClick={() => requestDeleteConversation(conversation)} className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8a96a8] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20">
                    <TrashIcon className="h-4 w-4" />
                </button>
            )}
        </div>
    );

    const MessagesPanel = () => {
        if (selectedConversation) {
            return (
                <HomeCard className="flex min-h-[420px] flex-col overflow-hidden xl:h-[calc(100vh-190px)]">
                    <div className="flex items-start gap-3 p-5">
                        <button type="button" onClick={() => setSelectedConversation(null)} aria-label="Retour aux messages" className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5f6b7a] transition-colors hover:bg-[#f3f6fa] hover:text-[#111827] dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100">
                            <ChevronLeftIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h2 className="truncate text-xl font-black text-[#111827] dark:text-neutral-100">{selectedConversation.resourceName}</h2>
                            <p className="mt-1 truncate text-sm font-semibold text-[#6b7585] dark:text-neutral-400">{selectedConversation.siteName} · {selectedConversation.categoryName} · {selectedConversation.reservationLabel}</p>
                        </div>
                        {selectedConversation.contextType === 'ENTRY' && (
                            <button type="button" aria-label="Supprimer la discussion" onClick={() => requestDeleteConversation(selectedConversation)} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#8a96a8] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <ConversationChat
                        conversationId={selectedConversation.conversationId}
                        className="m-4 flex-1 rounded-xl shadow-none"
                        onMessageSent={fetchConversations}
                        onMessagesRead={markConversationReadLocally}
                    />
                </HomeCard>
            );
        }

        return (
            <HomeCard className="flex min-h-[420px] flex-col overflow-hidden xl:h-[calc(100vh-190px)]">
                <div className="flex items-center justify-between p-5">
                    <h2 className="text-xl font-black">Messages</h2>
                    <button type="button" onClick={fetchConversations} disabled={isConversationsLoading} className="inline-flex items-center gap-2 text-sm font-black text-red-500 disabled:cursor-not-allowed disabled:opacity-60">
                        {isConversationsLoading && (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-500" aria-hidden="true" />
                        )}
                        Actualiser
                    </button>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-[#edf1f6] px-5 py-3 dark:border-neutral-800">
                    {conversationFilters.map((filter) => (
                        <button key={filter.key} type="button" onClick={() => setConversationFilter(filter.key)} className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${conversationFilter === filter.key ? 'bg-[#ff2a2f] text-white' : 'bg-[#f3f6fa] text-[#5f6b7a] hover:bg-[#e8edf4] dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}>
                            {filter.label} <span className="ml-1 opacity-70">{filter.count}</span>
                        </button>
                    ))}
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isConversationsLoading && !conversations.length ? (
                        <div className="flex h-full min-h-[280px] items-center justify-center p-5">
                            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#eef1f5] border-t-red-500" aria-label="Chargement des messages" />
                        </div>
                    ) : filteredConversations.length ? filteredConversations.map((conversation) => (
                        <ConversationRow key={conversation.conversationId || `${conversation.contextType}-${conversation.entryId}`} conversation={conversation} />
                    )) : (
                        <div className="flex h-full min-h-[280px] items-center p-5">
                            <div className="flex items-center gap-4">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f6fa] text-[#5f6b7a] dark:bg-neutral-900 dark:text-neutral-300">
                                    <InformationCircleIcon className="h-6 w-6" />
                                </span>
                                <span>
                                    <span className="block font-black">Aucun message</span>
                                    <span className="text-sm text-[#6b7585]">Aucune discussion ne correspond au filtre sélectionné.</span>
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </HomeCard>
        );
    };

    const HomeDashboard = () => {
        const entriesList = userEntries || [];
        const nextEntries = entriesList
            .filter((entry) => ["ongoing", "upcoming", "waiting"].includes(getHomeEntryStatus(entry)))
            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
            .slice(0, 3);
        const userName = session?.user?.name ? `${session.user.name[0].toUpperCase()}${session.user.name.slice(1)}` : "";
        const visibleResourceFavorites = favorites.resources.slice(0, 2);
        const hiddenResourceFavoritesCount = Math.max(0, favorites.resources.length - visibleResourceFavorites.length);

        return (
            <main className="mx-auto flex min-h-[calc(100vh-72px)] w-full max-w-[1296px] flex-col px-4 py-4 md:px-6 xl:h-[calc(100vh-72px)] xl:overflow-hidden">
                <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-3xl font-black text-[#111827] dark:text-neutral-100 md:text-4xl">Bonjour {userName || "à vous"} ! 👋 </h1>
                    {shouldShowDashboardTutorialButton() && (
                        <Button type="button" onClick={() => setIsTutorialOpen(true)} className="h-11 w-full rounded-xl bg-[#ff2a2f] px-5 font-black text-white hover:bg-[#d71920] sm:w-auto">
                            Lancer le tutoriel
                        </Button>
                    )}
                </div>

                <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_520px] xl:overflow-hidden">
                    <div className="min-h-0 space-y-4 xl:overflow-hidden">
                        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-black text-[#111827] dark:text-neutral-100">Ressources favorites</h2>
                                    <button type="button" onClick={() => openFavoriteManager("resources")} className="text-sm font-bold text-[#5f6b7a] hover:text-[#111827]">Gérer</button>
                                </div>
                                <div className={`grid gap-3 ${hiddenResourceFavoritesCount ? 'sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_56px]' : 'sm:grid-cols-2'}`}>
                                    {visibleResourceFavorites.map((favorite) => <FavoriteResourceCard key={favorite.id} resource={favorite} />)}
                                    {hiddenResourceFavoritesCount > 0 && (
                                        <button type="button" onClick={() => openFavoriteManager("resources")} className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#d8e0ea] bg-white px-3 text-sm font-black text-[#6b7585] shadow-sm transition-colors hover:bg-[#fbfcff] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900">
                                            +{hiddenResourceFavoritesCount}
                                        </button>
                                    )}
                                    {!favorites.resources.length && <p className="text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Aucune ressource favorite.</p>}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-black text-[#111827] dark:text-neutral-100">Site favori</h2>
                                    <button type="button" onClick={() => openFavoriteManager("sites")} className="text-sm font-bold text-[#5f6b7a] hover:text-[#111827]">Gérer</button>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                                    {favorites.sites.slice(0, 1).map((favorite) => <FavoriteSiteCard key={favorite.id} site={favorite} />)}
                                    {!favorites.sites.length && <p className="text-center text-sm font-semibold text-[#6b7585] dark:text-neutral-400 sm:col-span-2">Aucun site favori.</p>}
                                </div>
                            </section>
                        </div>

                        <HomeCard className="flex min-h-[220px] flex-col overflow-hidden xl:min-h-[280px]">
                            <div className="flex items-center justify-between p-5"><h2 className="text-xl font-black">Mes prochaines réservations</h2><button type="button" onClick={() => handleSearchMode("bookings")} className="text-sm font-black text-red-500">Voir toutes</button></div>
                            {nextEntries.length ? nextEntries.map((entry) => <ReservationRow key={entry.id} entry={entry} />) : <div className="flex-1 border-t p-5 text-sm font-semibold text-[#6b7585]">Aucune réservation à venir.</div>}
                        </HomeCard>
                    </div>

                    <aside className="min-h-0 xl:overflow-hidden">
                        <MessagesPanel />
                    </aside>
                </div>
            </main>
        );
    };

    const SummaryTile = ({icon, label, value}) => (
        <div className="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-3 overflow-hidden rounded-lg border border-[#dfe6ee] bg-white px-4 py-3 text-left dark:border-neutral-800 dark:bg-neutral-950">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f7fb] text-[#5f6b7a] dark:bg-neutral-900 dark:text-neutral-300">{icon}</span>
            <span className="min-w-0">
                <span className="block text-xs font-semibold text-[#6b7585] dark:text-neutral-400">{label}</span>
                <span className="block truncate text-base font-bold text-[#111827] dark:text-neutral-100">{value || "Non défini"}</span>
            </span>
        </div>
    );

    const getSelectedDurationSummary = () => {
        if (!date?.start || !date?.end) return {duration: "-", period: "Sélectionnez une période"};

        const start = new Date(date.start);
        const end = new Date(date.end);
        const days = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const formatDate = (value) => value.toLocaleDateString("fr-FR", {day: "2-digit", month: "short", year: "numeric"});
        const formatTime = (value) => value.toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"});

        return {
            duration: `${days} jour${days > 1 ? "s" : ""}`,
            period: `${formatDate(start)} à ${formatTime(start)} au ${formatDate(end)} à ${formatTime(end)}`,
        };
    };

    const DateRecapPanel = () => {
        const durationSummary = getSelectedDurationSummary();

        return (
            <aside className="flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dfe6ee] bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-sm font-bold uppercase tracking-wide text-[#5f6b7a] dark:text-neutral-400">Récapitulatif</h2>
                <div className="mt-5 space-y-3 overflow-hidden">
                    <SummaryTile icon={<TruckIcon className="h-5 w-5" />} label="Ressource" value={resource?.name || "Toutes les ressources"} />
                    <SummaryTile icon={<BuildingOffice2Icon className="h-5 w-5" />} label="Site" value={site?.name} />
                    <SummaryTile icon={<RectangleGroupIcon className="h-5 w-5" />} label="Catégorie" value={category?.name} />
                    <div className="flex h-32 flex-col justify-center overflow-hidden rounded-lg border border-[#dfe6ee] bg-[#f7f9fc] px-4 py-3 text-center dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="text-xs font-bold uppercase tracking-wide text-[#6b7585] dark:text-neutral-400">Durée sélectionnée</span>
                        <strong className="mt-2 block text-xl font-black text-[#111827] dark:text-neutral-100">{durationSummary.duration}</strong>
                        <span className="mt-1 line-clamp-2 min-h-10 break-words text-xs leading-5 text-[#5f6b7a] dark:text-neutral-400">{durationSummary.period}</span>
                    </div>
                </div>
            </aside>
        );
    };

    const SearchChip = ({children, tone = "recent", icon, onClick, onRemove}) => (
        <span
            className={`inline-flex min-h-9 items-center overflow-hidden rounded-lg border text-sm font-semibold transition-colors ${tone === "favorite"
                ? "border-[#ffd8ad] bg-[#fff6ec] text-[#525b6a] hover:bg-[#ffeedc] dark:border-orange-900/70 dark:bg-orange-950/30 dark:text-orange-100"
                : "border-[#dce6f5] bg-[#f4f8ff] text-[#5f6b7a] hover:bg-[#eaf2ff] dark:border-blue-950 dark:bg-blue-950/30 dark:text-blue-100"}`}
        >
            <button type="button" onClick={onClick} className="inline-flex min-h-9 items-center gap-2 px-3">
                {icon}
                <span>{children}</span>
            </button>
            {onRemove && (
                <button type="button" onClick={onRemove} className="min-h-9 border-l border-current/10 px-2 text-current/60 hover:bg-white/40 hover:text-[#d71920]" aria-label={`Retirer ${children} des favoris`}>
                    <TrashIcon className="h-4 w-4" />
                </button>
            )}
        </span>
    );

    const StepIndicator = () => {
        const steps = ["Site", "Catégorie", "Ressources", "Date & heure"];

        return (
            <div className="border-b border-[#e5ebf3] px-5 py-4 dark:border-neutral-800 md:px-20">
                <div className="grid grid-cols-4 items-start gap-2">
                    {steps.map((label, index) => {
                        const number = index + 1;
                        const isCurrent = activeStep === number;
                        const isDone = number < activeStep || (number < step && number !== 3);
                        const canOpen = number <= step;

                        return (
                            <button
                                key={label}
                                type="button"
                                disabled={!canOpen}
                                onClick={() => navigateStep(number)}
                                className="relative flex flex-col items-center gap-2 text-center disabled:cursor-not-allowed"
                            >
                                {index < steps.length - 1 && (
                                    <div className="absolute left-1/2 top-4 h-0.5 w-full overflow-hidden bg-[#dfe6ee] dark:bg-neutral-800" aria-hidden="true">
                                        <div
                                            className="spotly-step-connector-fill h-full w-full bg-[#ff2a2f]"
                                            style={{
                                                transform: activeStep > number ? 'scaleX(1)' : 'scaleX(0)',
                                                transitionTimingFunction: stepDirection === "forward" ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'cubic-bezier(0.55, 0.06, 0.68, 0.19)'
                                            }}
                                        />
                                    </div>
                                )}
                                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${isCurrent || isDone ? "bg-[#ff2a2f] text-white" : "bg-[#edf2f7] text-[#111827] dark:bg-neutral-800 dark:text-neutral-100"} ${canOpen && !isCurrent ? "hover:bg-[#ffe0e1] hover:text-[#d71920]" : ""}`}>
                                    {number}
                                </div>
                                <span className={`text-[11px] font-bold md:text-sm ${isCurrent ? "text-[#111827] dark:text-white" : "text-[#6b7585] dark:text-neutral-400"}`}>{label}</span>
                                {isCurrent && <span className="hidden h-0.5 w-14 rounded-full bg-[#ff2a2f] md:block" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    const FavoritesPanel = () => (
        <div className="space-y-4 py-2">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] dark:text-neutral-100">
                <StarSolidIcon className="h-4 w-4 text-amber-500" />
                Favoris
            </div>
            <div className="flex flex-wrap gap-3">
                {favorites.sites.slice(0, 1).map((favorite) => (
                    <SearchChip key={`site-${favorite.id}`} tone="favorite" icon={<BuildingOffice2Icon className="h-4 w-4" />} onClick={() => applyFavorite("sites", favorite)}>
                        {favorite.name}
                    </SearchChip>
                ))}
                {favorites.resources.map((favorite) => (
                    <SearchChip key={`resource-${favorite.id}`} tone="favorite" icon={<TruckIcon className="h-4 w-4" />} onClick={() => applyFavorite("resources", favorite)}>
                        {favorite.name}
                    </SearchChip>
                ))}
                {!favorites.sites.length && !favorites.resources.length && (
                    <span className="text-sm text-[#6b7585] dark:text-neutral-400">Vos favoris apparaîtront ici.</span>
                )}
            </div>
        </div>
    );

    const AvailabilityPlaceholder = () => (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#dfe6ee] bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-950 md:flex-row md:gap-8 md:text-left">
            <CalendarDaysIcon className="h-16 w-16 text-[#9aa8bd]" />
            <div>
                <h3 className="text-lg font-bold text-[#111827] dark:text-neutral-100">Les disponibilités apparaîtront ici</h3>
                <p className="mt-2 text-sm text-[#6b7585] dark:text-neutral-400">Après la sélection de vos critères, vous pourrez consulter les créneaux disponibles.</p>
            </div>
        </div>
    );

    const AvailabilityLoading = () => (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#dfe6ee] bg-white p-10 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#ffe0e1] border-t-[#ff2a2f]" />
            <div>
                <h3 className="text-lg font-black text-[#111827] dark:text-neutral-100">Recherche des ressources disponibles</h3>
                <p className="mt-2 text-sm font-semibold text-[#6b7585] dark:text-neutral-400">Nous vérifions les disponibilités sur le créneau sélectionné.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f6f8fb] text-[#111827] dark:bg-neutral-950 dark:text-neutral-100">
            <AlternativeMenu
                user={session?.user}
                handleSearchMode={handleSearchMode}
                userEntriesQuantity={getOngoingAndDelayedEntries()}
                userEntries={userEntries}
                handleRefresh={handleRefresh}
                selectedTab={searchMode}
                onOpenTutorial={() => setIsTutorialOpen(true)}
            />
            <AppTutorial open={isTutorialOpen} onOpenChange={setIsTutorialOpen} onNavigate={handleSearchMode} />

            {searchMode === "home" && <HomeDashboard />}
            <FavoriteManagerDialog />
            <Dialog open={!!conversationToDelete} onOpenChange={(open) => !open && setConversationToDelete(null)}>
                <DialogContent className="rounded-2xl border-[#dfe6ee] bg-white text-[#111827] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                    <DialogHeader>
                        <DialogTitle>Supprimer la discussion ?</DialogTitle>
                        <DialogDescription>
                            Cette action supprimera tous les messages liés à cette réservation.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setConversationToDelete(null)}>Annuler</Button>
                        <Button type="button" onClick={confirmDeleteConversation} className="bg-[#ff2a2f] text-white hover:bg-[#d71920]">Supprimer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {searchMode === "search" && (
                <main className="mx-auto flex w-full max-w-[1296px] flex-col gap-4 px-4 py-4 md:gap-5 md:px-6">
                    <section className="overflow-hidden rounded-xl border border-[#dfe6ee] bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950" role="search">
                        <StepIndicator />
                        <div className={`grid gap-6 p-5 md:p-10 ${activeStep === 4 ? "xl:grid-cols-[minmax(0,1fr)_360px]" : "md:grid-cols-[minmax(0,1fr)_360px]"}`}>
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-[#111827] dark:text-neutral-100">{currentStepDetails.title}</h1>
                                    <p className="mt-2 text-sm text-[#5f6b7a] dark:text-neutral-400">{currentStepDetails.description}</p>
                                </div>

                                {activeStep === 1 && <FavoritesPanel />}

                                <FormProvider {...methods}>
                                    <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                                        {activeStep > 1 && activeStep !== 4 && (
                                            <div className="flex flex-wrap gap-2 rounded-xl border border-[#e5ebf3] bg-[#fbfcff] p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
                                                {site && <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#5f6b7a] dark:bg-neutral-950 dark:text-neutral-300">Site: <span className="text-[#111827] dark:text-white">{site.name}</span></span>}
                                                {category && <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#5f6b7a] dark:bg-neutral-950 dark:text-neutral-300">Catégorie: <span className="text-[#111827] dark:text-white">{category.name}</span></span>}
                                                {resource && <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#5f6b7a] dark:bg-neutral-950 dark:text-neutral-300">Ressource: <span className="text-[#111827] dark:text-white">{resource.name}</span></span>}
                                            </div>
                                        )}

                                        {activeStep === 1 && (
                                            <div className="max-w-3xl">
                                                <SelectField onReset={handleResourceOnReset} name="site" label="Site" options="domains" placeholder="Choisir un site" classNames={selectClassNames} />
                                            </div>
                                        )}

                                        {activeStep === 2 && (
                                            <div className="max-w-3xl rounded-2xl border border-[#e5ebf3] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                <SelectField name="category" label="Catégorie" options="categories" onReset={handleResourceOnReset} placeholder="Choisir une catégorie" classNames={selectClassNames} />
                                            </div>
                                        )}

                                        {activeStep === 3 && (
                                            <div className="max-w-3xl rounded-2xl border border-[#e5ebf3] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                <SelectField
                                                    name="resource"
                                                    awaiting={watch('category') === undefined && watch('site') === undefined}
                                                    label="Ressources"
                                                    options={watch('category') && watch('site') ? `resources?categoryId=${watch('category')?.id}&domainId=${watch('site')?.id}` : null}
                                                    isRequired={false}
                                                    onReset={handleResourceOnReset}
                                                    placeholder="Toutes les ressources"
                                                    classNames={selectClassNames}
                                                />
                                            </div>
                                        )}

                                        {activeStep === 4 && (
                                            <div className="space-y-4">
                                                <DateRangePickerSplitted onChangeCheck={handleDateChangeCheck} setValue={setValue} variant="spotly" presetRange={date} />

                                                <div className="flex items-center gap-5 rounded-xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                                                    <span className="text-base font-bold text-[#111827] dark:text-neutral-100">Récurrent</span>
                                                    <Switch id="recurrent-search" disabled={!isRecurrentValid("hebdomadaire")} checked={isRecurrentValid("hebdomadaire") && isRecurrent} onCheckedChange={setIsRecurrent} />
                                                    <span className="text-sm font-medium text-[#6b7585] dark:text-neutral-400">Activez pour rechercher des créneaux récurrents (quotidiens, hebdomadaires, etc.).</span>
                                                    <InformationCircleIcon className="ml-auto h-5 w-5 shrink-0 text-[#8a96a8]" />
                                                </div>

                                                <div className={`${isRecurrent ? 'grid gap-3 md:grid-cols-2 md:items-start' : 'hidden'}`}>
                                                    <div className="flex min-w-0 flex-col">
                                                        <SelectField
                                                            onReset={handleResourceOnReset}
                                                            name="recursive_unit"
                                                            label="Fréquence"
                                                            options="recursive_units"
                                                            disabled={!isRecurrent}
                                                            isRequired={isRecurrent}
                                                            validates={{"0": isRecurrentValid("jour"), "1": isRecurrentValid("hebdomadaire")}}
                                                            classNames={selectClassNames}
                                                        />
                                                    </div>
                                                    <div className="flex min-w-0 flex-col [&>div:first-child]:my-2">
                                                        <ShadcnDatePicker
                                                            required={isRecurrent}
                                                            disabled={!isRecurrent || watch('date')?.start === undefined}
                                                            label="Jusqu'au"
                                                            value={watch('recursive_limit')}
                                                            min={watch('date')?.end}
                                                            invalid={!!errors.recursive_limit}
                                                            onChange={(_, date) => setValue('recursive_limit', date ? date.toISOString() : null)}
                                                        />
                                                        {errors.recursive_limit && <p className="text-sm text-red-600">{errors.recursive_limit?.message}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="rounded-xl bg-[#eef4ff] px-4 py-3 text-sm font-semibold text-[#3f63bf] dark:bg-blue-950/30 dark:text-blue-200">
                                            <div className="flex items-start gap-3">
                                                <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                                <span>{currentStepDetails.helper}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col-reverse gap-2 sm:flex-row">
                                            {activeStep > 1 && (
                                                <Button type="button" variant="outline" onClick={() => navigateStep(activeStep - 1)} className="h-12 rounded-lg border-[#d8e0ea] px-6 font-bold text-[#5f6b7a]">
                                                    Retour
                                                </Button>
                                            )}
                                            <Button type="button" onClick={handleContinueStep} disabled={isSubmitted} className="h-12 w-full rounded-lg bg-[#ff2a2f] px-6 text-base font-bold text-white hover:bg-[#d71920] sm:w-auto">
                                                {currentStepDetails.cta}
                                                <ArrowRightIcon className="ml-4 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </form>
                                </FormProvider>
                            </div>

                            <aside className="hidden min-w-0 border-l border-[#e5ebf3] pl-10 md:flex md:w-full md:flex-col md:items-center md:justify-center md:text-center dark:border-neutral-800">
                                {activeStep === 4 ? (
                                    <DateRecapPanel />
                                ) : (
                                    <>
                                        <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[#ffe7e8] text-[#ff2a2f]">
                                            {currentStepDetails.icon}
                                        </div>
                                        <p className="mt-8 max-w-64 text-lg font-bold leading-snug text-[#5f6b7a] dark:text-neutral-300">Démarrez plus vite avec vos favoris et éléments récents.</p>
                                    </>
                                )}
                            </aside>
                        </div>
                    </section>

                    <div ref={resultsRef} className="scroll-mt-24" />
                    {isLoadingAvailableResources ? (
                        <AvailabilityLoading />
                    ) : availableResources ? (
                        <section>
                            <MatchingEntriesTable resources={availableResources} methods={methods} entry={data} session={session} handleRefresh={handleRefreshOnCreateEntry} />
                        </section>
                    ) : hasSearchedAvailability ? (
                        <AvailabilityPlaceholder />
                    ) : null}
                </main>
            )}

            {searchMode === "bookings" && (
                <main className="mx-auto w-full max-w-[1296px] px-4 py-4 md:px-6">
                    <ReservationUserListing entries={userEntries} handleRefresh={handleRefresh} autoOpenResId={autoOpenResId} />
                </main>
            )}
        </div>
    );
};

export {ReservationSearch};
