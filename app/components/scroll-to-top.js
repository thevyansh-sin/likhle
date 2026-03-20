'use client';

import { useEffect, useState } from 'react';
import { LuArrowUp } from 'react-icons/lu';

const VISIBILITY_SCROLL_Y = 520;

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

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

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Scroll back to top"
      className={`scroll-top-button${visible ? ' is-visible' : ''}`}
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
