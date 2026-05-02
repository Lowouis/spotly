'use client';

import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/features/shared/context/RefreshContext";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {Badge} from "@/components/ui/badge";

const protectionHierarchy = [
    {
        key: 'FLUENT',
        label: 'Fluent',
        level: '1',
        summary: 'Réservation et restitution fluides, sans action de contrôle côté utilisateur.',
    },
    {
        key: 'HIGH_TRUST',
        label: 'Clic retour',
        level: '2',
        summary: 'La récupération reste libre, mais la restitution doit être confirmée par un clic.',
    },
    {
        key: 'LOW_TRUST',
        label: 'Clic',
        level: '3',
        summary: 'L’utilisateur confirme la récupération et la restitution par un clic.',
    },
    {
        key: 'DIGIT',
        label: 'Code',
        level: '4',
        summary: 'La récupération et la restitution nécessitent un code à 6 chiffres.',
    },
    {
        key: 'LOW_AUTH',
        label: 'Code authentifié optionnel',
        level: '5',
        summary: 'Contrôle par code, avec une authentification non bloquante selon le contexte.',
    },
    {
        key: 'HIGH_AUTH',
        label: 'Code + localisation',
        level: '6',
        summary: 'Contrôle le plus strict : code à 6 chiffres et localisation/appareil autorisé.',
    },
];

const ProtectionHierarchyHelp = ({items = []}) => {
    const protectionByKey = new Map(items.map((item) => [item.name, item]));

    return (
        <Accordion className="mt-1 w-full">
            <AccordionItem className="w-full overflow-hidden bg-card text-card-foreground shadow-sm">
                <AccordionTrigger className="px-5 py-4">
                    <span className="flex flex-col gap-1 text-left">
                        <span>Comprendre la hiérarchie des protections</span>
                        <span className="text-xs font-normal text-muted-foreground">De Fluent à Code + localisation, chaque niveau ajoute un contrôle utilisateur.</span>
                    </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 px-5 py-4">
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {protectionHierarchy.map((protection) => {
                            const item = protectionByKey.get(protection.key);
                            return (
                                <div key={protection.key} className="rounded-xl border border-border bg-background p-4 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-foreground">{item?.distinguishedName || protection.label}</div>
                                            <code className="text-xs text-muted-foreground">{protection.key}</code>
                                        </div>
                                        <Badge variant="neutral">Niveau {protection.level}</Badge>
                                    </div>
                                    <p className="text-sm leading-6 text-muted-foreground">{item?.description || protection.summary}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                        La protection effective d’une ressource suit l’ordre : ressource, puis catégorie, puis site. Le niveau défini le plus proche de la ressource est prioritaire.
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

const ProtectionLevels = () => {
    const {isRefreshing} = useRefreshContext();

    const {data: items, isLoading} = useQuery({
        queryKey: ['pickables'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/pickables`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled: !isRefreshing,
    });

    const fields = [
        {required: true, name: 'name', type: 'text', label: 'Clé technique', placeholder: 'ex : LOW_TRUST'},
        {required: true, name: 'distinguishedName', type: 'text', label: 'Nom affiché', placeholder: 'ex : Par clic'},
        {required: true, name: 'description', type: 'text', label: 'Description', placeholder: 'Description courte du niveau'},
        {required: true, name: 'cgu', type: 'text', label: 'Conditions / règles', placeholder: 'Règles détaillées affichées aux utilisateurs'},
    ];

    const columnsGreatNames = [
        'Clé technique',
        'Nom affiché',
        'Description',
        'Conditions / règles',
    ];

    const searchParams = [
        {tag: 'clé', attr: 'name'},
        {tag: 'nom', attr: 'distinguishedName'},
        {tag: 'description', attr: 'description'},
    ];

    return (
        <div className="flex w-full flex-col gap-3">
            <ItemsOnTable
                model="pickables"
                formFields={fields}
                isLoading={isLoading}
                items={items}
                name="Niveaux de protection"
                columnsGreatNames={columnsGreatNames}
                actions={['edit']}
                create_hidden
                selectionMode={false}
                filter={['id', 'createdAt', 'updatedAt']}
                searchBy={searchParams}
                refreshPlacement="search"
            />
            <ProtectionHierarchyHelp items={items || []}/>
        </div>
    );
};

export default ProtectionLevels;
