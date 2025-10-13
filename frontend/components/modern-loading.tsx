"use client";

import { cn } from "@/lib/utils";

interface ModernLoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function ModernLoading({ size = "md", className, text = "Loading..." }: ModernLoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Outer ring */}
        <div className={cn(
          "rounded-full border-4 border-muted animate-spin",
          sizeClasses[size]
        )} style={{ animationDuration: "1s" }}>
        </div>
        
        {/* Inner ring */}
        <div className={cn(
          "absolute top-0 left-0 rounded-full border-4 border-transparent border-t-primary animate-spin",
          sizeClasses[size]
        )} style={{ animationDuration: "0.5s" }}>
        </div>
        
        {/* Center dot */}
        <div className={cn(
          "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary animate-pulse",
          size === "sm" ? "h-1 w-1" : size === "md" ? "h-2 w-2" : "h-3 w-3"
        )}>
        </div>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card-modern p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-muted rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-4/5"></div>
          <div className="h-4 bg-muted rounded w-3/5"></div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="card-modern">
      <div className="p-6 border-b border-border">
        <div className="h-6 bg-muted rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/6 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-1/5 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
