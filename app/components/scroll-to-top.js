'use client';

import { useEffect, useState } from 'react';
import { LuArrowUp } from 'react-icons/lu';

const VISIBILITY_SCROLL_Y = 520;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [lifted, setLifted] = useState(false);

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

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      className={`scroll-top-button${visible ? ' is-visible' : ''}${lifted ? ' is-lifted' : ''}`}
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
