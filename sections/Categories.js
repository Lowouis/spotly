'use client';


import ItemsOnTable from "@/components/listing/ItemsOnTable";
import {useQuery} from "@tanstack/react-query";
import {useRefreshContext} from "@/context/RefreshContext";

const Categories = ({})=>{

    const { isRefreshing } = useRefreshContext();

    const { data: items, isLoading, isError, error, refetch } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/categories`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
        enabled : !isRefreshing
    });

    const CategoryFields = [
        { required: true, name: 'name', type: 'text', label: 'Nom', placeholder : "ex : vidéo-projecteur, ordinateur" },
        { required: false, name: 'description', type: 'text', label: 'Description', placeholder : "ex : ordinateur 4gb ram & 500gb" },
        {
            required: false,
            name: 'pickable',
            type: 'object',
            label: 'Niveau de protection',
            options: "pickables",
            placeholder: "Aucun"
        },
        {
            required: false,
            name: 'owner',
            type: 'object',
            label: 'Propriétaire',
            options: "ownerables",
            placeholder: "Aucun"
        },
    ];
    const columnsGreatNames = [
        "Nom",
        "Description",
        "Propriétaire",
        "Niveau de protection",
    ]

    const searchParams = [
        {tag: "nom", attr: "name"},
        {tag: "description", attr: "description"},
        {tag: "propriétaire", attr: "owner.username"},
    ]

    const filters = [
        {
            placeholder: "Filter par protection",
            filterBy: "pickable.distinguishedName"
        }
    ]

    return (
        <div className="flex flex-col gap-3 w-full">
            <ItemsOnTable
                model="categories"
                formFields={CategoryFields}
                isLoading={isLoading}
                items={items}
                name={"Catégories"}
                columnsGreatNames={columnsGreatNames}
                actions={['edit', 'delete']}
                filter={['updatedAt', 'id', 'ownerId', 'createdAt', 'pickableId']}
                filters={filters}
                searchBy={searchParams}
            />
        </div>
    );
}



export default Categories;