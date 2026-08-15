import React, { useState } from "react";
import { PlayCircle, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { getYouTubeId } from "@/lib/youtube";
import MinimalYouTubePlayer from "@/components/MinimalYouTubePlayer";

export default function TrainingVideoCard({ video }) {
  const [open, setOpen] = useState(false);
  const id = getYouTubeId(video.videoUrl);

  return (
    <>
      <div className="rounded-2xl border border-border/30 bg-card overflow-hidden flex flex-col">
        <button
          type="button"
          onClick={() => id && setOpen(true)}
          className="relative aspect-video bg-black w-full group"
        >
          {id ? (
            <>
              <img
                src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                alt={video.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition-colors">
                <span className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                  <Play className="w-7 h-7 text-white ml-0.5" fill="currentColor" />
                </span>
              </span>
            </>
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
              <PlayCircle className="w-10 h-10" />
            </span>
          )}
        </button>
        <div className="p-4 flex-1">
          <h3 className="font-semibold text-foreground">{video.name}</h3>
          {video.description && <p className="text-sm text-muted-foreground mt-1">{video.description}</p>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden bg-black border-border/30">
          {open && id && <MinimalYouTubePlayer url={video.videoUrl} autoplay />}
          <div className="p-4 bg-card">
            <h3 className="font-semibold text-foreground">{video.name}</h3>
            {video.description && <p className="text-sm text-muted-foreground mt-1">{video.description}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}