import {Button} from "@/components/ui/button";
import {useTheme} from "@/features/shared/context/ThemeContext";
import {LuSunDim} from "react-icons/lu";
import {IoMoonOutline} from "react-icons/io5";

export default function DarkModeSwitch({size = 'lg'}) {
    const {theme, toggleTheme} = useTheme();
    const buttonSize = size === "lg" ? "icon" : size;

    return (
        <Button
            type="button"
            variant="ghost"
            size={buttonSize}
            onClick={toggleTheme}
            aria-label="Basculer le thème"
            className="h-10 w-10 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
            {theme === 'dark' ? <LuSunDim className="w-5 h-5"/> : <IoMoonOutline className="w-5 h-5"/>}
        </Button>
    );
}
