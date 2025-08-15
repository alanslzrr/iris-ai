"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SearchDialog() {
  return (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Search className="h-4 w-4" />
    </Button>
  );
} 