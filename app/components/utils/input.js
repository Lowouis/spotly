'use client';


import {useState} from "react";

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

export function Dropdown({items, label, defaultItem}){
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(defaultItem ?? null);
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };


    return (
        <div className="relative my-2">
            <button
                id="btn"
                onClick={toggleDropdown}
                className={`block rounded-lg px-4 py-3 text-sm font-medium text-gray-500 bg-gray-100 hover:text-gray-700 w-full ${isOpen ? "bg-gray-200 border-blue-700 border-2" : "border-transparent border-2"} transition hover:cursor-pointer`}
            >
                <span className="flex flex-row justify-between w-full">
                        <span className="text-left mx-1">{selected ?? label}</span>
                        <span className="mx-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path fillRule="evenodd"
                            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.53 14.03a.75.75 0 0 0 1.06 0l3-3a.75.75 0 1 0-1.06-1.06l-1.72 1.72V8.25a.75.75 0 0 0-1.5 0v5.69l-1.72-1.72a.75.75 0 0 0-1.06 1.06l3 3Z"
                            clipRule="evenodd"/>
                            </svg>
                        </span>
                </span>

            </button>


            <div
                id="content"
                className={`absolute z-40 top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-200 transform ${
                    isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'
                }`}
            >
                <div className="">
                    {items.map((item) => (
                        <p
                            key={item.id}
                            onClick={() => {
                                setSelected(item.name);
                                toggleDropdown();
                            }}
                            className="text-gray-700 mx-0 p-2 transition rounded hover:bg-gray-200 cursor-pointer ">
                            {item.name}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};
