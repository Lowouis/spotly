'use client';

import {Alert, Spacer} from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import React, { useState, useEffect } from "react";
import {ArrowPathIcon, EyeIcon, EyeSlashIcon} from "@heroicons/react/24/outline";

const LDAP = ({}) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const toggleVisibility = () => setIsVisible(!isVisible);
    const [formData, setFormData] = useState({
        serverUrl: "",
        bindDn: "",
        adminCn: "",
        adminPassword: "",
    });

    console.log(formData)
    console.log(process.env.NEXT_PUBLIC_LDAP_DOMAIN)
    useEffect(() => {
        setFormData({
            serverUrl: process.env.NEXT_PUBLIC_LDAP_DOMAIN ?? "",
            bindDn: process.env.NEXT_PUBLIC_LDAP_BASEDN ?? "",
            adminCn: process.env.NEXT_PUBLIC_LDAP_ADMIN_DN ?? "",
            adminPassword: process.env.NEXT_PUBLIC_LDAP_ADMIN_PASSWORD ?? "",
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form data submitted:", formData);
        try {
            const response = await fetch('/api/save-ldap-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            console.log('Configuration saved:', result);
        } catch (error) {
            console.error('Error saving configuration:', error);
        }
    };

    return (
        <div className="flex justify-center items-center flex-col w-full mx-2">
            <Spacer y={1} />
            <form onSubmit={handleSubmit} className="w-2/3 mx-auto">
                <div className="p-3 w-full mx-auto space-y-4 ">
                    <Alert
                        variant="flat"
                        color="warning"
                        title="Configuration LDAP"
                        description="Veuillez saisir les informations de connexion à votre serveur LDAP"


                    />
                    <Input
                        clearable
                        bordered
                        fullWidth
                        name="serverUrl"
                        label="URL du serveur LDAP"
                        placeholder="ldap://example.com"
                        value={formData.serverUrl}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1} />
                    <Input
                        clearable
                        fullWidth
                        bordered
                        name="bindDn"
                        label="Bind Distinguished Name"
                        placeholder="cn=admin,dc=example,dc=com"
                        value={formData.bindDn}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1} />
                    <Input
                        bordered
                        fullWidth
                        name="adminCn"
                        label="Nom Commun de l'adminstrateur LDAP"
                        placeholder="CN de l'adminstrateur LDAP"
                        value={formData.adminCn}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1} />
                    <Input
                        clearable
                        bordered
                        fullWidth
                        name="adminPassword"
                        label="Mot de passe adminstrateur LDAP"
                        type={isVisible ? "text" : "password"}
                        placeholder="Mot de passe adminstrateur LDAP"
                        value={formData.adminPassword}
                        onChange={handleInputChange}
                        endContent={
                            <Button
                                aria-label="toggle password visibility"
                                className="focus:outline-none h-full"
                                type="button"
                                isIconOnly
                                onPress={toggleVisibility}
                            >
                                {isVisible ? (
                                    <EyeSlashIcon color="black" width={18} className="pointer-events-none" />
                                ) : (
                                    <EyeIcon color="black" width={18} className="pointer-events-none" />
                                )}
                            </Button>
                        }
                    />
                    <Spacer y={2} />
                    <div className="flex justify-center flex-row items-center w-full">
                        <Button type="submit" variant="solid" fullWidth color="success" isIconOnly >
                            <ArrowPathIcon width={24} className="rounded-full"/>
                        </Button>
                    </div>

                </div>
            </form>
            <Spacer y={2} />
            <div className="w-2/3">
                <Alert
                variant="flat"
                color="warning"
                title="Gestion des rôles"
                description="Veuillez saisir les informations de connexion à votre serveur LDAP"
                />
                <div>
                    add user role on cn later here
                </div>
            </div>

        </div>
    );
};

export default LDAP;