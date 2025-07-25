import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      <path
        fill="currentColor"
        d="M140,40 L130,50 L110,50 L120,40 Z"
      />
      <path
        fill="currentColor"
        d="M130,50 L110,50 L110,60 L130,60 Z"
      />
      <path
        fill="currentColor"
        d="M120,30 L110,40 L120,40 L130,30 Z"
      />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="40" fontWeight="bold" fill="currentColor">
        SAHAYAK
      </text>
    </svg>
  );
}
