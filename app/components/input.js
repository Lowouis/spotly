'use client';


export default function Input({type,label,name, input, onChange}) {


    return (
        <div>
            <div className="flex flex-col">
                <label htmlFor={name} className="hidden">{label}</label>
                <input
                    type={input.type}
                    id={input.name}
                    name={input.name}
                    value={input.value}
                    onChange={onChange}
                    placeholder={label}
                    className="w-100 mt-2 py-3 px-3 rounded-lg bg-white border border-gray-400 text-gray-800 font-semibold focus:border-indigo-500 focus:outline-none"
                />
            </div>
        </div>
    );
}

