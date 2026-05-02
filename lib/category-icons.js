import {
    BeakerIcon,
    BuildingOffice2Icon,
    CameraIcon,
    ComputerDesktopIcon,
    CubeIcon,
    KeyIcon,
    MicrophoneIcon,
    RectangleGroupIcon,
    TruckIcon,
    VideoCameraIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

export const CATEGORY_ICONS = [
    {key: "generic", label: "Générique", Icon: RectangleGroupIcon},
    {key: "vehicle", label: "Véhicule", Icon: TruckIcon},
    {key: "room", label: "Salle", Icon: BuildingOffice2Icon},
    {key: "computer", label: "Ordinateur", Icon: ComputerDesktopIcon},
    {key: "projector", label: "Projecteur", Icon: VideoCameraIcon},
    {key: "camera", label: "Caméra", Icon: CameraIcon},
    {key: "audio", label: "Audio", Icon: MicrophoneIcon},
    {key: "key", label: "Clé", Icon: KeyIcon},
    {key: "tool", label: "Outil", Icon: WrenchScrewdriverIcon},
    {key: "lab", label: "Lab", Icon: BeakerIcon},
    {key: "stock", label: "Stock", Icon: CubeIcon},
];

export const getCategoryIcon = (iconKey) => CATEGORY_ICONS.find((icon) => icon.key === iconKey) || CATEGORY_ICONS[0];
