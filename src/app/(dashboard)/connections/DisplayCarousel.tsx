"use client";
import {
  Box,
} from "@mui/material";
import React from "react";
import Carousel from "react-multi-carousel";
import 'react-multi-carousel/lib/styles.css';
import { FollowAction, UserConnection } from "@/types/user";
import ConnectionCard from "./ConnectionCard";


const DisplayCarousel = ({items, onFollowUser}:{ items: UserConnection[];onFollowUser: (connUser: UserConnection, action: FollowAction) => void}) => {
  if(items.length === 0) return null
    return (
      <Box className="conn-carousel">
        <Carousel
          arrows={true}
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
              items: 4,
              partialVisibilityGutter: 30,
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
          removeArrowOnDeviceType={["tablet", "mobile"]}
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
          {items.map((item) => (
            <ConnectionCard 
              key={item.id} 
              item={item} 
              onFollowUser= {onFollowUser}
              />
          ))}
        </Carousel>
      </Box>
    );
  };

  export default DisplayCarousel
  