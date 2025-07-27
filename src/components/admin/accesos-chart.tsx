
"use client"

import { memo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"
import type { VehicularRegistration, PedestrianRegistration } from "@/lib/definitions"
import { useMemo } from "react"

interface AccesosChartProps {
  vehicular: VehicularRegistration[]
  pedestrian: PedestrianRegistration[]
}

function AccesosChart({ vehicular, pedestrian }: AccesosChartProps) {
  const chartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, vehicular: 0, peatonal: 0 }));
    
    vehicular.forEach(reg => {
      const hour = new Date(reg.entryTimestamp).getHours();
      if (hours[hour]) {
        hours[hour].vehicular++;
      }
    });

    pedestrian.forEach(reg => {
      const hour = new Date(reg.entryTimestamp).getHours();
       if (hours[hour]) {
        hours[hour].peatonal++;
      }
    });
    
    return hours.map(h => ({ name: `${h.hour}:00`, ...h}));
  }, [vehicular, pedestrian]);

  const chartConfig = {
    vehicular: {
      label: "Vehicular",
      color: "hsl(var(--primary))",
    },
    peatonal: {
      label: "Peatonal",
      color: "hsl(var(--secondary))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos por Hora</CardTitle>
        <CardDescription>Tráfico de las últimas 24 horas.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value, index) => (index % 3 === 0 ? value : "")}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="vehicular" fill="var(--color-vehicular)" radius={4} />
              <Bar dataKey="peatonal" fill="var(--color-peatonal)" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default memo(AccesosChart);
