'use client'
 
import { incrementLike } from '@/app/server-actions-example/actions'
import { useState } from 'react'
import { Button } from '@/components/ui/button';
import { ThumbsUp } from 'lucide-react';
 
export default function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isPending, setIsPending] = useState(false);
 
  const handleClick = async () => {
    setIsPending(true);
    const updatedLikes = await incrementLike();
    setLikes(updatedLikes);
    setIsPending(false);
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleClick}
        disabled={isPending}
      >
        <ThumbsUp className="mr-2 h-4 w-4"/>
        Like
      </Button>
      <p className="text-lg font-semibold tabular-nums">{likes}</p>
    </>
  )
}
