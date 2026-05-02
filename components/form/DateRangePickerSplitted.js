'use client';
import TimeInput from '@/components/form/HourSelect';
import {useCallback, useEffect, useRef, useState} from 'react';
import {addToast} from "@/lib/toast";
import {CalendarDate, getLocalTimeZone, now, today} from "@internationalized/date";
import ShadcnDatePicker from "@/components/form/ShadcnDatePicker";
import {CalendarDaysIcon, SunIcon} from "@heroicons/react/24/outline";

// Fonction utilitaire en dehors du composant pour éviter les re-renders
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.day === date2.day &&
        date1.month === date2.month &&
        date1.year === date2.year;
};

const defaultShortcutOptions = {
    shortcutStartHour: 8,
    shortcutEndHour: 18,
    shortcutWeekEndDay: 5,
};

const normalizeHour = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 23) return fallback;
    return parsed;
};

const normalizeWeekEndDay = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) return fallback;
    return parsed;
};

export default function DateRangePickerSplitted({setValue, name = "date", onChangeCheck, variant = "default", presetRange = null}) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [dateError, setDateError] = useState(null);
    const [shortcutOptions, setShortcutOptions] = useState(defaultShortcutOptions);
    const lastSyncedValueRef = useRef('');


    // Initialiser avec la date et l'heure actuelles
    useEffect(() => {
        const currentDate = today(getLocalTimeZone());
        const currentTime = now(getLocalTimeZone());
        const currentHour = currentTime.hour.toString().padStart(2, '0');

        setStartDate(currentDate);
        setStartTime(currentHour);


    }, []);

    useEffect(() => {
        const loadShortcutOptions = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/timeScheduleOptions`, {
                    credentials: 'include',
                });

                if (!response.ok) return;

                const options = await response.json();
                setShortcutOptions({
                    shortcutStartHour: normalizeHour(options?.shortcutStartHour, defaultShortcutOptions.shortcutStartHour),
                    shortcutEndHour: normalizeHour(options?.shortcutEndHour, defaultShortcutOptions.shortcutEndHour),
                    shortcutWeekEndDay: normalizeWeekEndDay(options?.shortcutWeekEndDay, defaultShortcutOptions.shortcutWeekEndDay),
                });
            } catch (error) {
                console.error('Erreur lors du chargement des raccourcis de réservation:', error);
            }
        };

        loadShortcutOptions();
    }, []);

    useEffect(() => {
        if (!presetRange?.start || !presetRange?.end) return;

        const start = new Date(presetRange.start);
        const end = new Date(presetRange.end);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

        setStartDate(new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate()));
        setEndDate(new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate()));
        setStartTime(String(start.getHours()).padStart(2, '0'));
        setEndTime(String(end.getHours()).padStart(2, '0'));
        setDateError(null);
    }, [presetRange?.start, presetRange?.end]);

    // Mettre à jour la valeur du formulaire une fois les états initialisés
    useEffect(() => {
        if (startDate && endDate && startTime && endTime) {
            const start = startDate;
            const end = endDate;
            const startT = startTime;
            const endT = endTime;

            if (!start || !end || !startT || !endT) {
                return;
            }

            if (isSameDay(start, end)) {
                const startHour = parseInt(startT);
                const endHour = parseInt(endT);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }

            const startDateObj = new Date(start.year, start.month - 1, start.day, parseInt(startT));
            const endDateObj = new Date(end.year, end.month - 1, end.day, parseInt(endT));
            const nextValueKey = `${startDateObj.getTime()}-${endDateObj.getTime()}`;
            if (lastSyncedValueRef.current === nextValueKey) return;

            lastSyncedValueRef.current = nextValueKey;
            setDateError(null);

            setValue(name, {
                start: startDateObj,
                end: endDateObj,
                timeZone: getLocalTimeZone()
            });
        }
    }, [startDate, endDate, startTime, endTime, setValue, name]);

    const handleStartDateChange = useCallback((date) => {
        setStartDate(date);
        if (endDate && new Date(date) > new Date(endDate)) {
            setEndDate(date);
        }
        // Appeler updateValue avec onChangeCheck pour les changements utilisateur
        if (onChangeCheck) {
            onChangeCheck();
        }
        if (date && endDate && startTime && endTime) {
            if (isSameDay(date, endDate)) {
                const startHour = parseInt(startTime);
                const endHour = parseInt(endTime);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }

            setDateError(null);
            const startDateObj = new Date(date.year, date.month - 1, date.day, parseInt(startTime));
            const endDateObj = new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(endTime));

            setValue(name, {
                start: startDateObj,
                end: endDateObj,
                timeZone: getLocalTimeZone()
            });
        }
    }, [endDate, startTime, endTime, onChangeCheck, setValue, name]);

    const handleEndDateChange = useCallback((date) => {
        if (startDate && new Date(date) < new Date(startDate)) {
            addToast({
                title: "Erreur de date",
                description: "La date de fin ne peut pas être antérieure à la date de début",
                color: "danger",
                duration: 3000,
            });
            return;
        }
        setEndDate(date);
        // Appeler updateValue avec onChangeCheck pour les changements utilisateur
        if (onChangeCheck) {
            onChangeCheck();
        }
        if (startDate && date && startTime && endTime) {
            if (isSameDay(startDate, date)) {
                const startHour = parseInt(startTime);
                const endHour = parseInt(endTime);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }

            setDateError(null);
            const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(startTime));
            const endDateObj = new Date(date.year, date.month - 1, date.day, parseInt(endTime));

            setValue(name, {
                start: startDateObj,
                end: endDateObj,
                timeZone: getLocalTimeZone()
            });
        }
    }, [startDate, startTime, endTime, onChangeCheck, setValue, name]);

    const handleStartTimeChange = useCallback((time) => {
        setStartTime(time.target.value);
        // Appeler updateValue avec onChangeCheck pour les changements utilisateur
        if (onChangeCheck) {
            onChangeCheck();
        }
        if (startDate && endDate && time.target.value && endTime) {
            if (isSameDay(startDate, endDate)) {
                const startHour = parseInt(time.target.value);
                const endHour = parseInt(endTime);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }

            setDateError(null);
            const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(time.target.value));
            const endDateObj = new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(endTime));

            setValue(name, {
                start: startDateObj,
                end: endDateObj,
                timeZone: getLocalTimeZone()
            });
        }
    }, [startDate, endDate, endTime, onChangeCheck, setValue, name]);

    const handleEndTimeChange = useCallback((time) => {
        setEndTime(time.target.value);
        // Appeler updateValue avec onChangeCheck pour les changements utilisateur
        if (onChangeCheck) {
            onChangeCheck();
        }
        if (startDate && endDate && startTime && time.target.value) {
            if (isSameDay(startDate, endDate)) {
                const startHour = parseInt(startTime);
                const endHour = parseInt(time.target.value);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }

            setDateError(null);
            const startDateObj = new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(startTime));
            const endDateObj = new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(time.target.value));

            setValue(name, {
                start: startDateObj,
                end: endDateObj,
                timeZone: getLocalTimeZone()
            });
        }
    }, [startDate, endDate, startTime, onChangeCheck, setValue, name]);

    const applyShortcut = useCallback((shortcut) => {
        const baseDate = today(getLocalTimeZone());
        const startHour = shortcutOptions.shortcutStartHour;
        const endHour = shortcutOptions.shortcutEndHour;
        let targetStart = baseDate;
        let targetEnd = baseDate;

        if (shortcut === "tomorrow") {
            targetStart = baseDate.add({days: 1});
            targetEnd = targetStart;
        } else if (shortcut === "week") {
            const currentDay = new Date(baseDate.year, baseDate.month - 1, baseDate.day).getDay();
            const currentIsoDay = currentDay === 0 ? 7 : currentDay;
            const weekEndIsoDay = shortcutOptions.shortcutWeekEndDay === 0 ? 7 : shortcutOptions.shortcutWeekEndDay;
            const daysUntilWeekEnd = currentIsoDay <= weekEndIsoDay ? weekEndIsoDay - currentIsoDay : 0;
            targetEnd = baseDate.add({days: daysUntilWeekEnd});
        } else if (shortcut === "two-weeks") {
            targetEnd = baseDate.add({days: 14});
        }

        setStartDate(targetStart);
        setEndDate(targetEnd);
        setStartTime(startHour.toString().padStart(2, '0'));
        setEndTime(endHour.toString().padStart(2, '0'));
        setDateError(null);

    }, [shortcutOptions]);

    const toDate = (value, hour) => value && hour ? new Date(value.year, value.month - 1, value.day, parseInt(hour)) : null;
    const selectedStart = toDate(startDate, startTime);
    const selectedEnd = toDate(endDate, endTime);
    if (variant === "spotly") {
        return (
            <div className="space-y-4">
                <div className="rounded-2xl border border-[#dfe6ee] bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="grid gap-3 xl:grid-cols-2">
                        <div className="rounded-xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#111827] dark:text-neutral-100">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                                Début
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ShadcnDatePicker required label="Date" value={startDate} min={today(getLocalTimeZone())} max={endDate} invalid={!!dateError} onChange={handleStartDateChange} />
                                <TimeInput name="startTime" label="Heure" onChange={handleStartTimeChange} value={startTime} isInvalid={!!dateError} maxValue={isSameDay(startDate, endDate) ? endTime : null} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-[#dfe6ee] bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#111827] dark:text-neutral-100">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#ff2a2f] shadow-[0_0_0_4px_rgba(255,42,47,0.12)]" />
                                Fin
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <ShadcnDatePicker required label="Date" value={endDate} min={startDate} disabled={!startDate} invalid={!!dateError} onChange={handleEndDateChange} />
                                <TimeInput name="endTime" label="Heure" onChange={handleEndTimeChange} value={endTime} isDisabled={!startDate || !endDate} isInvalid={!!dateError} minValue={isSameDay(startDate, endDate) ? startTime : null} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-xs font-bold uppercase tracking-wide text-[#5f6b7a] dark:text-neutral-400">Raccourcis</span>
                        <button type="button" onClick={() => applyShortcut("today")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe6ee] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                                <CalendarDaysIcon className="h-5 w-5" />
                                Aujourd’hui
                            </button>
                        <button type="button" onClick={() => applyShortcut("tomorrow")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe6ee] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                                <SunIcon className="h-5 w-5" />
                                Demain
                            </button>
                        <button type="button" onClick={() => applyShortcut("week")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe6ee] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                                <CalendarDaysIcon className="h-5 w-5" />
                                Cette semaine
                            </button>
                        <button type="button" onClick={() => applyShortcut("two-weeks")} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#dfe6ee] bg-white px-3 text-xs font-bold text-[#111827] hover:bg-[#f6f8fb] dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900">
                                <CalendarDaysIcon className="h-5 w-5" />
                                2 semaines
                            </button>
                    </div>
                </div>

                {dateError && <span className="text-sm text-red-500">{dateError}</span>}
                <input
                    type="hidden"
                    name={name}
                    value={JSON.stringify({
                        startDate: selectedStart ? selectedStart.toISOString() : null,
                        endDate: selectedEnd ? selectedEnd.toISOString() : null
                    })}
                    readOnly
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="grid grid-cols-2 items-end gap-2">
                    <ShadcnDatePicker
                        required
                        label="Date de début"
                        value={startDate}
                        min={today(getLocalTimeZone())}
                        max={endDate}
                        invalid={!!dateError}
                        onChange={handleStartDateChange}
                    />
                    <TimeInput
                        name="startTime"
                        label="Heure de début"
                        onChange={handleStartTimeChange}
                        value={startTime}
                        isInvalid={!!dateError}
                        maxValue={isSameDay(startDate, endDate) ? endTime : null}
                    />
                </div>
                <div className="grid grid-cols-2 items-end gap-2">
                    <ShadcnDatePicker
                        required
                        label="Date de fin"
                        value={endDate}
                        min={startDate}
                        disabled={!startDate}
                        invalid={!!dateError}
                        onChange={handleEndDateChange}
                    />
                    <TimeInput
                        name="endTime"
                        label="Heure de fin"
                        onChange={handleEndTimeChange}
                        value={endTime}
                        isDisabled={!startDate || !endDate}
                        isInvalid={!!dateError}
                        minValue={isSameDay(startDate, endDate) ? startTime : null}
                    />
                </div>
            </div>
            {dateError && <span className="text-red-500 text-sm">{dateError}</span>}
            <input
                type="hidden"
                name={name}
                value={JSON.stringify({
                    startDate: startDate && startTime ? new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(startTime)).toISOString() : null,
                    endDate: endDate && endTime ? new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(endTime)).toISOString() : null
                })}
                readOnly
            />
        </div>
    );
}
