
export default function BlinkingDotText({ content, color="green" }) {
    return (
        <div className="flex items-center">
            <span className="relative flex h-3 w-3 mr-3">
              <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 bg-green-500`}></span>
            </span>
            <span className="text-neutral-800 dark:text-neutral-200">{content}</span>
        </div>
    );
}
