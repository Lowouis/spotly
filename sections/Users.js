'use client';


import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/context/RefreshContext";


const Users = ({})=>{
    const { isRefreshing } = useRefreshContext();

    const { data: items, refetch ,isLoading, isError, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled : !isRefreshing
    });

    const UsersFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom', placeholder: 'ex : Lucas, Pauline' },
        { required: true, name: 'surname', type: 'text', label: 'Prénom', placeholder: 'ex : Dupont, Martin' },
        { required: true, name: 'username', type: 'text', label: 'Utilisateur', placeholder: 'ex : lucas.dupont, ldupont' },
        {
            required: true,
            name: 'password',
            type: 'text',
            label: 'Mot de passe',
            placeholder: 'Mot de passe',
            dependsOn: 'external',
            hidden: true
        },
        { required: true, name: 'email', type: 'text', label: 'Mail', placeholder: "ldupont@outlook.com"},
        { required: true, name: 'role', type: 'object', label: 'Rôle', options : "roles", placeholder: "Choisir un rôle"},
    ];

    const columnsGreatNames = [
        "Nom",
        "Prénom",
        "Utilisateur",
        "Mail",
        "Externe",
        "Rôle",
    ]

    const searchConfig = [
        {tag: "nom", attr: "name"},
        {tag: "prenom", attr: "surname"},
        {tag: "mail", attr: "email"}
    ];

    const filters = [
        {
            placeholder: "Filtrer par rôle",
            filterBy: "role"
        }
    ]


    return (
        <div className="flex flex-col gap-3 w-full">
            <ItemsOnTable
                isLoading={isLoading}
                items={items}
                name={"Utilisateurs"}
                model="users"
                formFields={UsersFields}
                actions={['edit', 'delete']}
                columnsGreatNames={columnsGreatNames}
                filter={['updatedAt', 'id', 'password', 'createdAt', 'image', 'emailVerified']}
                searchBy={searchConfig}
                filters={filters}
            />
        </div>
    );
}



export default Users;