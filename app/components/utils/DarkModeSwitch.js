import {Switch} from "@heroui/react";
import {useTheme} from "../../context/ThemeContext";
import {LuSunDim} from "react-icons/lu";
import {IoMoonOutline} from "react-icons/io5";

export default function DarkModeSwitch({size = 'lg'}) {
    const {theme, toggleTheme} = useTheme();

    return (
        <Switch
            isSelected={theme === 'dark'}
            onChange={toggleTheme}
            color="primary"
            endContent={<IoMoonOutline/>}
            size={size}
            startContent={<LuSunDim/>}
            aria-label="Basculer le thème"
        />
    );
}