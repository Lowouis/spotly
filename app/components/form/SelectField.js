import React from 'react';
import { useFormContext } from 'react-hook-form';
import {Select, SelectSection, SelectItem} from "@nextui-org/select";

const SelectField = ({ name, label, options, disabled=false, isRequired=true, object=false, onReset=()=>{}}) => {
    const {setValue, watch, register, formState: { errors } } = useFormContext();
    const value = watch(name);
    const handleChange = (value) => {
        if(object){
            value.id !== watch(name)?.id ? setValue(name, value) : onReset();
        } else {
            value !== watch(name) ? setValue(name, value) : onReset();
        }

    };

    return (
        <div className="text-slate-800 my-2 w-full">
            <Select
                size="sm"
                isDisabled={disabled}
                isRequired={isRequired}
                id={name}
                name={name}
                label={label}
                variant="bordered"

            >
                <SelectSection label={label} >
                    {options && options.map((option, index) => (
                        <SelectItem color="primary" className="text-black" key={index} value={object ? option : option.id} onClick={()=>handleChange(object ? option : option.id)}>
                            {option.name}
                        </SelectItem>
                    ))}
                </SelectSection>
            </Select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>

    );
};

export default SelectField;
