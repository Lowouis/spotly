'use client';
import { useState } from 'react';
import {AdjustmentsHorizontalIcon, Cog6ToothIcon} from "@heroicons/react/24/solid";
import {Button} from "@nextui-org/button";
import {Link} from "@nextui-org/react";
import Site from "@/app/components/admin/site";

export default function Sidebar() {
    const items=  [
        {
            "title": "Administration",
            "items": [
                {
                    "title": "Tableau de bord",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin"
                },
            ]
        },
        {
            "title": "Gestion des données",
            "items": [
                {
                    "title": "Site",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/site"
                },
                {
                    "title": "Catégorie",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/category"
                },
                {
                    "title": "Ressources",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/resource"
                }
            ]
        },
        {
            "title": "Gestion des utilisateurs",
            "items": [
                {
                    "title": "Utilisateurs",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/users"
                },
                {
                    "title": "Réservations",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/reservations"
                }
            ]
        },
        {
            "title": "Configuration mail",
            "items": [
                {
                    "title": "SMTP",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/smtp"
                },
                {
                    "title": "Mails",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/mails"
                }
            ]
        },
        {
            "title": "Configuration LDAP",
            "items": [
                {
                    "title": "LDAP",
                    "icon": "AdjustmentsHorizontalIcon",
                    "href": "/admin/ldap"
                }
            ]
        }
    ];



    return (
        <div className="flex justify-start flex-col h-full">
            <div className="w-64 h-screen shadow-md p-4">
                {items.map((item, index) => (
                    <div key={index} className="text-neutral-600">
                        <h2 className="text-lg font-semibold mb-2 text-neutral-900">{item.title}</h2>
                        {item.items.map((subItem, subIndex) => (
                            <Button size="lg" startContent={<Cog6ToothIcon width={24}  height={24} />} key={subIndex} variant="light" style={{justifyContent: "flex-start"}} fullWidth={true} >
                                {subItem.title}
                            </Button>
                        ))}
                    </div>
                ))}
            </div>
        </div>

    );
}
