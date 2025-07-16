'use client';
import {DatePicker, Input} from "@heroui/react";
import TimeInput from '@/components/form/HourSelect';
import {useState} from 'react';
import {addToast} from "@heroui/toast";
import {getLocalTimeZone, today} from "@internationalized/date";

export default function DateRangePickerSplitted({setValue, name = "date", onChangeCheck}) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [dateError, setDateError] = useState(null);

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return date1.day === date2.day &&
            date1.month === date2.month &&
            date1.year === date2.year;
    }

    const handleStartDateChange = (date) => {
        setStartDate(date);
        if (endDate && new Date(date) > new Date(endDate)) {
            setEndDate(date);
        }
        updateValue(date, endDate, startTime, endTime);
    };

    const handleEndDateChange = (date) => {
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
        updateValue(startDate, date, startTime, endTime);
    };

    const handleStartTimeChange = (time) => {
        setStartTime(time.target.value);
        updateValue(startDate, endDate, time.target.value, endTime);
    };

    const handleEndTimeChange = (time) => {
        setEndTime(time.target.value);
        updateValue(startDate, endDate, startTime, time.target.value);
    };

    const updateValue = (start, end, startT, endT) => {
        onChangeCheck();
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
        const startDate = new Date(start.year, start.month - 1, start.day, parseInt(startT));
        const endDate = new Date(end.year, end.month - 1, end.day, parseInt(endT));

        setValue(name, {
            start: startDate,
            end: endDate,
            timeZone: getLocalTimeZone()
        });
    };

    return (
        <div className="flex-grow flex flex-col gap-2">
            <div className="flex flex-row gap-2">
                <div className="flex flex-1 flex-row gap-2">
                    <DatePicker
                        isRequired
                        label="Date de début"
                        className="w-full"
                        variant='bordered'
                        size="sm"
                        color="default"
                        onChange={handleStartDateChange}
                        value={startDate}
                        isInvalid={!!dateError}
                        maxValue={endDate}
                        minValue={today(getLocalTimeZone())}
                        classNames={{
                            base: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                            input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400 border-none",
                            label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                            calendarWrapper: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg",
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
                                    "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                                    "hover:bg-primary hover:text-primary-foreground",
                                    "rounded-small transition-colors",
                                    "data-[today=true]:font-semibold",
                                    // Range selection styles
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
                                    "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                                    "rounded-small transition-colors",
                                    "data-[today=true]:font-semibold",
                                    // Range selection styles
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
                            base: "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-sm",
                            input: "text-neutral-900 dark:text-neutral-100 font-semibold placeholder:text-neutral-500 dark:placeholder:text-neutral-400",
                            label: "text-neutral-800 dark:text-neutral-200 font-semibold",
                            calendarWrapper: "bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-lg",
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
                    />
                </div>
            </div>
            {dateError && (
                <span className="text-danger text-sm">{dateError}</span>
            )}
            <Input
                type="hidden"
                name={name}
                value={{
                    startDate: startDate && startTime ? new Date(startDate.year, startDate.month, startDate.day, parseInt(startTime)).toISOString() : null,
                    endDate: endDate && endTime ? new Date(endDate.year, endDate.month, endDate.day, parseInt(endTime)).toISOString() : null
                }}
            />
        </div>
    );
}


    