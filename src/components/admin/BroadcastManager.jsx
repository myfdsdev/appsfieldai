import React from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import BroadcastComposer from "./broadcast/BroadcastComposer";
import BroadcastList from "./broadcast/BroadcastList";

export default function BroadcastManager() {
  const queryClient = useQueryClient();
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <BroadcastComposer onSent={() => queryClient.invalidateQueries({ queryKey: ["adminBroadcasts"] })} />
      <BroadcastList />
    </motion.div>
  );
}