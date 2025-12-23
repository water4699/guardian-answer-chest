import { BookOpen, Lock } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div className="relative">
        <BookOpen className="w-8 h-8 text-primary" strokeWidth={2} />
        <Lock className="w-4 h-4 text-secure absolute -bottom-1 -right-1 animate-lock-glow" />
      </div>
      <span className="text-2xl font-bold text-primary">
        ExamVault
      </span>
    </div>
  );
};
