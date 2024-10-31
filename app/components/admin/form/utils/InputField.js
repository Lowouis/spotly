import React from "react";
import {Input} from "@nextui-org/input";



export default function InputField({register, required, type, label, errors}){


    return (
        <div>
            <label>{label}</label>
            <Input
                variant="flat"
                labelPlacement="outside"
                id={register.name}
                type={type}
                register={register}
                required={required}
                onBlur={register.onBlur}
                value={register.value}
                onChange={register.onChange}
                ref={register.ref}
                name={register.name}
                className={`${errors[register.name] ? 'input-error' : ''}`}
            />
            {errors[register.name] &&
                <p className="text-red-500 error-message text-sm mx-2">{errors[register.name].message}</p>
            }
        </div>
    );
}