import React from 'react';
import { useFormContext } from 'react-hook-form';

const SelectField = ({ name, label, options, disabled=false}) => {
    const { register, formState: { errors } } = useFormContext();
    return (
        <div className="text-slate-800 my-2">
            <label className="hidden" htmlFor={name}>{label}</label>
            <select
                id={name}
                {...register(name)}
                className={`block rounded-lg px-4 py-3 text-sm font-medium ${disabled ? "bg-gray-200 text-gray-600 cursor-not-allowed" : "text-gray-500 bg-gray-100" }  hover:text-gray-700 w-full border-transparent border-2 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700 transition`}
                {...(disabled && {disabled: true})}
            >
                <option value="">{label}</option>
                {options && options.map((option, index) => (
                    <option key={index} value={option.id} >
                        {option.name}
                    </option>
                ))}
            </select>
            {errors[name] && <p className="error-message text-red-600 mt-2">{errors[name].message}</p>}
        </div>

    );
};

export default SelectField;
