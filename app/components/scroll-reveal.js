'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL_SELECTOR = '[data-reveal]';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let observer;
    let frameId;

    const setupRevealObserver = () => {
      const revealElements = Array.from(document.querySelectorAll(REVEAL_SELECTOR));

      if (revealElements.length === 0) {
        return;
      }

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealElements.forEach((element) => {
          element.classList.add('is-revealed');
        });

        return;
      }

      observer = new IntersectionObserver(
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
        element.classList.remove('is-revealed');
        observer.observe(element);
      });
    };

    frameId = window.requestAnimationFrame(setupRevealObserver);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      if (observer) {
        observer.disconnect();
      }
    };
  }, [pathname]);

  return null;
}
