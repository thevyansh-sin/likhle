'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REVEAL_SELECTOR = '[data-reveal]';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    let observer;
    let mutationObserver;
    let frameId;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const observedElements = new WeakSet();

    const observeRevealElement = (element) => {
      if (!(element instanceof HTMLElement) || observedElements.has(element)) {
        return;
      }

      observedElements.add(element);

      if (reducedMotion) {
        element.classList.remove('is-reveal-pending');
        element.classList.add('is-revealed');
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const startsInView = rect.top < viewportHeight * 0.92 && rect.bottom > 0;

      if (startsInView) {
        element.classList.remove('is-reveal-pending');
        element.classList.add('is-revealed');
        return;
      }

      element.classList.remove('is-revealed');
      element.classList.add('is-reveal-pending');
      observer.observe(element);
    };

    const observeRevealTree = (root) => {
      if (!(root instanceof HTMLElement || root instanceof Document)) {
        return;
      }

      if (root instanceof HTMLElement && root.matches(REVEAL_SELECTOR)) {
        observeRevealElement(root);
      }

      root.querySelectorAll?.(REVEAL_SELECTOR).forEach((element) => {
        observeRevealElement(element);
      });
    };

    const setupRevealObserver = () => {
      if (!reducedMotion) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                return;
              }

              entry.target.classList.remove('is-reveal-pending');
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            });
          },
          {
            rootMargin: '0px 0px -8% 0px',
            threshold: 0.12,
          }
        );
      }

      observeRevealTree(document);

      mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              observeRevealTree(node);
            }
          });
        });
      });

      if (document.body) {
        mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    };

    frameId = window.requestAnimationFrame(setupRevealObserver);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      if (observer) {
        observer.disconnect();
      }

      if (mutationObserver) {
        mutationObserver.disconnect();
      }
    };
  }, [pathname]);

  return null;
}
