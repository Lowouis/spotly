'use client';

import { Spacer} from "@nextui-org/react";
import {Input} from "@nextui-org/input";
import {Button} from "@nextui-org/button";
import React, {useState} from "react";

const LDAP = ({})=>{

    const [formData, setFormData] = useState({
        serverUrl:      process.env.LDAP_DOMAIN ?? "",
        bindDn:         process.env.LDAP_BASEDN ?? "",
        adminCn:        process.env.LDAP_ADMIN_DN ?? "",
        adminPassword:  process.env.LDAP_ADMIN_PASSWORD ?? "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form data submitted:", formData);
        // Ici, ajoutez une requête API pour sauvegarder la configuration
    };

    return (
        <div className="flex flex-col gap-3 w-full mx-2">
            <h1 className="text-2xl p-2 my-3 font-bold w-1/2">Configuration LDAP</h1>
            <Spacer y={1}/>
            <form onSubmit={handleSubmit}>
                <div className="p-3">
                    <Input
                        clearable
                        bordered
                        fullWidth
                        name="serverUrl"
                        label="LDAP Server URL"
                        placeholder="ldap://example.com"
                        value={formData.serverUrl}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1}/>
                    <Input
                        clearable
                        fullWidth
                        variant="faded"
                        name="bindDn"
                        labelPlacement="outside-left"
                        label="Bind DN"
                        placeholder="cn=admin,dc=example,dc=com"
                        value={formData.bindDn}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1}/>
                    <Input
                        bordered
                        fullWidth
                        name="bindPassword"
                        label="Bind Password"
                        placeholder="Enter your password"
                        value={formData.adminCn}
                        onChange={handleInputChange}
                    />
                    <Spacer y={1}/>
                    <Input
                        clearable
                        bordered
                        fullWidth
                        name="searchBase"
                        label="Search Base"
                        placeholder="dc=example,dc=com"
                        value={formData.adminPassword}
                        onChange={handleInputChange}
                    />

                    <Spacer y={2}/>
                    <Button type="submit" fullWidth color="primary">
                        Save Configuration
                    </Button>
                </div>
            </form>
        </div>

    );

}


export default LDAP;


