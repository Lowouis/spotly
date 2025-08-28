'use client';
import {DatePicker, Input} from "@heroui/react";
import TimeInput from '@/components/form/HourSelect';
import {useCallback, useEffect, useState} from 'react';
import {addToast} from "@heroui/toast";
import {getLocalTimeZone, now, today} from "@internationalized/date";
import {I18nProvider} from 'react-aria';

// Fonction utilitaire en dehors du composant pour éviter les re-renders
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.day === date2.day &&
        date1.month === date2.month &&
        date1.year === date2.year;
};

export default function DateRangePickerSplitted({setValue, name = "date", onChangeCheck}) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [dateError, setDateError] = useState(null);


    // Initialiser avec la date et l'heure actuelles
    useEffect(() => {
        const currentDate = today(getLocalTimeZone());
        const currentTime = now(getLocalTimeZone());
        const currentHour = currentTime.hour.toString().padStart(2, '0');

        setStartDate(currentDate);
        setStartTime(currentHour);


    }, []);

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

            setDateError(null);
            const startDateObj = new Date(start.year, start.month - 1, start.day, parseInt(startT));
            const endDateObj = new Date(end.year, end.month - 1, end.day, parseInt(endT));

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

    return (
        <I18nProvider locale="fr-FR">
            <div className="flex flex-col gap-2">
                {/* Version mobile optimisée */}
                <div className="block md:hidden space-y-3">
                    {/* Ligne 1: Date et heure de début */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Début
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <DatePicker
                                isRequired
                                label="Date"
                                className="w-full"
                                variant='bordered'
                                zone={getLocalTimeZone()}
                                size="sm"
                                color="default"
                                onChange={handleStartDateChange}
                                value={startDate}
                                isInvalid={!!dateError}
                                maxValue={endDate}
                                minValue={today(getLocalTimeZone())}
                                classNames={{
                                    inputWrapper: "border-none",
                                    base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                    input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                    label: "text-neutral-800 dark:text-neutral-200 font-semibold whitespace-nowrap",
                                    calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                                }}
                                calendarProps={{
                                    classNames: {
                                        base: "bg-background",
                                        headerWrapper: "pt-4 bg-background",
                                        prevButton: "border-1 border-default-200 rounded-small",
                                        nextButton: "border-1 border-default-200 rounded-small",
                                        gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                        cellButton: [
                                            "data-[today=true]:text-primary",
                                            "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                            "hover:bg-primary hover:text-primary-foreground",
                                            "rounded-small transition-colors",
                                            "data-[today=true]:font-semibold",
                                            "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                            "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                            "data-[in-range=true]:bg-primary/20",
                                        ],
                                    },
                                }}
                            />
                            <TimeInput
                                name={"startTime"}
                                label="Heure"
                                onChange={handleStartTimeChange}
                                value={startTime}
                                isInvalid={!!dateError}
                                maxValue={isSameDay(startDate, endDate) ? endTime : null}
                                className="w-full"
                            />
                        </div>
                    </div>

                    {/* Ligne 2: Date et heure de fin */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Fin
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <DatePicker
                                calendarProps={{
                                    classNames: {
                                        base: "bg-background",
                                        headerWrapper: "pt-4 bg-background",
                                        prevButton: "border-1 border-default-200 rounded-small",
                                        nextButton: "border-1 border-default-200 rounded-small",
                                        gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                        cellButton: [
                                            "data-[today=true]:text-primary",
                                            "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                            "hover:bg-primary hover:text-primary-foreground",
                                            "rounded-small transition-colors",
                                            "data-[today=true]:font-semibold",
                                            "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                            "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                            "data-[in-range=true]:bg-primary/20",
                                        ],
                                    },
                                }}
                                isRequired
                                size='sm'
                                color="default"
                                variant="bordered"
                                label="Date"
                                className="w-full"
                                onChange={handleEndDateChange}
                                value={endDate}
                                minValue={startDate}
                                isDisabled={!startDate}
                                isInvalid={!!dateError}
                                classNames={{
                                    inputWrapper: "border-none",
                                    base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                    input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                    label: "text-neutral-800 dark:text-neutral-200 font-semibold whitespace-nowrap",
                                    calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                                }}
                            />
                            <TimeInput
                                name={"endTime"}
                                label="Heure"
                                onChange={handleEndTimeChange}
                                value={endTime}
                                isDisabled={!startDate || !endDate}
                                isInvalid={!!dateError}
                                minValue={isSameDay(startDate, endDate) ? startTime : null}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Version desktop */}
                <div className="hidden md:flex md:flex-row gap-2">
                    <div className="flex flex-1 flex-row gap-2">
                        <DatePicker
                            isRequired
                            label="Date de début"
                            className="w-full"
                            variant='bordered'
                            zone={getLocalTimeZone()}
                            size="sm"
                            color="default"
                            onChange={handleStartDateChange}
                            value={startDate}
                            isInvalid={!!dateError}
                            maxValue={endDate}
                            minValue={today(getLocalTimeZone())}
                            classNames={{
                                inputWrapper: "border-none",
                                base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                label: "text-neutral-800 dark:text-neutral-200 font-semibold whitespace-nowrap",
                                calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                            }}
                            calendarProps={{
                                classNames: {
                                    base: "bg-background",
                                    headerWrapper: "pt-4 bg-background",
                                    prevButton: "border-1 border-default-200 rounded-small",
                                    nextButton: "border-1 border-default-200 rounded-small",
                                    gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                    cellButton: [
                                        "data-[today=true]:text-primary",
                                        "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                        "hover:bg-primary hover:text-primary-foreground",
                                        "rounded-small transition-colors",
                                        "data-[today=true]:font-semibold",
                                        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                        "data-[in-range=true]:bg-primary/20",
                                    ],
                                },
                            }}
                        />
                        <TimeInput
                            name={"startTime"}
                            label="Heure de début"
                            onChange={handleStartTimeChange}
                            value={startTime}
                            isInvalid={!!dateError}
                            maxValue={isSameDay(startDate, endDate) ? endTime : null}
                            className="min-w-[180px]"
                        />
                    </div>
                    <div className="flex flex-1 flex-row gap-2">
                        <DatePicker
                            calendarProps={{
                                classNames: {
                                    base: "bg-background",
                                    headerWrapper: "pt-4 bg-background",
                                    prevButton: "border-1 border-default-200 rounded-small",
                                    nextButton: "border-1 border-default-200 rounded-small",
                                    gridHeader: "bg-background shadow-none border-b-1 border-default-100",
                                    cellButton: [
                                        "data-[today=true]:text-primary",
                                        "data-[selected=true]:bg-primary data-[selected=true]:text-black",
                                        "hover:bg-primary hover:text-primary-foreground",
                                        "rounded-small transition-colors",
                                        "data-[today=true]:font-semibold",
                                        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
                                        "data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
                                        "data-[in-range=true]:bg-primary/20",
                                    ],
                                },
                            }}
                            isRequired
                            size='sm'
                            color="default"
                            variant="bordered"
                            label="Date de fin"
                            className="w-full"
                            onChange={handleEndDateChange}
                            value={endDate}
                            minValue={startDate}
                            isDisabled={!startDate}
                            isInvalid={!!dateError}
                            classNames={{
                                inputWrapper: "border-none",
                                base: "dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                                input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                                label: "text-neutral-800 dark:text-neutral-200 font-semibold whitespace-nowrap",
                                calendarWrapper: "bg-white dark:bg-neutral-900 border-0 rounded-lg shadow-lg",
                            }}
                        />
                        <TimeInput
                            name={"endTime"}
                            label="Heure de fin"
                            onChange={handleEndTimeChange}
                            value={endTime}
                            isDisabled={!startDate || !endDate}
                            isInvalid={!!dateError}
                            minValue={isSameDay(startDate, endDate) ? startTime : null}
                            className="min-w-[180px]"
                        />
                    </div>
                </div>
                {dateError && (
                    <span className="text-danger text-sm">{dateError}</span>
                )}
                <Input
                    type="hidden"
                    name={name}
                    value={JSON.stringify({
                        startDate: startDate && startTime ? new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(startTime)).toISOString() : null,
                        endDate: endDate && endTime ? new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(endTime)).toISOString() : null
                    })}
                />
            </div>
        </I18nProvider>
    );
}


    