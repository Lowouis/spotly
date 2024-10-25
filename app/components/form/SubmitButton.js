import React from 'react';
import {Button} from "@nextui-org/button";

const SubmitButton = ({ label, color='primary' }) => {
    return (
        <Button
            color={color}
            className="block m-auto p-0"
            type="submit"
        >
            {label}
        </Button>
        );
};

export default SubmitButton;
