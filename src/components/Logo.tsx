import { BookOpen } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

const Logo = ({ size = "md", showText = true, className = "", textClassName = "" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon - Replace this with your custom logo */}
      <div className={`flex ${sizeClasses[size]} items-center justify-center rounded-lg bg-gradient-primary`}>
        {/* 
          TODO: Replace BookOpen with your custom logo
          Options:
          1. Replace with <img src="/your-logo.png" alt="Logo" className={iconSizes[size]} />
          2. Replace with your custom SVG component
          3. Keep the BookOpen icon but customize colors
        */}
        <BookOpen className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      
      {/* Brand Text - Replace "SwapLearnThrive" with your brand name */}
      {showText && (
        <span className={`${textSizes[size]} font-bold text-foreground ${textClassName}`}>
          SwapLearnThrive
        </span>
      )}
    </div>
  );
};

export default Logo;