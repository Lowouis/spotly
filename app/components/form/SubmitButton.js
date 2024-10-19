import React from 'react';
import {Button} from "@nextui-org/button";

const SubmitButton = ({ label }) => {
    return (
        <Button
            color={"primary"}
            className="w-full"
            type="submit"
        >
            {label}
        </Button>
        );
};

export default SubmitButton;
