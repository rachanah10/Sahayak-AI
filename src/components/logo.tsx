import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
    >
      {/* Top-left yellow element */}
      <path d="M 10,40 A 30 30 0 0 1 40 10 L 10 10 Z" className="fill-[#FBBF24]" />

      {/* Left red-orange element */}
      <path d="M 20,50 L 45,65 L 45,35 Z" className="fill-accent" />

      {/* Right green element */}
      <circle cx="85" cy="50" r="10" className="fill-[#34D399]" />
      
      {/* Bottom light-blue element */}
      <rect x="30" y="80" width="50" height="15" rx="5" className="fill-[#60A5FA]" />
      
      {/* "S" shape */}
      <text 
        x="50%" 
        y="55%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontSize="50" 
        fontWeight="bold" 
        className="fill-primary font-headline"
      >
        S
      </text>
    </svg>
  );
}
