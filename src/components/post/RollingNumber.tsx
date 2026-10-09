import { formatFeedNumber } from '@/utils';
import { Typography } from '@mui/material';
import { memo } from 'react';

// Counts must update in the same paint as the selected state, without waiting
// for an exit animation or being absolutely positioned over another control.
const RollingNumber = ({ number }: { number: number }) => (
  <Typography component="span" variant="caption" sx={{ color: 'text.secondary', display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>
    {formatFeedNumber(number)}
  </Typography>
);
export default memo(RollingNumber);
