import {useFormContext} from "react-hook-form";
import {CATEGORY_ICONS} from "@/lib/category-icons";
import {Label} from "@/components/ui/label";

export default function CategoryIconInput({iconName = "iconKey", svgName = "iconSvg"}) {
    const {register, setValue, watch} = useFormContext();
    const selectedIcon = watch(iconName) || "generic";
    const customSvg = watch(svgName) || "";

    return (
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/40">
            <div className="space-y-2">
                <Label className="text-neutral-800 dark:text-neutral-200 font-semibold">Icône universelle</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {CATEGORY_ICONS.map(({key, label, Icon}) => {
                        const active = selectedIcon === key;

                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setValue(iconName, key, {shouldDirty: true})}
                                className={`flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-colors ${active ? "border-red-300 bg-white text-red-600 ring-1 ring-red-200 dark:bg-neutral-950" : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900"}`}
                            >
                                <Icon className="h-6 w-6" />
                                <span>{label}</span>
                            </button>
                        );
                    })}
                </div>
                <input type="hidden" {...register(iconName)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor={svgName} className="text-neutral-800 dark:text-neutral-200 font-semibold">SVG personnalisé</Label>
                <textarea
                    id={svgName}
                    rows={4}
                    placeholder="Collez un SVG ici. Il remplacera l'icône universelle."
                    {...register(svgName)}
                    className="w-full rounded-lg border border-neutral-300 bg-white p-3 font-mono text-xs text-neutral-900 shadow-sm outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                />
                {customSvg && (
                    <div className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
                        <span className="font-semibold">SVG custom actif.</span>
                        <button type="button" className="font-semibold text-red-600 hover:underline" onClick={() => setValue(svgName, "", {shouldDirty: true})}>Retirer</button>
                    </div>
                )}
            </div>
        </div>
    );
}
