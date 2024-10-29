'use client';
import React, {useEffect, useState} from "react";
import ItemsOnTable from "@/app/components/admin/communs/ItemsOnTable";


export default function Site() {

    const [items, setItems] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:3000/api/domains`)
            .then(response => response.text())
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    setItems(data);
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                    console.error('Response text:', text);
                }
            })
            .catch(error => {
                    console.error('Fetch error:', error);
                }
            );
    }, [setItems]);


    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <ItemsOnTable items={items} name={"Sites"} />
        </div>
    );
}
