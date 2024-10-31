'use client';

import { EnvelopeIcon, Squares2X2Icon, TableCellsIcon, UserCircleIcon, ServerIcon} from "@heroicons/react/24/solid";
import {Accordion, AccordionItem} from "@nextui-org/react";


export default function Sidebar() {
    const sideItems=  [
        {
            "title": "Administration",
            "icon": "Squares2X2Icon",

            "items": [
                {
                    "title": "Tableau de bord",
                    "href": "/admin"
                },
            ]
        },
        {
            "title": "Données",
            "icon": "TableCells",

            "items": [
                {
                    "title": "Sites",
                    "href": "/admin/site"
                },
                {
                    "title": "Catégories",
                    "href": "/admin/category"
                },
                {
                    "title": "Ressources",
                    "href": "/admin/resource"
                }
            ]
        },
        {
            "title": "Utilisateurs",
            "icon": "UserCircleIcon",

            "items": [
                {
                    "title": "Utilisateurs",
                    "href": "/admin/users"
                },
                {
                    "title": "Réservations",
                    "href": "/admin/reservations"
                }
            ]
        },
        {
            "title": "Mail",
            "icon": "EnvelopeIcon",
            "items": [
                {
                    "title": "SMTP",
                    "href": "/admin/smtp"
                },
                {
                    "title": "Templates",
                    "href": "/admin/mails"
                }
            ]
        },
        {
            "title": "LDAP",
            "icon": "ServerIcon",
            "items": [
                {
                    "title": "Configuration",
                    "href": "/admin/ldap"
                }
            ]
        }
    ];

    const IconMapping = {
        Squares2X2Icon: Squares2X2Icon,
        TableCells : TableCellsIcon,
        UserCircleIcon: UserCircleIcon,
        EnvelopeIcon: EnvelopeIcon,
        ServerIcon: ServerIcon


    };

    return (
        <div className="flex justify-start flex-col h-full border-r-1 border-neutral-400">
            <div>
                <div className="flex justify-center items-center h-16 text-neutral-700">
                    <span className="text-2xl font-bold">Admin</span>
                </div>
            </div>
            <div className="w-64 h-screen p-4">

                    {(sideItems || []).map((item, index) => {
                        const IconComponent = IconMapping[item.icon] || Squares2X2Icon;
                        return (
                            <div key={`admin-accordion-${index}`} className="flex flex-col mb-3">
                                <Accordion selectionMode="multiple" variant="light"  defaultExpandedKeys={["admin-accordion-item-0"]} >
                                    <AccordionItem key={`admin-accordion-item-${index}`} aria-label={item.title}
                                                   title={item.title} startContent={<IconComponent className="h-6 w-6 mr-2"/>}>
                                        <div className="flex flex-col space-y-3 py-2 px-1 ml-9">
                                            {(item.items).map((subItem, subIndex) =>(
                                                        <div key={`admin-link-${subIndex}`}
                                                             className="flex flex-row justify-start items-center w-full ml-2 cursor-pointer hover:text-neutral-400 transition">
                                                            <span>{subItem.title}</span>

                                                        </div>
                                            ))}
                                        </div>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        )
                    })}
                        </div>
                        </div>

                        );
}
