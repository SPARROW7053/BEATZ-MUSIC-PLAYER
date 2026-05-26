import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * AudioVisualizer — simulated bars that dance on play.
 * @param {boolean} isPlaying
 * @param {number}  barCount    — number of bars (default 32)
 * @param {string}  className   — additional classes for the container
 * @param {'sm'|'md'|'lg'} size — preset height variants
 */
const AudioVisualizer = ({ isPlaying, barCount = 32, className = '', size = 'md' }) => {
  const heights = {
    sm: 24,
    md: 48,
    lg: 80,
  };
  const maxH = heights[size] ?? 48;

  // Pre-generate random config for each bar so they stay stable across renders
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        id: i,
        baseHeight: Math.random() * 0.3 + 0.1,  // resting height fraction
        peakHeight: Math.random() * 0.7 + 0.3,  // peak height fraction
        duration: Math.random() * 0.6 + 0.4,    // animation duration (s)
        delay: Math.random() * 0.5,              // stagger delay (s)
      })),
    [barCount]
  );

  return (
    <div
      className={`flex items-end gap-px ${className}`}
      style={{ height: maxH }}
      aria-label={isPlaying ? 'Audio visualizer playing' : 'Audio visualizer paused'}
    >
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="flex-1 rounded-full origin-bottom"
          style={{
            background: `linear-gradient(to top, #00f3ff, #b026ff)`,
            minWidth: 2,
          }}
          animate={{
            scaleY: isPlaying
              ? [bar.baseHeight, bar.peakHeight, bar.baseHeight * 1.5, bar.baseHeight]
              : [bar.baseHeight, bar.baseHeight],
            opacity: isPlaying ? [0.6, 1, 0.7, 0.6] : 0.2,
          }}
          transition={{
            duration: isPlaying ? bar.duration : 0.4,
            repeat: Infinity,
            repeatType: 'loop',
            delay: isPlaying ? bar.delay : 0,
            ease: 'easeInOut',
          }}
          initial={{ scaleY: bar.baseHeight, opacity: 0.2 }}
        />
      ))}
    </div>
  );
};

export default AudioVisualizer;
