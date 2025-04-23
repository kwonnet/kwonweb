import { formatFeedNumber } from '@/utils';
import { Typography } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react'


    
const RollingNumber = ({ number }: { number: number }) => {
    return (
      <Typography variant="caption" style={{ display: "block" }}>
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={number}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "inline-block",
              position: "absolute",
              top: 6,
            }}
          >
            {formatFeedNumber(number)}
          </motion.span>
        </AnimatePresence>
      </Typography>
    );
}

export default RollingNumber