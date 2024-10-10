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

