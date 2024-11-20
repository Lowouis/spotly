


export default function UserInitialsIcon({user}){
    return (
        <div className="flex flex-row">
            <span
                className="mr-1 cursor-pointer bg-blue-300 p-4 rounded-full place-content-center text-xl text-black">
            {user?.username.charAt(0).toUpperCase()}
                {user?.username.charAt(1).toUpperCase()}
            </span>
        </div>
    )
}