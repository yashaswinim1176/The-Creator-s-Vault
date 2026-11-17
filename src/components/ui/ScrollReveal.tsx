import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  delay?: number; // Delay in milliseconds
  threshold?: number; // Trigger threshold (0.0 to 1.0)
  className?: string;
}

/**
 * ScrollReveal Wrapper Component
 * Automatically fades and slides up its children when they scroll into perspective.
 * Utilizes the lightweight high-performance IntersectionObserver API.
 */
export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.1,
  className = "",
  ...props
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add delay if specified
          if (delay > 0) {
            setTimeout(() => {
              setIsRevealed(true);
            }, delay);
          } else {
            setIsRevealed(true);
          }
          
          // Unobserve once triggered for better performance
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -50px 0px", // Trigger slightly before the item hits the viewport edge for better feel
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [delay, threshold]);

  return (
    <div
      ref={elementRef}
      className={`reveal ${isRevealed ? "reveal-active" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Global Scroll Reveal Hook
 * Automatically scans and observes any element on the screen with the ".reveal" class.
 * Extremely modular - just add class="reveal" to any HTML element and it will animate!
 */
export function useScrollRevealGlobal(threshold = 0.05) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Element entered viewport! Add class to trigger CSS hardware acceleration
            entry.target.classList.add("reveal-active");
            
            // Once animated, stop observing this element
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px", // Animates slightly before entering for buttery feel
      }
    );

    // Scan all elements that have the 'reveal' class
    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => {
      // If already has active class, don't observe
      if (!el.classList.contains("reveal-active")) {
        observer.observe(el);
      }
    });

    return () => {
      elements.forEach((el) => {
        observer.unobserve(el);
      });
    };
  }); // Keep observer active when components or layouts re-render
}
