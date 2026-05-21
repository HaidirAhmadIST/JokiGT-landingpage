"use client";

import React from "react";
import { PriorityAlert } from "./PriorityAlert";
import { RecentActivities } from "./RecentActivities";

interface SidePanelProps {
  userRole: "Super Admin" | "Admin Serikat" | "Staff";
}

export function SidePanel({ userRole }: SidePanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <PriorityAlert />
      
      {/* CONDITIONAL RENDERING: Hanya Super Admin yang bisa melihat log aktivitas */}
      {userRole === "Super Admin" && <RecentActivities />}
    </div>
  );
}
