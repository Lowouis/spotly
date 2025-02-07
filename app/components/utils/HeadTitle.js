



export default function HeadTitle({title}) {


    return (
        <div
            onClick={() => window.location.href = "/"}
            className="px-3 text-5xl w-1/3 font-bold cursor-pointer text-blue-600 hover:text-blue-500 transition-all ease-in ">
            {title}
        </div>
    )
}