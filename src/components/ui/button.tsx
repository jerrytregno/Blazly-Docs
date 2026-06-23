import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "gradient" | "dark";
  size?: "sm" | "md" | "lg";
}

const variants = {
  default:
    "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700",
  gradient:
    "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25 hover:from-indigo-700 hover:to-indigo-600",
  dark: "bg-slate-900 text-white shadow-sm hover:bg-slate-800",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  outline: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = {
  sm: "h-8 px-3.5 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-11 px-6 text-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
