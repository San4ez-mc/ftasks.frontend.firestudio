
'use client';

import { useState, useEffect } from 'react';
import type { Step } from '@/types/process';

type Arrow = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type ProcessArrowsProps = {
  allSteps: Step[];
  containerRef: React.RefObject<HTMLElement>;
};

export default function ProcessArrows({ allSteps, containerRef }: ProcessArrowsProps) {
  const [arrows, setArrows] = useState<Arrow[]>([]);

  useEffect(() => {
    const calculateArrows = () => {
      if (!containerRef.current) return;

      const newArrows: Arrow[] = [];
      const stepElements: Map<string, HTMLElement> = new Map();
      allSteps.forEach(step => {
        const el = document.getElementById(`step-${step.id}`);
        if (el) {
          stepElements.set(step.id, el);
        }
      });

      const sortedSteps = [...allSteps].sort((a, b) => a.order - b.order);

      for (let i = 0; i < sortedSteps.length - 1; i++) {
        const currentStep = sortedSteps[i];
        const nextStep = sortedSteps[i + 1];

        const fromEl = stepElements.get(currentStep.id);
        const toEl = stepElements.get(nextStep.id);

        if (fromEl && toEl) {
          const fromRect = fromEl.getBoundingClientRect();
          const toRect = toEl.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          
          const x1 = fromRect.right - containerRect.left;
          const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
          const x2 = toRect.left - containerRect.left;
          const y2 = toRect.top + toRect.height / 2 - containerRect.top;

          newArrows.push({ x1, y1, x2, y2 });
        }
      }
      setArrows(newArrows);
    };

    calculateArrows();
    const resizeObserver = new ResizeObserver(calculateArrows);
    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    
    // Recalculate on scroll as well
    const mainContent = containerRef.current;
    mainContent?.addEventListener('scroll', calculateArrows);

    return () => {
      resizeObserver.disconnect();
      mainContent?.removeEventListener('scroll', calculateArrows);
    };
  }, [allSteps, containerRef]);

  return (
    <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{ width: containerRef.current?.scrollWidth, height: containerRef.current?.scrollHeight }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="0"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
      {arrows.map((arrow, index) => (
         <path
            key={index}
            d={`M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`}
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            fill="none"
            markerEnd="url(#arrowhead)"
         />
      ))}
    </svg>
  );
}

    