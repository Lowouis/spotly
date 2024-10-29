import React from 'react';
import { useFormContext } from 'react-hook-form';

const InputField = ({hidden=false ,name, label, type = 'text', placeholder, value}) => {

    const { register, formState: { errors } } = useFormContext();

    return (
        <div>
            <label className={`${hidden ? "hidden" : ""}`} htmlFor={name}>{label}</label>
            <input
                id={name}
                type={type}
                value={value}
                placeholder={placeholder}
                {...register(name)}
                className={`${hidden ? "hidden" : ""} ${errors[name] ? 'input-error' : ''}`}
            />
            {errors[name] &&
                <p className="text-red-500 error-message text-sm mx-2">{errors[name].message}</p>
            }
        </div>
    );
};

export default InputField;
