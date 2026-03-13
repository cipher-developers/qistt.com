"use client";

import type { MouseEventHandler } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EntityViewButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        "size-7 rounded-full border border-slate-200 bg-white text-slate-500 shadow-xs hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        className,
      )}
      onClick={onClick}
    >
      <Eye size={14} />
      <span className="sr-only">View {label}</span>
    </Button>
  );
}
