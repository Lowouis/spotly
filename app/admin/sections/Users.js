'use client';


import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";

const Users = ({})=>{

    const { data: items, isLoading, isError, error } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/users`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    const UsersFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom' },
        { required: true, name: 'surname', type: 'text', label: 'Prénom' },
        { required: true, name: 'username', type: 'text', label: 'Utilisateur'},
        { required: true, name: 'password', type: 'text', label: 'Mot de passe'},
        { required: true, name: 'email', type: 'text', label: 'Mail'},
        { required: true, name: 'role', type: 'object', label: 'Rôle', options : [
                {name : "Administrateur", id : "SUPERADMIN"},
                {name : "Modérateur", id : "ADMIN"},
                {name : "Utilisateur", id : "USER"},
            ]
        },

    ];

    const columnsGreatNames = [
        "Nom",
        "Prénom",
        "Utilisateur",
        "Mail",
        "Externe",
        "Rôle",
    ]


    if (isError) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable
                isLoading={isLoading}
                items={items}
                name={"Utilisateurs"}
                model="users"
                formFields={UsersFields}
                actions={['edit', 'delete']}
                columnsGreatNames={columnsGreatNames}
                filter={['updatedAt', 'id', 'password', 'createdAt', 'image', 'emailVerified']}
            />
        </div>
    );
}



export default Users;