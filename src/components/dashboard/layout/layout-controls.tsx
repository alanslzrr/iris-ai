"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LayoutControls() {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Settings className="h-4 w-4" />
    </Button>
  );
} 