import { useState, useMemo, useCallback } from 'react';
import moment from "moment";
import { type View, Views } from "react-big-calendar";
import type { Event, Task } from "@/types";
import { buildCalendarEntries } from "@/utils/calendarAdapter";
import { getNavigationUnit } from "./calendarTypes";


export const useCalendarState = (tasks: Task[], events: Event[]) => {

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
    const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);
    const [view, setView] = useState<View>(Views.WEEK);
    const [date, setDate] = useState(new Date());
    const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});
    const [headerHeight, setHeaderHeight] = useState(0);
    const [timeGutterWidth, setTimeGutterWidth] = useState(56);

    const calendarEntries = useMemo(() => buildCalendarEntries({ tasks, events, scheduleOrder }), [events, scheduleOrder, tasks],);

    const currentLabel = useMemo(() => moment(date).format("MMMM YYYY"), [date]);

    const dateStripDays = useMemo(() => {
        if (view === Views.WEEK) {
            const startOfWeek = moment(date).startOf("week");
            return Array.from({ length: 7 }, (_, index) => startOfWeek.clone().add(index, "day"));
        }

        if (view === Views.DAY) {
            return [moment(date)];
        }

        return [];
    }, [date, view]);

    const goToToday = useCallback(() => {
        setDate(new Date());
    }, []);
    
    const goToPrevious = useCallback(() => {
        setDate((currentDate) => moment(currentDate).subtract(1, getNavigationUnit(view)).toDate());
    }, [view]);
    
    const goToNext = useCallback(() => {
        setDate((currentDate) => moment(currentDate).add(1, getNavigationUnit(view)).toDate());
    }, [view]);

    return {
        state: {
            isSidebarOpen,
            sidebarMode,
            selectedItem,
            view,
            date,
            scheduleOrder,
            headerHeight,
            timeGutterWidth,
            calendarEntries,
            currentLabel,
            dateStripDays
        },
        actions: {
            setIsSidebarOpen,
            setSidebarMode,
            setSelectedItem,
            setView,
            setDate,
            setScheduleOrder,
            setHeaderHeight,
            setTimeGutterWidth,
            goToToday,
            goToPrevious,
            goToNext,
            
        }
    }

}