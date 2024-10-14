import React from 'react';

const SubmitButton = ({ label }) => {
    return <button
        className="w-full mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
        type="submit"
    >
        {label}
    </button>;
};

export default SubmitButton;
