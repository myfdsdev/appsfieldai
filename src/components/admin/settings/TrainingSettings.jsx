import React, { useState, useEffect } from "react";
import { GraduationCap, Plus, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <Label className="text-sm text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default function TrainingSettings() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const rows = await base44.entities.TrainingVideo.list("sortOrder");
      setVideos(rows);
    } catch { /* none yet */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addVideo = async () => {
    const created = await base44.entities.TrainingVideo.create({
      name: "New Training Video",
      description: "",
      videoUrl: "",
      sortOrder: videos.length,
      isActive: true,
    });
    setVideos((v) => [...v, created]);
  };

  const updateField = (id, field, value) => {
    setVideos((v) => v.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  };

  const saveVideo = async (video) => {
    setSavingId(video.id);
    try {
      await base44.entities.TrainingVideo.update(video.id, {
        name: video.name,
        description: video.description,
        videoUrl: video.videoUrl,
        sortOrder: Number(video.sortOrder) || 0,
        isActive: video.isActive,
      });
      toast.success("Training video saved.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteVideo = async (id) => {
    await base44.entities.TrainingVideo.delete(id);
    setVideos((v) => v.filter((x) => x.id !== id));
    toast.success("Training video deleted.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Training Videos</h2>
            <p className="text-sm text-muted-foreground">Manage the videos shown in the Training menu</p>
          </div>
        </div>
        <Button onClick={addVideo} className="bg-orange-500 hover:bg-orange-600 text-white h-9">
          <Plus className="w-4 h-4 mr-1.5" /> Add Video
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/40 p-8 text-center text-sm text-muted-foreground">
          No training videos yet. Click "Add Video" to create one.
        </div>
      ) : (
        <div className="space-y-5">
          {videos.map((video) => (
            <div key={video.id} className="rounded-xl border border-border/30 bg-secondary/20 p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Name">
                  <Input
                    value={video.name || ""}
                    onChange={(e) => updateField(video.id, "name", e.target.value)}
                    className="h-10 bg-secondary/40 border-border/50"
                  />
                </Field>
                <Field label="YouTube Video Link">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={video.videoUrl || ""}
                    onChange={(e) => updateField(video.id, "videoUrl", e.target.value)}
                    className="h-10 bg-secondary/40 border-border/50"
                  />
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  value={video.description || ""}
                  onChange={(e) => updateField(video.id, "description", e.target.value)}
                  className="bg-secondary/40 border-border/50 min-h-[70px]"
                />
              </Field>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Order</Label>
                    <Input
                      type="number"
                      value={video.sortOrder ?? 0}
                      onChange={(e) => updateField(video.id, "sortOrder", e.target.value)}
                      className="h-9 w-20 bg-secondary/40 border-border/50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Active</Label>
                    <Switch checked={video.isActive} onCheckedChange={(c) => updateField(video.id, "isActive", c)} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-9 text-red-400 border-red-400/30 hover:bg-red-500/10"
                    onClick={() => deleteVideo(video.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => saveVideo(video)}
                    disabled={savingId === video.id}
                    className="bg-orange-500 hover:bg-orange-600 text-white h-9 px-5"
                  >
                    <Save className="w-4 h-4 mr-1.5" />
                    {savingId === video.id ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}