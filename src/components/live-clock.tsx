
"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
        setTime(new Date()); 
        
        const timer = setInterval(() => {
          setTime(new Date());
        }, 1000);

        return () => {
          clearInterval(timer);
        };
    }
  }, []);

  const { formattedDate, formattedTime24, formattedTime12 } = useMemo(() => {
    if (!time) {
        return { formattedDate: '', formattedTime24: '', formattedTime12: '' };
    }
    return {
        formattedDate: format(time, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }),
        formattedTime24: format(time, "HH:mm:ss"),
        formattedTime12: format(time, "hh:mm a"),
    }
  }, [time]);

  if (!time) {
    return (
        <div className="hidden w-48 flex-col items-end space-y-1 sm:flex">
            <div className="h-5 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
        </div>
    );
  }

  return (
    <div className="hidden text-right sm:block">
      <div className="text-sm font-semibold text-foreground">
        {formattedTime24}
        <span className="ml-2 text-foreground/60">{formattedTime12}</span>
      </div>
      <div className="text-xs capitalize text-muted-foreground">
        {formattedDate}
      </div>
    </div>
  );
}
