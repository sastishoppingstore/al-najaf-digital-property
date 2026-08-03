import { useEffect, useRef, useState } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  variant?: 'up' | 'scale' | 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useScrollReveal<HTMLDivElement>();
  const variantClass = {
    up: 'reveal',
    scale: 'reveal-scale',
    left: 'reveal-left',
    right: 'reveal-right',
  }[variant];
  const delayClass = delay > 0 ? `delay-${delay}` : '';

  return (
    <div ref={ref} className={`${variantClass} ${delayClass} ${inView ? 'in-view' : ''} ${className}`}>
      {children}
    </div>
  );
}
