"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import clsx from "clsx";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "outline" | "ghost" | "inverse";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-fluid-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-60";

    const variants: Record<string, string> = {
      primary: "bg-ink text-canvas hover:bg-pigment-terracotta",
      outline: "border border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
      ghost: "text-ink hover:text-pigment-terracotta",
      // For buttons sitting on a dark/photo background (e.g. the hero) —
      // "primary" would put dark text on a dark hover/base pairing that
      // reads fine on the plain canvas background but disappears here.
      inverse: "bg-canvas text-ink hover:bg-pigment-terracotta hover:text-canvas",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className={clsx(base, variants[variant], className)}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
