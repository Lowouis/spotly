'use client'

import {  useRef } from 'react'

const days = [
    { date: '2021-12-27' },
    { date: '2021-12-28' },
    { date: '2021-12-29' },
    { date: '2021-12-30' },
    { date: '2021-12-31' },
    { date: '2022-01-01', isCurrentMonth: true },
    { date: '2022-01-02', isCurrentMonth: true },
    { date: '2022-01-03', isCurrentMonth: true },
    { date: '2022-01-04', isCurrentMonth: true },
    { date: '2022-01-05', isCurrentMonth: true },
    { date: '2022-01-06', isCurrentMonth: true },
    { date: '2022-01-07', isCurrentMonth: true },
    { date: '2022-01-08', isCurrentMonth: true },
    { date: '2022-01-09', isCurrentMonth: true },
    { date: '2022-01-10', isCurrentMonth: true },
    { date: '2022-01-11', isCurrentMonth: true },
    { date: '2022-01-12', isCurrentMonth: true },
    { date: '2022-01-13', isCurrentMonth: true },
    { date: '2022-01-14', isCurrentMonth: true },
    { date: '2022-01-15', isCurrentMonth: true },
    { date: '2022-01-16', isCurrentMonth: true },
    { date: '2022-01-17', isCurrentMonth: true },
    { date: '2022-01-18', isCurrentMonth: true },
    { date: '2022-01-19', isCurrentMonth: true },
    { date: '2022-01-20', isCurrentMonth: true, isToday: true },
    { date: '2022-01-21', isCurrentMonth: true },
    { date: '2022-01-22', isCurrentMonth: true, isSelected: true },
    { date: '2022-01-23', isCurrentMonth: true },
    { date: '2022-01-24', isCurrentMonth: true },
    { date: '2022-01-25', isCurrentMonth: true },
    { date: '2022-01-26', isCurrentMonth: true },
    { date: '2022-01-27', isCurrentMonth: true },
    { date: '2022-01-28', isCurrentMonth: true },
    { date: '2022-01-29', isCurrentMonth: true },
    { date: '2022-01-30', isCurrentMonth: true },
    { date: '2022-01-31', isCurrentMonth: true },
    { date: '2022-02-01' },
    { date: '2022-02-02' },
    { date: '2022-02-03' },
    { date: '2022-02-04' },
    { date: '2022-02-05' },
    { date: '2022-02-06' },
]

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

export default function DayView() {
    const container = useRef(null)
    const containerOffset = useRef(null)



    return (
        <div className="flex h-full flex-col">
            <header className="flex flex-none items-center justify-between space-x-3 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center">
                    <div className="relative flex items-center rounded-md bg-white shadow-sm md:items-stretch">
                        <button
                            type="button"
                            className="flex h-13 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-200 transition"
                        >
                            <span className="sr-only">Previous day</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                 stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="hidden border-y border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:relative md:block"
                        >
                            <span className="text-sm text-gray-900">
                                    22 Janvier 2024
                            </span>
                            <p className="mt-1 text-sm text-gray-500">Samedi</p>
                        </button>
                        <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden"/>
                        <button
                            type="button"
                            className="flex h-13 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-200 transition"
                        >
                            <span className="sr-only">Next day</span>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                                 stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </header>
            <div className="isolate flex flex-auto overflow-hidden bg-white">
                <div ref={container} className="flex flex-auto flex-col overflow-auto">
                    <div className="flex w-full flex-auto">
                        <div className="w-14 flex-none bg-white ring-1 ring-gray-100" />
                        <div className="grid flex-auto grid-cols-1 grid-rows-1">
                            {/* Horizontal lines */}
                            <div
                                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                                style={{ gridTemplateRows: 'repeat(48, minmax(3.5rem, 1fr))' }}
                            >
                                <div ref={containerOffset} className="row-end-1 h-7"></div>
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        8h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        9h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        10h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        11h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        12h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        13h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        14h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        15h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        16h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        17h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        18h00
                                    </div>
                                </div>
                                <div />
                                <div>
                                    <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
                                        19h00
                                    </div>
                                </div>
                                <div />
                            </div>

                            {/* Events */}
                            <ol
                                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
                                style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
                            >
                                <li className="relative mt-px flex" style={{ gridRow: '74 / span 12' }}>
                                    <a
                                        href="#"
                                        className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-blue-50 p-2 text-xs leading-5 hover:bg-blue-100"
                                    >
                                        <p className="order-1 font-semibold text-blue-700">Breakfast</p>
                                        <p className="text-blue-500 group-hover:text-blue-700">
                                            <time dateTime="2022-01-22T06:00">6:00 AM</time>
                                        </p>
                                    </a>
                                </li>
                                <li className="relative mt-px flex" style={{ gridRow: '92 / span 30' }}>
                                    <a
                                        href="#"
                                        className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-pink-50 p-2 text-xs leading-5 hover:bg-pink-100"
                                    >
                                        <p className="order-1 font-semibold text-pink-700">Flight to Paris</p>
                                        <p className="order-1 text-pink-500 group-hover:text-pink-700">
                                            John F. Kennedy International Airport
                                        </p>
                                        <p className="text-pink-500 group-hover:text-pink-700">
                                            <time dateTime="2022-01-22T07:30">7:30 AM</time>
                                        </p>
                                    </a>
                                </li>
                                <li className="relative mt-px flex" style={{ gridRow: '134 / span 18' }}>
                                    <a
                                        href="#"
                                        className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg bg-indigo-50 p-2 text-xs leading-5 hover:bg-indigo-100"
                                    >
                                        <p className="order-1 font-semibold text-indigo-700">Sightseeing</p>
                                        <p className="order-1 text-indigo-500 group-hover:text-indigo-700">Eiffel Tower</p>
                                        <p className="text-indigo-500 group-hover:text-indigo-700">
                                            <time dateTime="2022-01-22T11:00">11:00 AM</time>
                                        </p>
                                    </a>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}