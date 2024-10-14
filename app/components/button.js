'use client';


export default function Button({label, onClick}) {

    
    return (
        <div className="mt-4 flex justify-center">
            <button
                onClick={onClick}
                className="bg-blue-500 hover:bg-blue-800 transition text-white font-bold py-2 px-4 rounded">{label}</button>
        </div>
    );
}

export function MenuButton({label, onClick, active}) {

    return (
        <li>
            <a
                onClick={onClick}
                className={`block rounded-lg px-4 py-3 text-sm font-medium text-gray-500 ${active ? "bg-gray-100 text-gray-700" : "hover:bg-gray-100 hover:text-gray-700"}  hover:cursor-pointer`}
            >
                {label}
            </a>
        </li>
    );
}

