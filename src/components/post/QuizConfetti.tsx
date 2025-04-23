'use client';

import { useEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizConfetti({ trigger }: { trigger: boolean }) {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, []);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            <Confetti
              width={dimensions.width}
              height={dimensions.height}
              numberOfPieces={300}
              recycle={false}
              confettiSource={{
                x: 0,
                y: 0,
                w: dimensions.width,
                h: 0,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
