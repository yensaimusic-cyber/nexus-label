
import React from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isPlaying?: boolean;
  color?: string;
  bars?: number;
}

export const Waveform: React.FC<WaveformProps> = ({ isPlaying = false, color = '#8B5CF6', bars = 40 }) => {
  return (
    <div className="flex items-center gap-0.5 h-16 w-full px-2">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ height: '10%' }}
          animate={{ 
            height: isPlaying ? [`${Math.random() * 80 + 20}%`, `${Math.random() * 80 + 20}%`, `${Math.random() * 80 + 20}%`] : '20%'
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 0.5 + Math.random() * 0.5,
            ease: "easeInOut"
          }}
          style={{ backgroundColor: color }}
          className="flex-1 min-w-[2px] rounded-full opacity-60"
        />
      ))}
    </div>
  );
};
