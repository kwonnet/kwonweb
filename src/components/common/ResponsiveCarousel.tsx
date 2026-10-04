"use client";
import { Box, useMediaQuery } from "@mui/material";
import { Children, type ReactNode } from "react";
import Slider from "react-slick";

// Reuse the slider already used by feed media. The previous carousel package
// installed the npm CLI (and its vulnerable bundled dependencies) at runtime.
export default function ResponsiveCarousel({ children, desktopItems, tabletItems, centerMode = false, arrows = true, hideMobileArrows = false }: {
  children: ReactNode;
  desktopItems: number;
  tabletItems: number;
  centerMode?: boolean;
  arrows?: boolean;
  hideMobileArrows?: boolean;
}) {
  // react-slick's responsive listener only handles changes, not the initial
  // matching viewport. MUI also evaluates the current match after hydration.
  const mobile = useMediaQuery("(max-width: 464px)");
  const tablet = useMediaQuery("(max-width: 1024px)");
  const count = Children.count(children);
  if (!count) return null;
  const settingsFor = (items: number) => ({
    slidesToShow: Math.min(count, items),
    slidesToScroll: 1,
    infinite: count > items,
    centerMode: centerMode && count > items,
  });
  return <Box sx={{ minWidth: 0, "& .slick-prev": { left: 4, zIndex: 1 }, "& .slick-next": { right: 4, zIndex: 1 }, "& .slick-prev:before, & .slick-next:before": { color: "text.primary" }, "& .slick-slide > div": { px: 0.5 } }}>
    <Slider {...settingsFor(mobile ? 1 : tablet ? tabletItems : desktopItems)}
      arrows={arrows && !(mobile && hideMobileArrows)} autoplay={false} dots={false}
      speed={500} accessibility swipeToSlide centerPadding="24px">
      {children}
    </Slider>
  </Box>;
}
