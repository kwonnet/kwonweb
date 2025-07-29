'use client'
import * as React from "react";
const FlipCardFrontSvgIcon = (props:{score: number | string} & React.SVGProps<SVGSVGElement>) => {
    const { score, ...rest } = props;
    return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 300"
          width="120px"
          height="120px"
          {...rest}
        >
          <rect width={200} height={300} rx={15} ry={15} fill="#ffffff" />
          <rect
            x={10}
            y={10}
            width={180}
            height={280}
            rx={10}
            ry={10}
            fill="none"
            stroke="#0f4c81"
            strokeWidth={2}
          />
          <g transform="translate(100,150)">
            <circle r={40} fill="#0f4c81" />
            <text
              x={0}
              y={6}
              fontSize={24}
              fill="#ffffff"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              textAnchor="middle"
            >
              {"\u2605"}
            </text>
          </g>
          <text
            x={20}
            y={40}
            fontSize={24}
            fill="#0f4c81"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            {score}
          </text>
          <text
            x={160}
            y={270}
            fontSize={24}
            fill="#0f4c81"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
            textAnchor="end"
          >
            {score}
          </text>
        </svg>
      )
};
export default FlipCardFrontSvgIcon;
