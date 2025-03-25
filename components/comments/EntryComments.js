import React, { useState } from 'react';
import { Button } from "@nextui-org/button";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { motion, AnimatePresence } from "framer-motion";

export default function EntryComments({ entry, adminMode = false }) {
    const [showComments, setShowComments] = useState(false);

    return (
        <>
            <div className="w-full">
                {(entry.comment || entry.adminNote) && (
                    <div className="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 pt-4 pb-2">
                        <span className="text-neutral-700 dark:text-neutral-300 font-medium">Messages</span>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={() => setShowComments(!showComments)}
                            className="text-neutral-500"
                        >
                            <motion.div
                                animate={{ rotate: showComments ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <IoIosArrowDown size={20} />
                            </motion.div>
                        </Button>
                    </div>
                )}
            </div>
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="space-y-4 overflow-hidden"
                    >
                        {entry.adminNote && (
                            <div className="flex items-start justify-start space-x-2">
                                <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-white text-sm">
                                    M
                                </div>
                                <div className="flex flex-col items-start space-y-1 max-w-[80%]">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Manager</span>
                                    <div className="bg-blue-500 p-3 rounded-2xl rounded-tl-none">
                                        <span className="text-white">{entry.adminNote}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {entry.comment && (
                            <div className="flex items-start justify-end space-x-2">
                                <div className="flex flex-col items-end space-y-1 max-w-[80%]">
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {!adminMode ? "Vous" : entry.user.name + " " + entry.user.surname}
                                    </span>
                                    <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-2xl rounded-tr-none">
                                        <span className="text-neutral-900 dark:text-neutral-200">{entry.comment}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                                    {entry.user.name[0] + entry.user.name[1]}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}