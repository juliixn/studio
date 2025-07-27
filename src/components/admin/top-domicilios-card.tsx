
"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { VehicularRegistration, PedestrianRegistration } from "@/lib/definitions"
import { useMemo } from "react"
import { Building } from "lucide-react"

interface TopDomiciliosCardProps {
  vehicular: VehicularRegistration[]
  pedestrian: PedestrianRegistration[]
}

function TopDomiciliosCard({ vehicular, pedestrian }: TopDomiciliosCardProps) {

  const topDomicilios = useMemo(() => {
    const counts: { [key: string]: number } = {};
    // Combine arrays safely, filtering out any records without a valid address string
    const allRegistrations = [...(vehicular || []), ...(pedestrian || [])];
    
    allRegistrations.forEach(reg => {
      // Ensure reg.address is a non-empty string before processing
      if (reg && typeof reg.address === 'string' && reg.address.trim()) {
        counts[reg.address] = (counts[reg.address] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([address, count]) => ({ address, count }));
  }, [vehicular, pedestrian]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Domicilios Más Visitados</CardTitle>
        <CardDescription>Ranking de domicilios con más registros de entrada.</CardDescription>
      </CardHeader>
      <CardContent>
        {topDomicilios.length > 0 ? (
          <ul className="space-y-3">
            {topDomicilios.map((item, index) => (
              <li key={item.address} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                    <span className="font-mono text-muted-foreground text-xs w-4">{index + 1}.</span>
                    <Building className="h-4 w-4 text-primary" />
                    <span className="font-medium">{item.address}</span>
                </div>
                <span className="font-semibold">{item.count} visita(s)</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No hay suficientes datos para generar un ranking.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(TopDomiciliosCard);
