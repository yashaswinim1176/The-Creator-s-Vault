import React from "react";
import { cn } from "../../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

// Extend HTMLMotionProps instead of React.ButtonHTMLAttributes to support standard Framer Motion props seamlessly
export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref as any}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 450, damping: 14 }}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-vault-accent disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          {
            "bg-vault-accent text-black hover:bg-vault-accent-hover shadow-[0_0_15px_rgba(0,255,189,0.2)] hover:shadow-[0_0_25px_rgba(0,255,189,0.5)]": variant === "primary",
            "border border-vault-accent text-vault-accent bg-transparent hover:bg-vault-accent/10": variant === "outline",
            "hover:bg-vault-card text-white hover:text-vault-accent": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600": variant === "danger",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-12 px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      >
        <motion.span
          className="inline-flex items-center justify-center gap-2"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          {children}
        </motion.span>
      </motion.button>
    );
  }
);
Button.displayName = "Button";

