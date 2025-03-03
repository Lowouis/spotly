


export default function UserInitialsIcon({user}){
    return (
        <div className="flex flex-row">
            <span
                className="mr-1 cursor-pointer bg-neutral-300 p-2 rounded-xl place-content-center text-sm text-black">
            {user?.username.charAt(0).toUpperCase()}
                {user?.username.charAt(1).toUpperCase()}
            </span>
        </div>
    )
}