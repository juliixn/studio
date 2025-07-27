
"use client"

import { memo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BookText, Car, User as UserIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export type ActivityFeedItem = {
    id: string;
    type: 'vehicular' | 'pedestrian' | 'bitacora';
    date: string;
    text: string;
    subtext: string;
}

interface ActivityFeedProps {
    items: ActivityFeedItem[];
}

const iconMap = {
    vehicular: <Car className="h-4 w-4" />,
    pedestrian: <UserIcon className="h-4 w-4" />,
    bitacora: <BookText className="h-4 w-4" />,
}

function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimos eventos registrados en el sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {items.length > 0 ? items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        {iconMap[item.type]}
                    </div>
                    <div className="flex-grow">
                        <p className="text-sm font-medium">{item.text}</p>
                        <p className="text-xs text-muted-foreground">{item.subtext}</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">
                            {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                </div>
            )) : (
                <p className="text-sm text-center text-muted-foreground py-4">No hay actividad reciente.</p>
            )}
        </div>
      </CardContent>
    </Card>
  )
}

export default memo(ActivityFeed);
