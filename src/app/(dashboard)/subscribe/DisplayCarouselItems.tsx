"use client";
import {
  CryptoAddress,
  SubscriptionPlan,
} from "@/types";
import {
  Box,
} from "@mui/material";
import React from "react";
import Carousel from "react-multi-carousel";
import DisplayPlanItem from "./DisplayPlanItem";
import 'react-multi-carousel/lib/styles.css';


const DisplayCarouselItems = ({plans, tonRate, cryptoAddreses}:{ plans: SubscriptionPlan[]; tonRate: number; cryptoAddreses: CryptoAddress[]}) => {
    return (
      <Box>
        <Carousel
          arrows
          autoPlay={false}
          autoPlaySpeed={1000}
          className=""
          containerClass="container-with-dots"
          customTransition="all 1s linear"
          centerMode={false}
          dotListClass=""
          draggable
          focusOnSelect={false}
          infinite
          itemClass=""
          keyBoardControl
          minimumTouchDrag={80}
          pauseOnHover
          renderArrowsWhenDisabled={false}
          renderButtonGroupOutside={false}
          renderDotsOutside={false}
          responsive={{
            desktop: {
              breakpoint: {
                max: 3000,
                min: 1024,
              },
              items: 3,
              partialVisibilityGutter: 0,
              slidesToSlide: 3,
              
            },
            tablet: {
              breakpoint: {
                max: 1024,
                min: 464,
              },
              items: 3,
              partialVisibilityGutter: 30,
              slidesToSlide: 2,
            },
            mobile: {
              breakpoint: {
                max: 464,
                min: 0,
              },
              items: 1,
              partialVisibilityGutter: 30,
              slidesToSlide: 1,
            },
          }}
          partialVisible={true}
          removeArrowOnDeviceType={["desktop", "tablet", "mobile"]}
          rewind={false}
          rewindWithAnimation={false}
          rtl={false}
          shouldResetAutoplay
          showDots={false}
          sliderClass=""
          swipeable
          // slidesToSlide={1}
          transitionDuration={1000}
          // additionalTransfrom={-32 * 3}
        >
          {plans.map((item) => (
            <DisplayPlanItem
              key={item.id}
              plan={item}
              tonRate={tonRate}
              cryptoAddreses={cryptoAddreses}
            />
          ))}
        </Carousel>
      </Box>
    );
  };

  export default DisplayCarouselItems
  