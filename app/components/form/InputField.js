import React from 'react';
import { useFormContext } from 'react-hook-form';

const InputField = ({hidden=false ,name, label, type = 'text', placeholder, value}) => {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className={`${hidden ? "hidden" : ""}`}>
            <label htmlFor={name}>{label}</label>
            <input
                id={name}
                type={type}
                value={value}
                placeholder={placeholder}
                {...register(name)}
                className={errors[name] ? 'input-error' : ''}
            />
            {errors[name] && <p className="error-message">{errors[name].message}</p>}
        </div>
    );
};

export default InputField;
