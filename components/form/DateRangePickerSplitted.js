'use client';
import {DatePicker} from "@nextui-org/react";
import TimeInput from '@/components/form/HourSelect';
import {useState, useEffect} from 'react';
import {Input} from "@nextui-org/react";
import {addToast} from "@heroui/toast";
import {getLocalTimeZone, today} from "@internationalized/date";

export default function DateRangePickerSplitted({setValue, name = "date"}) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [dateError, setDateError] = useState(null);

    const handleStartDateChange = (date) => {
        setStartDate(date);
        if (endDate && new Date(date) > new Date(endDate)) {
            setEndDate(date);
        }
    };

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return date1.day === date2.day &&
            date1.month === date2.month &&
            date1.year === date2.year;
    }

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
    };

    const validateAndSetDates = () => {
        if (startDate && endDate && startTime && endTime) {
            if (isSameDay(startDate, endDate)) {
                const startHour = parseInt(startTime);
                const endHour = parseInt(endTime);

                if (startHour > endHour) {
                    setDateError("L'heure de début ne peut pas être après l'heure de fin");
                    return;
                }
            }
            setDateError(null);

            const start = new Date(startDate.year, startDate.month - 1, startDate.day, parseInt(startTime));
            const end = new Date(endDate.year, endDate.month - 1, endDate.day, parseInt(endTime));

            setValue(name, {
                start: start,
                end: end,
                timeZone: getLocalTimeZone()
            });
        }
    };

    useEffect(() => {
        validateAndSetDates();
    }, [startDate, endDate, startTime, endTime]);

    // Supprimer le second useEffect

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
                        onChange={(time) => setStartTime(time.target.value)}
                        value={startTime}
                        isInvalid={!!dateError}
                        // Si même jour, l'heure max est l'heure de fin
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
                    />
                    <TimeInput
                        name={"endTime"}
                        label="Heure de fin"
                        onChange={(time) => setEndTime(time.target.value)}
                        value={endTime}
                        isDisabled={!startDate || !endDate}
                        isInvalid={!!dateError}
                        // Si même jour, l'heure min est l'heure de début
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


    