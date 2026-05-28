/**
 * hoverStateUtilities.ts — React Hover State Utilities
 *
 * Provides:
 * - useHoverState hook for managing hover states
 * - useMagneticHover hook for cursor attraction effects
 * - useReducedMotion hook for accessibility
 * - Hover event handlers and props builders
 * - Performance-optimized hover utilities
 */

import { useState, useRef, useCallback, useEffect, createContext, useContext } from "react";
import React from "react";

/**
 * useHoverState — Simple hover state management
 * Returns [isHovered, handlers]
 */
export const useHoverState = (
  onHoverStart?: () => void,
  onHoverEnd?: () => void
) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHoverStart?.();
  }, [onHoverStart]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHoverEnd?.();
  }, [onHoverEnd]);

  const handlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };

  return { isHovered, handlers };
};

/**
 * useMagneticHover — Cursor-attracting magnetic effect
 * Creates subtle cursor-following behavior for CTAs
 *
 * Usage:
 * const { transform, handlers } = useMagneticHover(3);
 * <button style={{ transform }} {...handlers}>
 */
interface MagneticHoverOptions {
  maxDistance?: number;
  enabled?: boolean;
}

export const useMagneticHover = (options: MagneticHoverOptions = {}) => {
  const { maxDistance = 3, enabled = true } = options;
  const [transform, setTransform] = useState("translateY(-1px)");
  const elementRef = useRef<HTMLElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!enabled || !elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const distX = mouseX - centerX;
      const distY = mouseY - centerY;

      const distance = Math.sqrt(distX * distX + distY * distY);
      const maxDist = Math.max(rect.width, rect.height);

      if (distance < maxDist * 1.5) {
        const angle = Math.atan2(distY, distX);
        const moveX = Math.cos(angle) * (maxDistance / 2);
        const moveY = Math.sin(angle) * (maxDistance / 2);

        setTransform(
          `translate(${moveX}px, ${moveY}px) translateY(-1px)`
        );
      } else {
        setTransform("translateY(-1px)");
      }
    },
    [maxDistance, enabled]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("translateY(-1px)");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const element = elementRef.current;
    if (!element) return;

    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave, enabled]);

  return {
    ref: elementRef,
    transform,
    style: { transform, transition: "transform 80ms ease-out" },
  };
};

/**
 * useReducedMotion — Detect and respect prefers-reduced-motion
 * Returns true if user prefers reduced motion
 */
export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  return prefersReducedMotion;
};

/**
 * useHoverValue — Interpolate values based on hover state
 * Useful for dynamic opacity, color, or other CSS values
 */
export const useHoverValue = <T>(normalValue: T, hoverValue: T) => {
  const { isHovered, handlers } = useHoverState();
  return {
    value: isHovered ? hoverValue : normalValue,
    handlers,
  };
};

/**
 * buildHoverHandlers — Create consistent hover event handlers
 * Useful for custom components
 */
export const buildHoverHandlers = (callbacks?: {
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    onMouseEnter: () => {
      setIsHovered(true);
      callbacks?.onHoverStart?.();
    },
    onMouseLeave: () => {
      setIsHovered(false);
      callbacks?.onHoverEnd?.();
    },
    onTouchStart: () => {
      setIsHovered(true);
      callbacks?.onHoverStart?.();
    },
    onTouchEnd: () => {
      setIsHovered(false);
      callbacks?.onHoverEnd?.();
    },
  };
};

/**
 * createHoverStyleObject — Utility for creating inline hover styles
 * React doesn't support :hover in inline styles, so we need a workaround
 *
 * Usage in styled-components or with className:
 * const { normal, hover } = createHoverStyleObject(
 *   { background: 'blue' },
 *   { background: 'darkblue' }
 * );
 */
export const createHoverStyleObject = (
  normalStyle: Record<string, string | number>,
  hoverStyle: Record<string, string | number>
) => ({
  normal: normalStyle,
  hover: hoverStyle,
  combined: { ...normalStyle, ...hoverStyle },
});

/**
 * withHoverState — HOC-like utility for wrapping components with hover
 * Not a true HOC, but a function that injects hover props
 */
export const withHoverState = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { isHovered, handlers } = useHoverState();
    return <Component {...props} isHovered={isHovered} {...handlers} />;
  };
};

/**
 * useClickFeedback — Combines hover + click feedback
 * Returns state for visual feedback on interaction
 */
export const useClickFeedback = (
  onPress?: () => void,
  duration = 200
) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
    onPress?.();
  }, [onPress]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, duration);
  }, [duration]);

  return {
    isPressed,
    isHovered,
    isActive: isPressed || isHovered,
    handlers: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      onMouseDown: handleMouseDown,
      onMouseUp: handleMouseUp,
    },
  };
};

/**
 * useContainerHover — Track hover on parent container
 * Child elements can use context or ref to check if hovered
 */
export const useContainerHover = () => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  return {
    containerRef,
    isHovered,
    handlers: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    },
  };
};

/**
 * useActionReveal — Manage visibility of secondary actions on hover
 * Common pattern: action buttons appear on card/row hover
 */
export const useActionReveal = (disabled = false) => {
  const [showActions, setShowActions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowActions(true);
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setShowActions(false);
    }, 100);
  }, [disabled]);

  return {
    showActions,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    },
  };
};

/**
 * HoverContext and Provider for complex hover coordination
 * Useful when multiple elements need to share hover state
 */
export const HoverContext = createContext<{
  isHovered: boolean;
  setIsHovered: (value: boolean) => void;
}>({ isHovered: false, setIsHovered: () => {} });

export const useHoverContext = () => {
  const context = useContext(HoverContext);
  if (!context) {
    console.warn(
      "useHoverContext must be used within HoverProvider"
    );
  }
  return context;
};

export default {
  useHoverState,
  useMagneticHover,
  useReducedMotion,
  useHoverValue,
  buildHoverHandlers,
  createHoverStyleObject,
  withHoverState,
  useClickFeedback,
  useContainerHover,
  useActionReveal,
  HoverContext,
  useHoverContext,
};
