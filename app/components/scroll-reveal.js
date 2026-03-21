'use client';

import { useEffect } from 'react';

const REVEAL_SELECTOR = '[data-reveal]';

export default function ScrollReveal() {
  useEffect(() => {
    const revealElements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));

    if (revealElements.length === 0) {
      return undefined;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach((element) => {
        element.classList.add('is-revealed');
      });

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12,
      }
    );

    revealElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
