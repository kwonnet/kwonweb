'use client'

import * as React from "react";
const FlipCardBackSvgIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 300"
    width="120px"
    height="120px"
    {...props}
  >
    <defs>
      <linearGradient id="card-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop
          offset="0%"
          style={{
            stopColor: "#0f4c81",
            stopOpacity: 1,
          }}
        />
        <stop
          offset="100%"
          style={{
            stopColor: "#1e81b0",
            stopOpacity: 1,
          }}
        />
      </linearGradient>
      <pattern
        id="diamond-pattern"
        width={20}
        height={20}
        patternUnits="userSpaceOnUse"
      >
        <rect width={20} height={20} fill="none" />
        <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="#ffffff" opacity={0.2} />
      </pattern>
    </defs>
    <rect width={200} height={300} rx={15} ry={15} fill="url(#card-gradient)" />
    <rect
      x={10}
      y={10}
      width={180}
      height={280}
      rx={10}
      ry={10}
      fill="none"
      stroke="#ffffff"
      strokeWidth={2}
    />
    <rect x={15} y={15} width={170} height={270} fill="url(#diamond-pattern)" />
    <circle cx={100} cy={150} r={40} fill="#ffffff" />
    <circle cx={100} cy={150} r={36} fill="url(#card-gradient)" />
    <text
      x={100}
      y={160}
      fontSize={24}
      fill="#ffffff"
      fontFamily="Arial, sans-serif"
      fontWeight="bold"
      textAnchor="middle"
    >
      {"\n    \u2666\uFE0E\n  "}
    </text>
  </svg>
);
export default FlipCardBackSvgIcon;
