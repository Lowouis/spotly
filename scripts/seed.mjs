import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const defaultTimeOptions = {
    id: 1,
    onPickup: 0,
    onReturn: 0,
    authorizedDelay: 0,
    maxEarlyPickupMinutes: 0,
    shortcutStartHour: 8,
    shortcutEndHour: 18,
    shortcutWeekEndDay: 5,
};

const defaultEventTypes = [
    {name: 'Casse', icon: 'CircleAlert'},
    {name: 'Réparation', icon: 'TriangleAlert'},
    {name: 'Maintenance', icon: 'Wrench'},
    {name: 'Contrôle', icon: 'ClipboardCheck'},
    {name: 'Nettoyage', icon: 'Sparkles'},
    {name: 'Incident signalé', icon: 'CircleAlert'},
];

const pickables = [
    {
        name: 'FLUENT',
        distinguishedName: 'SANS PROTECTION',
        description: 'Aucune action nécessaire de la part de l\'utilisateur.',
        cgu: 'En utilisant cette ressource, vous acceptez que la réservation soit automatiquement validée sans action supplémentaire de votre part. Vous restez responsable du respect des horaires de début et de fin de réservation.'
    },
    {
        name: 'HIGH_TRUST',
        distinguishedName: 'CLIQUE DE RÉSTITUTION',
        description: 'L\'utilisateur doit cliquer sur sa réservation, pour confirmer que la ressource est restitué.',
        cgu: 'En utilisant cette ressource, vous vous engagez à confirmer manuellement la restitution de la ressource via l\'interface de l\'application. La non-confirmation sera considérée comme un retard de restitution.'
    },
    {
        name: 'LOW_TRUST',
        distinguishedName: 'PAR CLIQUE',
        description: 'Pickable pour les ressources de niveau de confiance bas',
        cgu: 'En utilisant cette ressource, vous acceptez de récupèrer et restituer la ressource en cliquant sur le bouton \'Récupérer\' ou \'Restituer\' dans l\'interface de l\'application. Tout manquement pourra entraîner une suspension temporaire de vos droits de réservation.'
    },
    {
        name: 'DIGIT',
        distinguishedName: 'PAR CODE',
        description: 'Récupération et restitution de la ressource par un code à 6 chiffres envoyé par mail.',
        cgu: 'En utilisant cette ressource, vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l\'application.'
    },
    {
        name: 'LOW_AUTH',
        distinguishedName: 'SANS CONNEXION',
        description: 'Pickable pour les ressources de niveau de confiance bas',
        cgu: 'En utilisant cette ressource, vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l\'application ou sans connexion à l\'application via l\'onglet J\'ai deja réservé.'
    },
    {
        name: 'HIGH_AUTH',
        distinguishedName: 'RESTRICTION PAR IP',
        description: 'Pickable pour les ressources de niveau de confiance élevé',
        cgu: 'En utilisant cette ressource, vous acceptez qu\'elle doit être récupérée et restituée uniquement depuis des machines spécifiques. vous vous engagez à utiliser le code à 6 chiffres qui vous sera envoyé par email pour confirmer la récupération et le réstitution de la ressource dans la section Réservations de l\'application ou sans connexion à l\'application via l\'onglet J\'ai deja réservé.'
    }
];

const withTestData = process.argv.includes('--with-test-data');
const isProduction = process.env.NODE_ENV === 'production';
const hasProductionConfirmation = process.argv.includes('--confirm-production');
const adminSeed = {
    name: process.env.SEED_ADMIN_NAME || 'admin',
    surname: process.env.SEED_ADMIN_SURNAME || 'admin',
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@spotly.fr',
    password: process.env.SEED_ADMIN_PASSWORD || 'admin',
};

const demoUsers = [
    {name: 'Claire', surname: 'Bernard', username: 'claire.bernard', email: 'claire.bernard@spotly.test', role: 'ADMIN'},
    {name: 'Emma', surname: 'Rocher', username: 'emma.rocher', email: 'emma.rocher@spotly.test', role: 'ADMIN'},
    {name: 'Mehdi', surname: 'Chevalier', username: 'mehdi.chevalier', email: 'mehdi.chevalier@spotly.test', role: 'ADMIN'},
    {name: 'Julien', surname: 'Moreau', username: 'julien.moreau', email: 'julien.moreau@spotly.test', role: 'USER'},
    {name: 'Camille', surname: 'Lefevre', username: 'camille.lefevre', email: 'camille.lefevre@spotly.test', role: 'USER'},
    {name: 'Ines', surname: 'Garcia', username: 'ines.garcia', email: 'ines.garcia@spotly.test', role: 'USER'},
    {name: 'Laura', surname: 'Nguyen', username: 'laura.nguyen', email: 'laura.nguyen@spotly.test', role: 'USER'},
    {name: 'Antoine', surname: 'Dupont', username: 'antoine.dupont', email: 'antoine.dupont@spotly.test', role: 'USER'},
    {name: 'Lucie', surname: 'Roux', username: 'lucie.roux', email: 'lucie.roux@spotly.test', role: 'USER'},
    {name: 'Marc', surname: 'Lambert', username: 'marc.lambert', email: 'marc.lambert@spotly.test', role: 'USER'},
    {name: 'Sarah', surname: 'Petit', username: 'sarah.petit', email: 'sarah.petit@spotly.test', role: 'USER'},
    {name: 'Youssef', surname: 'Belkacem', username: 'youssef.belkacem', email: 'youssef.belkacem@spotly.test', role: 'USER'},
];

const demoLocations = [
    {libelle: 'Accueil Paris Bastille', ip: '10.20.10.15'},
    {libelle: 'Atelier Lyon', ip: '10.20.20.18'},
    {libelle: 'Studio Nantes', ip: '10.20.30.22'},
];

const legacyLocationIps = ['192.168.1.10', '192.168.1.20', '192.168.1.30'];

const demoDomains = [
    {name: 'Paris Bastille', pickableName: 'HIGH_AUTH', ownerUsername: 'claire.bernard'},
    {name: 'Lyon Part-Dieu', pickableName: 'FLUENT', ownerUsername: 'emma.rocher'},
    {name: 'Lille Euratechnologies', pickableName: 'HIGH_AUTH', ownerUsername: 'mehdi.chevalier'},
    {name: 'Nantes Centre', pickableName: 'FLUENT', ownerUsername: 'emma.rocher'},
    {name: 'Bordeaux Chartrons', pickableName: 'LOW_TRUST', ownerUsername: 'claire.bernard'},
];

const demoCategories = [
    {
        name: 'Ordinateurs portables',
        description: 'Postes nomades pour déplacements, réunions clients et renfort temporaire.',
        pickableName: 'LOW_TRUST',
        ownerUsername: 'claire.bernard',
        iconKey: 'generic',
    },
    {
        name: 'Vidéoprojecteurs',
        description: 'Matériel de projection mobile et solutions d\'affichage pour salles de réunion.',
        pickableName: 'DIGIT',
        ownerUsername: 'emma.rocher',
        iconKey: 'generic',
    },
    {
        name: 'Salles de réunion',
        description: 'Espaces équipés pour ateliers, comités de pilotage et réunions hybrides.',
        pickableName: 'FLUENT',
        ownerUsername: 'emma.rocher',
        iconKey: 'generic',
    },
    {
        name: 'Véhicules de service',
        description: 'Véhicules utilisés pour déplacements inter-sites et interventions terrain.',
        pickableName: 'HIGH_AUTH',
        ownerUsername: 'mehdi.chevalier',
        iconKey: 'generic',
    },
    {
        name: 'Studios podcast',
        description: 'Cabines d\'enregistrement pour podcasts, voix off et interviews.',
        pickableName: 'HIGH_TRUST',
        ownerUsername: 'mehdi.chevalier',
        iconKey: 'generic',
    },
    {
        name: 'Matériel photo',
        description: 'Boîtiers photo et accessoires pour reportages, portraits et événements.',
        pickableName: 'DIGIT',
        ownerUsername: 'claire.bernard',
        iconKey: 'generic',
    },
    {
        name: 'Kits événementiels',
        description: 'Microphones, visioconférence mobile et éclairage léger pour événements.',
        pickableName: 'LOW_AUTH',
        ownerUsername: 'claire.bernard',
        iconKey: 'generic',
    },
];

const demoResources = [
    {
        name: 'Lenovo ThinkPad T14 Gen 4 - PB-014',
        description: 'Portable Windows 14 pouces pour déplacements clients et support terrain.',
        domainName: 'Paris Bastille',
        categoryName: 'Ordinateurs portables',
        moderate: false,
        pickableName: 'HIGH_AUTH',
        ownerUsername: 'claire.bernard',
    },
    {
        name: 'MacBook Pro 14 M3 - PB-021',
        description: 'MacBook destiné aux équipes design et production de contenus.',
        domainName: 'Paris Bastille',
        categoryName: 'Ordinateurs portables',
        moderate: false,
    },
    {
        name: 'Dell Latitude 7440 - LY-104',
        description: 'Portable bureautique premium pour missions de courte durée.',
        domainName: 'Lyon Part-Dieu',
        categoryName: 'Ordinateurs portables',
        moderate: false,
    },
    {
        name: 'HP EliteBook 840 G10 - NTS-008',
        description: 'Poste de remplacement pour équipes support et assistance de proximité.',
        domainName: 'Nantes Centre',
        categoryName: 'Ordinateurs portables',
        moderate: false,
    },
    {
        name: 'Epson EB-L530U - PAR-VID-01',
        description: 'Vidéoprojecteur laser 5200 lumens pour grande salle de réunion.',
        domainName: 'Paris Bastille',
        categoryName: 'Vidéoprojecteurs',
        moderate: true,
    },
    {
        name: 'BenQ LW650 - LIL-VID-02',
        description: 'Projecteur LED mobile pour formations et démonstrations.',
        domainName: 'Lille Euratechnologies',
        categoryName: 'Vidéoprojecteurs',
        moderate: true,
    },
    {
        name: 'Samsung Flip Pro 55 - BDX-VID-03',
        description: 'Écran interactif pour ateliers et revues de planning.',
        domainName: 'Bordeaux Chartrons',
        categoryName: 'Vidéoprojecteurs',
        moderate: true,
    },
    {
        name: 'Salle Loire - 8 places',
        description: 'Salle équipée d\'un écran 65 pouces et d\'une barre de visioconférence.',
        domainName: 'Nantes Centre',
        categoryName: 'Salles de réunion',
        moderate: true,
    },
    {
        name: 'Salle Canut - 12 places',
        description: 'Salle de comité avec caméra plafond et tableau blanc numérique.',
        domainName: 'Lyon Part-Dieu',
        categoryName: 'Salles de réunion',
        moderate: true,
    },
    {
        name: 'Salle Garonne - 10 places',
        description: 'Salle modulable pour rendez-vous client et sessions d\'onboarding.',
        domainName: 'Bordeaux Chartrons',
        categoryName: 'Salles de réunion',
        moderate: true,
    },
    {
        name: 'Renault Kangoo Van E-Tech - VS-201',
        description: 'Utilitaire léger électrique pour interventions techniques et logistique.',
        domainName: 'Lyon Part-Dieu',
        categoryName: 'Véhicules de service',
        moderate: true,
        ownerUsername: 'mehdi.chevalier',
    },
    {
        name: 'Peugeot 208 Affaires - VS-114',
        description: 'Véhicule léger pour déplacements inter-sites et rendez-vous fournisseurs.',
        domainName: 'Bordeaux Chartrons',
        categoryName: 'Véhicules de service',
        moderate: true,
    },
    {
        name: 'Citroen Berlingo Atelier - VS-305',
        description: 'Fourgon atelier pour transport de matériel et maintenance sur site.',
        domainName: 'Paris Bastille',
        categoryName: 'Véhicules de service',
        moderate: true,
        ownerUsername: 'mehdi.chevalier',
    },
    {
        name: 'Studio Podcast A - LIL-AUDIO-01',
        description: 'Cabine traitée acoustiquement avec micros broadcast et table de mixage.',
        domainName: 'Lille Euratechnologies',
        categoryName: 'Studios podcast',
        moderate: true,
    },
    {
        name: 'Studio Podcast B - NTS-AUDIO-02',
        description: 'Studio compact pour voix off, interviews et capsules produit.',
        domainName: 'Nantes Centre',
        categoryName: 'Studios podcast',
        moderate: true,
    },
    {
        name: 'Canon EOS R6 - MEDIA-01',
        description: 'Boîtier hybride plein format pour portraits, reportages et événements.',
        domainName: 'Paris Bastille',
        categoryName: 'Matériel photo',
        moderate: false,
    },
    {
        name: 'Sony A7 IV - MEDIA-02',
        description: 'Boîtier photo/vidéo pour captation corporate et photos internes.',
        domainName: 'Lyon Part-Dieu',
        categoryName: 'Matériel photo',
        moderate: false,
    },
    {
        name: 'Kit Micro HF Sennheiser - EVT-01',
        description: 'Duo de micros HF pour prises de parole et animations événementielles.',
        domainName: 'Paris Bastille',
        categoryName: 'Kits événementiels',
        moderate: false,
    },
    {
        name: 'Pack Visioconférence Poly Studio - EVT-02',
        description: 'Kit mobile visioconférence pour réunions hybrides en salle non équipée.',
        domainName: 'Lille Euratechnologies',
        categoryName: 'Kits événementiels',
        moderate: false,
    },
    {
        name: 'Valise lumière LED Nanlite - EVT-03',
        description: 'Valise de panneaux LED pour tournages légers et interviews sur site.',
        domainName: 'Bordeaux Chartrons',
        categoryName: 'Kits événementiels',
        moderate: false,
    },
];

function addDays(date, days) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
}

function startOfDay(date) {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
}

function setTime(date, hour, minute = 0) {
    const value = new Date(date);
    value.setHours(hour, minute, 0, 0);
    return value;
}

function addHours(date, hours) {
    const value = new Date(date);
    value.setTime(value.getTime() + hours * 60 * 60 * 1000);
    return value;
}

function addMinutes(date, minutes) {
    const value = new Date(date);
    value.setTime(value.getTime() + minutes * 60 * 1000);
    return value;
}

function roundUpToHalfHour(date) {
    const value = new Date(date);
    value.setSeconds(0, 0);
    const minutes = value.getMinutes();
    if (minutes === 0 || minutes === 30) return value;
    value.setMinutes(minutes < 30 ? 30 : 60);
    return value;
}

function uniqueBy(items, getKey) {
    const seen = new Set();
    return items.filter((item) => {
        if (!item) return false;
        const key = getKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function upsertFirst(model, where, data) {
    const existing = await prisma[model].findFirst({where});

    if (existing) {
        return prisma[model].update({
            where: {id: existing.id},
            data,
        });
    }

    return prisma[model].create({data});
}

function buildDemoEntries(now) {
    const baseDay = startOfDay(now);
    const ongoingStart = addMinutes(now, -90);
    const ongoingEnd = addMinutes(now, 150);
    const todayAcceptedStart = roundUpToHalfHour(addMinutes(now, 30));
    const todayAcceptedEnd = addHours(todayAcceptedStart, 2);
    const todayWaitingStart = roundUpToHalfHour(addHours(now, 2));
    const todayWaitingEnd = addHours(todayWaitingStart, 1.5);

    const slot = (dayOffset, hour, durationHours, minute = 0) => {
        const start = setTime(addDays(baseDay, dayOffset), hour, minute);
        const end = addHours(start, durationHours);
        return {start, end};
    };

    const completed = (blueprint) => ({...blueprint, moderate: 'ENDED', returned: true});
    const rejected = (blueprint) => ({...blueprint, moderate: 'REJECTED', returned: false});
    const accepted = (blueprint) => ({...blueprint, moderate: 'ACCEPTED', returned: false});
    const waiting = (blueprint) => ({...blueprint, moderate: 'WAITING', returned: false});

    return [
        completed({userUsername: 'julien.moreau', resourceName: 'Lenovo ThinkPad T14 Gen 4 - PB-014', ...slot(-45, 9, 8), comment: 'Audit client sur le site de Lille.'}),
        completed({userUsername: 'camille.lefevre', resourceName: 'Salle Canut - 12 places', ...slot(-40, 14, 2), comment: 'Comité produit mensuel.'}),
        completed({userUsername: 'laura.nguyen', resourceName: 'Epson EB-L530U - PAR-VID-01', ...slot(-37, 10, 4), comment: 'Présentation commerciale régionale.'}),
        completed({userUsername: 'marc.lambert', resourceName: 'Renault Kangoo Van E-Tech - VS-201', ...slot(-34, 7, 10), comment: 'Tournée logistique inter-sites.'}),
        completed({userUsername: 'ines.garcia', resourceName: 'Studio Podcast A - LIL-AUDIO-01', ...slot(-31, 9, 3), comment: 'Enregistrement d\'une interview RH.'}),
        completed({userUsername: 'sarah.petit', resourceName: 'Canon EOS R6 - MEDIA-01', ...slot(-28, 13, 4), comment: 'Reportage photo au salon partenaires.'}),
        completed({userUsername: 'youssef.belkacem', resourceName: 'Pack Visioconférence Poly Studio - EVT-02', ...slot(-24, 8, 2), comment: 'Réunion hybride support clients.'}),
        completed({userUsername: 'antoine.dupont', resourceName: 'MacBook Pro 14 M3 - PB-021', ...slot(-21, 9, 8), comment: 'Mission d\'audit sécurité.'}),
        rejected({userUsername: 'lucie.roux', resourceName: 'Salle Loire - 8 places', ...slot(-18, 11, 2), comment: 'Salle déjà affectée à un comité direction.'}),
        completed({userUsername: 'julien.moreau', resourceName: 'BenQ LW650 - LIL-VID-02', ...slot(-16, 15, 3), comment: 'Atelier budget Q3.'}),
        completed({userUsername: 'camille.lefevre', resourceName: 'Peugeot 208 Affaires - VS-114', ...slot(-14, 8, 6), comment: 'Déplacement fournisseur.'}),
        completed({userUsername: 'laura.nguyen', resourceName: 'Studio Podcast B - NTS-AUDIO-02', ...slot(-12, 10, 2), comment: 'Voix off capsule produit.'}),
        completed({userUsername: 'marc.lambert', resourceName: 'Kit Micro HF Sennheiser - EVT-01', ...slot(-10, 18, 3), comment: 'Table ronde partenaires.'}),
        completed({userUsername: 'ines.garcia', resourceName: 'Dell Latitude 7440 - LY-104', ...slot(-8, 9, 8), comment: 'Prêt pour déplacement commercial.'}),
        completed({userUsername: 'sarah.petit', resourceName: 'Salle Garonne - 10 places', ...slot(-7, 9, 2), comment: 'Réunion hebdomadaire commerce.'}),
        completed({userUsername: 'youssef.belkacem', resourceName: 'Sony A7 IV - MEDIA-02', ...slot(-6, 14, 4), comment: 'Captation témoignage client.'}),
        completed({userUsername: 'antoine.dupont', resourceName: 'Valise lumière LED Nanlite - EVT-03', ...slot(-5, 8, 6), comment: 'Éclairage d\'un tournage interne.'}),
        rejected({userUsername: 'lucie.roux', resourceName: 'Salle Canut - 12 places', ...slot(-4, 16, 2), comment: 'Demande refusée faute de validation manager.'}),
        completed({userUsername: 'julien.moreau', resourceName: 'Epson EB-L530U - PAR-VID-01', ...slot(-3, 10, 2), comment: 'Point projet déploiement.'}),
        completed({userUsername: 'camille.lefevre', resourceName: 'HP EliteBook 840 G10 - NTS-008', ...slot(-2, 9, 8), comment: 'Prêt renfort équipe support.'}),
        {userUsername: 'marc.lambert', resourceName: 'Renault Kangoo Van E-Tech - VS-201', start: ongoingStart, end: ongoingEnd, moderate: 'USED', returned: false, comment: 'Déplacement pour intervention technique.'},
        accepted({userUsername: 'laura.nguyen', resourceName: 'Salle Loire - 8 places', start: todayAcceptedStart, end: todayAcceptedEnd, comment: 'Brief opérationnel.'}),
        waiting({userUsername: 'youssef.belkacem', resourceName: 'Studio Podcast A - LIL-AUDIO-01', start: todayWaitingStart, end: todayWaitingEnd, comment: 'Enregistrement teaser événement.'}),
        waiting({userUsername: 'sarah.petit', resourceName: 'Studio Podcast A - LIL-AUDIO-01', ...slot(1, 10, 2), comment: 'Capsule audio marque employeur.'}),
        accepted({userUsername: 'ines.garcia', resourceName: 'MacBook Pro 14 M3 - PB-021', ...slot(2, 9, 8), comment: 'Déplacement client à Nantes.'}),
        accepted({userUsername: 'youssef.belkacem', resourceName: 'Pack Visioconférence Poly Studio - EVT-02', ...slot(3, 13, 2), comment: 'Réunion CSM trimestrielle.'}),
        waiting({userUsername: 'camille.lefevre', resourceName: 'Salle Garonne - 10 places', ...slot(5, 14, 2), comment: 'Atelier roadmap produit.'}),
        accepted({userUsername: 'antoine.dupont', resourceName: 'Canon EOS R6 - MEDIA-01', ...slot(7, 9, 5), comment: 'Photo inauguration agence.'}),
        accepted({userUsername: 'lucie.roux', resourceName: 'Lenovo ThinkPad T14 Gen 4 - PB-014', ...slot(9, 8, 8), comment: 'Remplacement poste SAV.'}),
        accepted({userUsername: 'julien.moreau', resourceName: 'Peugeot 208 Affaires - VS-114', ...slot(12, 7, 10), comment: 'Visite partenaires Aquitaine.'}),
    ];
}

function buildDemoMaintenanceEvents(now) {
    const baseDay = startOfDay(now);
    const endedEvent = (dayOffset, hour, durationHours, minute = 0) => {
        const startDate = setTime(addDays(baseDay, dayOffset), hour, minute);
        return {startDate, endDate: addHours(startDate, durationHours)};
    };

    return [
        {
            resourceName: 'BenQ LW650 - LIL-VID-02',
            typeName: 'Réparation',
            reporterUsername: 'emma.rocher',
            title: 'Remplacement de la lampe optique',
            description: 'La luminosité a fortement chuté pendant les formations du lundi matin.',
            severity: 'medium',
            makesResourceUnavailable: true,
            conversationStatus: 'ARCHIVED',
            message: 'Le projecteur reste exploitable uniquement sur faible distance.',
            ...endedEvent(-26, 8, 4),
        },
        {
            resourceName: 'Salle Canut - 12 places',
            typeName: 'Contrôle',
            reporterUsername: 'emma.rocher',
            title: 'Recalibrage du système Teams Room',
            description: 'Le cadrage automatique n\'était plus fiable en configuration table ronde.',
            severity: 'low',
            makesResourceUnavailable: false,
            conversationStatus: 'ARCHIVED',
            message: 'Le prestataire a rechargé la configuration caméra.',
            ...endedEvent(-18, 10, 2),
        },
        {
            resourceName: 'Canon EOS R6 - MEDIA-01',
            typeName: 'Nettoyage',
            reporterUsername: 'claire.bernard',
            title: 'Nettoyage capteur et vérification optique',
            description: 'Présence de poussières visibles sur les prises de vue en lumière forte.',
            severity: 'low',
            makesResourceUnavailable: true,
            conversationStatus: 'RESOLVED',
            message: 'Le nettoyage complet a supprimé les artefacts sur fond clair.',
            ...endedEvent(-11, 9, 3),
        },
        {
            resourceName: 'Citroen Berlingo Atelier - VS-305',
            typeName: 'Casse',
            reporterUsername: 'mehdi.chevalier',
            title: 'Rétroviseur gauche endommagé',
            description: 'Le véhicule doit passer en carrosserie avant remise dans le parc.',
            severity: 'critical',
            makesResourceUnavailable: true,
            conversationStatus: 'ARCHIVED',
            message: 'Devis validé, immobilisation complète sur la journée suivante.',
            ...endedEvent(-4, 8, 30),
        },
        {
            resourceName: 'HP EliteBook 840 G10 - NTS-008',
            typeName: 'Réparation',
            reporterUsername: 'claire.bernard',
            title: 'Clavier remplacé suite à touches défectueuses',
            description: 'Les touches Entrée et espace répondaient de manière intermittente.',
            severity: 'medium',
            makesResourceUnavailable: true,
            conversationStatus: 'RESOLVED',
            message: 'Le poste est à nouveau exploitable après échange du clavier.',
            ...endedEvent(-1, 9, 5),
        },
        {
            resourceName: 'Studio Podcast B - NTS-AUDIO-02',
            typeName: 'Maintenance',
            reporterUsername: 'mehdi.chevalier',
            title: 'Souffle sur la carte son principale',
            description: 'Un souffle constant est présent sur le canal gauche pendant les enregistrements.',
            severity: 'critical',
            makesResourceUnavailable: true,
            conversationStatus: 'OPEN',
            message: 'Les tests croisés avec un autre micro confirment un problème côté interface audio.',
            startDate: setTime(addDays(baseDay, -1), 8, 30),
            endDate: null,
        },
        {
            resourceName: 'Epson EB-L530U - PAR-VID-01',
            typeName: 'Contrôle',
            reporterUsername: 'emma.rocher',
            title: 'Instabilité HDMI sur l\'entrée principale',
            description: 'Le signal coupe aléatoirement avec le boîtier de présentation de la salle conseil.',
            severity: 'medium',
            makesResourceUnavailable: false,
            conversationStatus: 'OPEN',
            message: 'Les équipes support ont reproduit la coupure sur deux câbles différents.',
            startDate: setTime(baseDay, 7, 15),
            endDate: null,
        },
        {
            resourceName: 'Salle Loire - 8 places',
            typeName: 'Maintenance',
            reporterUsername: 'emma.rocher',
            title: 'Mise à jour du système Teams Room',
            description: 'Intervention planifiée avec le prestataire visio pour mise à niveau logicielle.',
            severity: 'low',
            makesResourceUnavailable: false,
            conversationStatus: 'OPEN',
            message: 'Fenêtre planifiée avant l\'arrivée des équipes commerciales.',
            startDate: setTime(addDays(baseDay, 2), 9, 0),
            endDate: null,
        },
        {
            resourceName: 'Peugeot 208 Affaires - VS-114',
            typeName: 'Réparation',
            reporterUsername: 'mehdi.chevalier',
            title: 'Révision intermédiaire 60 000 km',
            description: 'Passage atelier pour entretien planifié et contrôle pneumatique.',
            severity: 'medium',
            makesResourceUnavailable: false,
            conversationStatus: 'OPEN',
            message: 'Immobilisation probable sur une demi-journée selon le garage.',
            startDate: setTime(addDays(baseDay, 6), 8, 30),
            endDate: null,
        },
    ];
}

function assertProductionAdminSeed(seed = adminSeed) {
    const missing = ['email', 'username', 'password'].filter((key) => !seed[key]);

    if (missing.length > 0) {
        throw new Error(`Production seed requires admin ${missing.join(', ')}`);
    }

    if (seed.password.length < 12) {
        throw new Error('Production seed requires SEED_ADMIN_PASSWORD with at least 12 characters');
    }
}

export async function seedAdminUser(seed = adminSeed, options = {}) {
    if (isProduction) {
        assertProductionAdminSeed(seed);
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                {email: seed.email},
                {username: seed.username},
            ],
        },
    });

    if (existingUser) {
        const updateData = {
            name: seed.name,
            surname: seed.surname,
            username: seed.username,
            email: seed.email,
            role: 'SUPERADMIN',
            external: false,
        };

        if (options.forcePassword) {
            updateData.password = await bcrypt.hash(seed.password, 10);
        }

        await prisma.user.update({
            where: {id: existingUser.id},
            data: updateData,
        });
        console.log('Admin user already exists, updated profile and role');
        return existingUser.id;
    }

    const password = await bcrypt.hash(seed.password, 10);

    const user = await prisma.user.create({
        data: {
            name: seed.name,
            email: seed.email,
            surname: seed.surname,
            username: seed.username,
            password,
            role: 'SUPERADMIN',
            external: false,
        },
    });
    console.log('Admin user created successfully');
    return user.id;
}

export async function seedBaseConfiguration() {
    for (const pickable of pickables) {
        await prisma.pickable.upsert({
            where: {name: pickable.name},
            update: pickable,
            create: pickable,
        });
    }
    console.log('Pickables upserted (créés ou mis à jour)');

    for (const type of defaultEventTypes) {
        await prisma.resourceEventType.upsert({
            where: {name: type.name},
            update: type,
            create: type,
        });
    }
    console.log('Resource event types upserted');

    await upsertFirst('timeScheduleOptions', {}, defaultTimeOptions);
    console.log('Time schedule options upserted');

    await upsertFirst('appSettings', {}, {});
    console.log('App settings upserted');
}

async function cleanupDemoData() {
    const demoDomainNames = demoDomains.map((item) => item.name);
    const demoCategoryNames = demoCategories.map((item) => item.name);
    const demoResourceNames = demoResources.map((item) => item.name);

    const demoUsersInDb = await prisma.user.findMany({
        where: {email: {endsWith: '@spotly.test'}},
        select: {id: true},
    });
    const demoUserIds = demoUsersInDb.map((user) => user.id);

    const demoDomainsInDb = await prisma.domain.findMany({
        where: {
            OR: [
                {name: {in: demoDomainNames}},
                {name: {startsWith: 'Site Test '}},
            ],
        },
        select: {id: true},
    });
    const demoDomainIds = demoDomainsInDb.map((domain) => domain.id);

    const demoCategoriesInDb = await prisma.category.findMany({
        where: {
            OR: [
                {name: {in: demoCategoryNames}},
                {name: {startsWith: 'Catégorie Test '}},
            ],
        },
        select: {id: true},
    });
    const demoCategoryIds = demoCategoriesInDb.map((category) => category.id);

    const resourceOr = [
        {name: {in: demoResourceNames}},
        {description: {startsWith: 'Ressource de démonstration'}},
    ];
    if (demoDomainIds.length) resourceOr.push({domainId: {in: demoDomainIds}});
    if (demoCategoryIds.length) resourceOr.push({categoryId: {in: demoCategoryIds}});

    const demoResourcesInDb = await prisma.resource.findMany({
        where: {OR: resourceOr},
        select: {id: true},
    });
    const demoResourceIds = demoResourcesInDb.map((resource) => resource.id);

    const entryOr = [];
    if (demoUserIds.length) entryOr.push({userId: {in: demoUserIds}});
    if (demoResourceIds.length) entryOr.push({resourceId: {in: demoResourceIds}});

    const demoEntriesInDb = entryOr.length
        ? await prisma.entry.findMany({where: {OR: entryOr}, select: {id: true}})
        : [];
    const demoEntryIds = demoEntriesInDb.map((entry) => entry.id);

    const demoEventsInDb = demoResourceIds.length
        ? await prisma.resourceEvent.findMany({where: {resourceId: {in: demoResourceIds}}, select: {id: true}})
        : [];
    const demoEventIds = demoEventsInDb.map((event) => event.id);

    if (demoEntryIds.length) {
        await prisma.conversation.deleteMany({
            where: {contextType: 'ENTRY', contextId: {in: demoEntryIds}},
        });
    }

    if (demoEventIds.length) {
        await prisma.conversation.deleteMany({
            where: {contextType: 'RESOURCE_EVENT', contextId: {in: demoEventIds}},
        });
        await prisma.resourceEvent.deleteMany({where: {id: {in: demoEventIds}}});
    }

    if (demoEntryIds.length) {
        await prisma.entry.deleteMany({where: {id: {in: demoEntryIds}}});
    }

    if (demoResourceIds.length) {
        await prisma.resource.deleteMany({where: {id: {in: demoResourceIds}}});
    }

    if (demoCategoryIds.length) {
        await prisma.category.deleteMany({where: {id: {in: demoCategoryIds}}});
    }

    if (demoDomainIds.length) {
        await prisma.domain.deleteMany({where: {id: {in: demoDomainIds}}});
    }

    if (demoUserIds.length) {
        await prisma.user.deleteMany({where: {id: {in: demoUserIds}}});
    }

    await prisma.authorizedLocation.deleteMany({
        where: {ip: {in: [...legacyLocationIps, ...demoLocations.map((location) => location.ip)]}},
    });

    console.log('Anciennes données de démonstration supprimées');
}

export async function seedDemoData() {
    await cleanupDemoData();

    const demoPassword = await bcrypt.hash('password', 10);

    for (const user of demoUsers) {
        await prisma.user.upsert({
            where: {username: user.username},
            update: {
                ...user,
                external: false,
            },
            create: {
                ...user,
                password: demoPassword,
                external: false,
            },
        });
    }
    console.log('Données de démo : utilisateurs créés ou mis à jour');

    for (const location of demoLocations) {
        await prisma.authorizedLocation.upsert({
            where: {ip: location.ip},
            update: location,
            create: location,
        });
    }
    console.log('Données de démo : localisations autorisées créées ou mises à jour');

    const users = await prisma.user.findMany({
        where: {username: {in: demoUsers.map((user) => user.username)}},
        select: {id: true, username: true},
    });
    const usersByUsername = new Map(users.map((user) => [user.username, user]));

    const pickableNames = uniqueBy([
        ...demoDomains.map((item) => item.pickableName),
        ...demoCategories.map((item) => item.pickableName),
        ...demoResources.map((item) => item.pickableName).filter(Boolean),
    ], (name) => name);
    const pickableMap = new Map((await prisma.pickable.findMany({where: {name: {in: pickableNames}}})).map((item) => [item.name, item]));

    for (const domain of demoDomains) {
        await upsertFirst('domain', {name: domain.name}, {
            name: domain.name,
            pickableId: pickableMap.get(domain.pickableName)?.id,
            ownerId: usersByUsername.get(domain.ownerUsername)?.id || null,
        });
    }
    console.log('Données de démo : sites créés ou mis à jour');

    for (const category of demoCategories) {
        await upsertFirst('category', {name: category.name}, {
            name: category.name,
            description: category.description,
            iconKey: category.iconKey,
            pickableId: pickableMap.get(category.pickableName)?.id || null,
            ownerId: usersByUsername.get(category.ownerUsername)?.id || null,
        });
    }
    console.log('Données de démo : catégories créées ou mises à jour');

    const domains = await prisma.domain.findMany({where: {name: {in: demoDomains.map((item) => item.name)}}, select: {id: true, name: true}});
    const categories = await prisma.category.findMany({where: {name: {in: demoCategories.map((item) => item.name)}}, select: {id: true, name: true}});
    const domainByName = new Map(domains.map((item) => [item.name, item]));
    const categoryByName = new Map(categories.map((item) => [item.name, item]));

    for (const resource of demoResources) {
        await upsertFirst('resource', {name: resource.name}, {
            name: resource.name,
            description: resource.description,
            moderate: resource.moderate,
            domainId: domainByName.get(resource.domainName)?.id,
            categoryId: categoryByName.get(resource.categoryName)?.id,
            pickableId: resource.pickableName ? (pickableMap.get(resource.pickableName)?.id || null) : null,
            ownerId: resource.ownerUsername ? (usersByUsername.get(resource.ownerUsername)?.id || null) : null,
            status: 'AVAILABLE',
        });
    }
    console.log('Données de démo : ressources créées ou mises à jour');

    const resources = await prisma.resource.findMany({
        where: {name: {in: demoResources.map((item) => item.name)}},
        include: {
            domains: {include: {owner: true}},
            category: {include: {owner: true}},
            owner: true,
        },
    });
    const resourcesByName = new Map(resources.map((resource) => [resource.name, resource]));

    for (const entry of buildDemoEntries(new Date())) {
        await prisma.entry.create({
            data: {
                userId: usersByUsername.get(entry.userUsername)?.id,
                resourceId: resourcesByName.get(entry.resourceName)?.id,
                startDate: entry.start,
                endDate: entry.end,
                moderate: entry.moderate,
                returned: entry.returned,
                comment: entry.comment,
            },
        });
    }
    console.log('Données de démo : réservations réalistes créées');

    const eventTypes = await prisma.resourceEventType.findMany({where: {name: {in: defaultEventTypes.map((item) => item.name)}}});
    const eventTypeByName = new Map(eventTypes.map((item) => [item.name, item]));
    const createdEvents = [];

    for (const event of buildDemoMaintenanceEvents(new Date())) {
        const createdEvent = await prisma.resourceEvent.create({
            data: {
                resourceId: resourcesByName.get(event.resourceName)?.id,
                typeId: eventTypeByName.get(event.typeName)?.id,
                reportedById: usersByUsername.get(event.reporterUsername)?.id || null,
                title: event.title,
                description: event.description,
                severity: event.severity,
                problemDate: event.startDate,
                startDate: event.startDate,
                endDate: event.endDate,
                makesResourceUnavailable: event.makesResourceUnavailable,
            },
        });

        createdEvents.push({
            ...createdEvent,
            conversationStatus: event.conversationStatus,
            message: event.message,
            reporterUsername: event.reporterUsername,
            resource: resourcesByName.get(event.resourceName),
        });
    }
    console.log('Données de démo : événements de maintenance créés');

    for (const event of createdEvents) {
        const reporterId = usersByUsername.get(event.reporterUsername)?.id || null;
        const ownerId = event.resource?.ownerId || event.resource?.category?.ownerId || event.resource?.domains?.ownerId || null;
        const participants = uniqueBy([
            reporterId ? {userId: reporterId, role: 'REPORTER'} : null,
            ownerId ? {userId: ownerId, role: 'OWNER'} : null,
        ], (participant) => participant.userId);

        await prisma.conversation.create({
            data: {
                contextType: 'RESOURCE_EVENT',
                contextId: event.id,
                status: event.conversationStatus,
                title: event.title,
                participants: {
                    create: participants,
                },
                messages: {
                    create: [
                        {
                            userId: reporterId || ownerId,
                            system: true,
                            content: `Événement créé : ${event.title}`,
                        },
                        event.message ? {
                            userId: reporterId || ownerId,
                            system: false,
                            content: event.message,
                        } : null,
                    ].filter(Boolean),
                },
            },
        });
    }
    console.log('Données de démo : discussions de maintenance créées');

    const now = new Date();
    const unavailableResourceIds = createdEvents
        .filter((event) => event.makesResourceUnavailable && (!event.endDate || new Date(event.endDate) > now))
        .map((event) => event.resourceId);

    if (unavailableResourceIds.length) {
        await prisma.resource.updateMany({
            where: {id: {in: unavailableResourceIds}},
            data: {status: 'UNAVAILABLE'},
        });
    }

    const favoriteDefinitions = [
        {username: 'julien.moreau', type: 'SITE', domainName: 'Paris Bastille'},
        {username: 'camille.lefevre', type: 'RESOURCE', resourceName: 'Salle Canut - 12 places'},
        {username: 'ines.garcia', type: 'RESOURCE', resourceName: 'MacBook Pro 14 M3 - PB-021'},
        {username: 'laura.nguyen', type: 'SITE', domainName: 'Nantes Centre'},
    ];

    for (const favorite of favoriteDefinitions) {
        const userId = usersByUsername.get(favorite.username)?.id;
        const domainId = favorite.domainName ? domainByName.get(favorite.domainName)?.id : null;
        const resourceId = favorite.resourceName ? resourcesByName.get(favorite.resourceName)?.id : null;

        if (!userId) continue;

        if (favorite.type === 'SITE' && domainId) {
            await prisma.favorite.upsert({
                where: {userId_type_domainId: {userId, type: 'SITE', domainId}},
                update: {},
                create: {userId, type: 'SITE', domainId},
            });
        }

        if (favorite.type === 'RESOURCE' && resourceId) {
            await prisma.favorite.upsert({
                where: {userId_type_resourceId: {userId, type: 'RESOURCE', resourceId}},
                update: {},
                create: {userId, type: 'RESOURCE', resourceId},
            });
        }
    }
    console.log('Données de démo : favoris créés');
}

export async function seedSpotly(options = {}) {
    const seed = options.adminSeed || adminSeed;
    const includeDemo = options.withTestData ?? withTestData;

    if (isProduction && !hasProductionConfirmation && !options.confirmProduction) {
        throw new Error('Production seed requires --confirm-production');
    }

    const adminUserId = await seedAdminUser(seed, {forcePassword: options.forceAdminPassword});
    await seedBaseConfiguration();

    if (includeDemo) {
        await seedDemoData();
    }

    return {adminUserId};
}

async function main() {
    await seedSpotly();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .catch((error) => {
            console.error(error);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
