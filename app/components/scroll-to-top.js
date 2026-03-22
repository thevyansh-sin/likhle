'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LuArrowUp } from 'react-icons/lu';

const VISIBILITY_SCROLL_Y = 520;

export default function ScrollToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [lifted, setLifted] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 640 : false));
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > VISIBILITY_SCROLL_Y);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const footerTargets = document.querySelectorAll('footer, .footer, .info-footer');

    if (footerTargets.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setLifted(entries.some((entry) => entry.isIntersecting));
      },
      {
        rootMargin: '0px 0px 20px 0px',
        threshold: 0.1,
      }
    );

    footerTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const handleChange = (event) => {
      setIsMobile(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    if (pathname !== '/generate' || typeof window === 'undefined' || !isMobile) {
      return undefined;
    }

    let intersectionObserver;
    let resetFrame = null;

    const connectHideTargets = () => {
      intersectionObserver?.disconnect();

      const hideTargets = document.querySelectorAll('[data-scroll-top-hide-zone]');

      if (hideTargets.length === 0) {
        if (resetFrame !== null) {
          cancelAnimationFrame(resetFrame);
        }

        resetFrame = window.requestAnimationFrame(() => {
          setBlocked(false);
          resetFrame = null;
        });
        return;
      }

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          setBlocked(entries.some((entry) => entry.isIntersecting));
        },
        {
          threshold: 0.18,
        }
      );

      hideTargets.forEach((target) => intersectionObserver.observe(target));
    };

    connectHideTargets();

    const mutationObserver = new MutationObserver(() => {
      connectHideTargets();
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      intersectionObserver?.disconnect();
      mutationObserver.disconnect();
      if (resetFrame !== null) {
        cancelAnimationFrame(resetFrame);
      }
    };
  }, [isMobile, pathname]);

  const hideWhileGenerateResultsVisible = pathname === '/generate' && isMobile && blocked;

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      className={`scroll-top-button${visible && !hideWhileGenerateResultsVisible ? ' is-visible' : ''}${lifted ? ' is-lifted' : ''}`}
      onClick={handleClick}
    >
      <span className="scroll-top-orbit" aria-hidden="true" />
      <span className="scroll-top-icon-wrap" aria-hidden="true">
        <LuArrowUp size={18} />
      </span>
      <span className="scroll-top-label">Back to top</span>
    </button>
  );
}
