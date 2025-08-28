import {Button} from "@heroui/react";
import {useTheme} from "@/context/ThemeContext";
import {LuSunDim} from "react-icons/lu";
import {IoMoonOutline} from "react-icons/io5";

export default function DarkModeSwitch({size = 'lg'}) {
    const {theme, toggleTheme} = useTheme();

    return (
        <Button
            isIconOnly
            variant="light"
            size={size}
            onPress={toggleTheme}
            aria-label="Basculer le thème"
            className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
            {theme === 'dark' ? <LuSunDim className="w-5 h-5"/> : <IoMoonOutline className="w-5 h-5"/>}
        </Button>
    );
}