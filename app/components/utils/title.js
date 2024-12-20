

export default function Title({title, className}) {
    return (
        <div>
            <h1 className={`text-3xl font-bold text-slate-700 ${className}`}>{title}</h1>
        </div>
    );
}