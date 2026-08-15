import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { GraduationCap, PlayCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrainingVideoCard from "@/components/training/TrainingVideoCard";

export default function Training() {
  const navigate = useNavigate();
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["trainingVideos"],
    queryFn: () => base44.entities.TrainingVideo.filter({ isActive: true }, "sortOrder"),
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Training</h1>
          <p className="text-sm text-muted-foreground">Video guides to help you get the most out of the platform.</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-card overflow-hidden">
              <div className="aspect-video bg-secondary/40 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-2/3 bg-secondary/40 rounded animate-pulse" />
                <div className="h-3 w-full bg-secondary/40 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/40 p-12 text-center">
          <PlayCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No training videos available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.map((v) => (
            <TrainingVideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}