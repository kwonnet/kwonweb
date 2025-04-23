"use client";
import React, { useState, useRef, useEffect } from "react";
import cn from "classnames";
import {
  Cropper,
  CropperRef,
  CropperPreview,
  CropperPreviewRef,
} from "react-advanced-cropper";
import { AdjustablePreviewBackground } from "./components/AdjustablePreviewBackground";
import { Navigation } from "./components/Navigation";
import { AdjustableCropperBackground } from "./components/AdjustableCropperBackground";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import styles from "./imageEditor.module.css";
import "react-advanced-cropper/dist/style.css";
import { debounce as _debounce } from "lodash";
import { genUniqueRef } from "@/utils";

// The polyfill for Safari browser. The dynamic require is needed to work with SSR
if (typeof window !== "undefined") {
  require("context-filter-polyfill");
}

function dataURItoFile(dataURI: string, fileName: string): File {
  // Split the data URI into the base64 data and the content type
  const [header, base64Data] = dataURI.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png"; // Default to PNG if no MIME type is found

  // Ensure the fileName includes an extension, default to the MIME type's extension
  const fileExtension = mimeType.split("/")[1]; // e.g., 'png' from 'image/png'
  if (!fileName.includes(".")) {
    fileName += `.${fileExtension}`;
  }

  // Decode the base64 string into binary data
  const byteString = atob(base64Data);

  // Create a Uint8Array from the binary data
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  // Create and return a File object
  return new File([byteArray], fileName, { type: mimeType });
}

const ImageEditor = ({
  imgSrc,
  onSaveFile,
}: {
  imgSrc: string;
  onSaveFile: (file: File) => void;
}) => {
  const cropperRef = useRef<CropperRef>(null);
  const previewRef = useRef<CropperPreviewRef>(null);

  const [src, setSrc] = useState(imgSrc);

  const [mode, setMode] = useState("crop");

  const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({
    brightness: 0,
    hue: 0,
    saturation: 0,
    contrast: 0,
  });

  const onChangeValue = (value: number) => {
    if (mode in adjustments) {
      setAdjustments((previousValue) => ({
        ...previousValue,
        [mode]: value,
      }));
    }
  };

  const debounceModeChange = React.useRef(
    _debounce((val: number) => {
      onChangeValue(val);
    }, 300)
  ).current;

  useEffect(() => {
    return () => {
      debounceModeChange.cancel();
    };
  }, [debounceModeChange]);

  const onReset = () => {
    const changed = Object.values(adjustments).some((el) =>
      Math.floor(el * 100)
    );
    if (!changed) return;
    setMode("crop");
    setAdjustments({
      brightness: 0,
      hue: 0,
      saturation: 0,
      contrast: 0,
    });
  };

  const onDownload = () => {
    if (cropperRef.current) {
      const dataURI = cropperRef.current.getCanvas()?.toDataURL();
      if (!dataURI) return;
      const file = dataURItoFile(dataURI, `${genUniqueRef(14)}`);
      onSaveFile(file);
    }
  };

  const onUpdate = (cropper: CropperRef) => {
    previewRef.current?.update(cropper);
  };

  const onChange = (_mode: string) => {
    setMode(_mode);
  };

  const cropperEnabled = mode === "crop";

  return (
    <Box
      sx={([(theme) => ({
        color: "theme.palette.primary.main", // Replace with your theme color
        border: `1px solid ${theme.palette.divider}`,
        position: "relative",
        mb: 1,
      })])}
    >
      <Box
        sx={{
          // background: "#0f0e13",
          height: "auto",
          maxHeight: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Cropper
          src={src}
          ref={cropperRef}
          stencilProps={{
            movable: cropperEnabled,
            resizable: cropperEnabled,
            lines: cropperEnabled,
            handlers: cropperEnabled,
            overlayClassName: cn(
              styles.cropper_overlay,
              !cropperEnabled && `${styles.cropper_overlay_faded}`
            ),
          }}
          backgroundWrapperProps={{
            scaleImage: cropperEnabled,
            moveImage: cropperEnabled,
          }}
          backgroundComponent={AdjustableCropperBackground}
          backgroundProps={adjustments}
          onUpdate={onUpdate}
        />
      </Box>
      <Box sx={{ position: "relative" }}>
        <Box
          sx={{ position: "absolute", mt: -4, display: "block", width: "100%" }}
        >
          <Box sx={{ mx: 4 }}>
            {mode !== "crop" && (
              <Slider
                color="warning"
                size="small"
                value={adjustments[mode]}
                aria-label={mode}
                valueLabelDisplay="auto"
                onChange={(_ev, val, _thumb) => onChangeValue(Number(val))}
                sx={{ width: "100%" }}
              />
            )}
          </Box>
        </Box>
      </Box>
      <Navigation
        mode={mode}
        onChange={onChange}
        onDownload={onDownload}
        onReset={onReset}
      />
    </Box>
  );
};

export default ImageEditor;

// 'use client'
// import React, { useState, useRef, useEffect } from "react";
// import cn from "classnames";
// import {
//   Cropper,
//   CropperRef,
//   CropperPreview,
//   CropperPreviewRef,
// } from "react-advanced-cropper";
// import { AdjustablePreviewBackground } from "./components/AdjustablePreviewBackground";
// import { Navigation } from "./components/Navigation";
// import { AdjustableCropperBackground } from "./components/AdjustableCropperBackground";
// import { Box, IconButton, Slider, Typography } from "@mui/material";
// import styles from "./imageEditor.module.css"
// import 'react-advanced-cropper/dist/style.css'
// import { debounce as _debounce } from "lodash";

// // The polyfill for Safari browser. The dynamic require is needed to work with SSR
// if (typeof window !== "undefined") {
//   require("context-filter-polyfill");
// }

// const ImageEditor = ({ imgSrc }: { imgSrc: string }) => {
//   const cropperRef = useRef<CropperRef>(null);
//   const previewRef = useRef<CropperPreviewRef>(null);

//   const [src, setSrc] = useState(imgSrc);

//   const [mode, setMode] = useState("crop");

//   const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({
//     brightness: 0,
//     hue: 0,
//     saturation: 0,
//     contrast: 0,
//   });

//   const onChangeValue = (value: number) => {
//     if (mode in adjustments) {
//       setAdjustments((previousValue) => ({
//         ...previousValue,
//         [mode]: value,
//       }));
//     }
//   };

//   const debounceModeChange = React.useRef(
//     _debounce((val: number) => {
//         onChangeValue(val)
//     }, 300)
//   ).current;

//   useEffect(() => {
//     return () => {
//         debounceModeChange.cancel();
//     };
//   }, [debounceModeChange]);

//   const onReset = () => {
//     const changed = Object.values(adjustments).some((el) => Math.floor(el * 100));
//     if(!changed) return;
//     setMode("crop");
//     setAdjustments({
//       brightness: 0,
//       hue: 0,
//       saturation: 0,
//       contrast: 0,
//     });
//   };

//   const onDownload = () => {
//     if (cropperRef.current) {
//       const newTab = window.open();
//       if (newTab) {
//         newTab.document.body.innerHTML = `<img src="${cropperRef.current
//           .getCanvas()
//           ?.toDataURL()}"/>`;
//       }
//     }
//   };

//   const onUpdate = (cropper: CropperRef) => {
//     previewRef.current?.update(cropper);
//   };

//   const onChange = (_mode: string) => {
//     setMode(_mode)
//   }

//   const cropperEnabled = mode === "crop";

//   return (
//     <Box
//       sx={{
//         color: "theme.palette.primary.main", // Replace with your theme color
//         border: "1px solid #2b2a30",
//         position: "relative",
//         maxHeight: "100vh",
//         overflow: "hidden",
//       }}
//     >
//       <Box
//         sx={{
//           background: "#0f0e13",
//           height: "480px",
//           maxHeight: "100vh",
//           position: "relative",
//           overflow: "hidden",
//         }}
//       >
//         <Cropper
//           src={src}
//           ref={cropperRef}
//           stencilProps={{
//             movable: cropperEnabled,
//             resizable: cropperEnabled,
//             lines: cropperEnabled,
//             handlers: cropperEnabled,
//             overlayClassName:  cn(
//               styles.cropper_overlay,
//               !cropperEnabled && `${styles.cropper_overlay_faded}`
//             ),
//           }}
//           backgroundWrapperProps={{
//             scaleImage: cropperEnabled,
//             moveImage: cropperEnabled,
//           }}
//           backgroundComponent={AdjustableCropperBackground}
//           backgroundProps={adjustments}
//           onUpdate={onUpdate}
//         />
//       </Box>
//       <Box sx={{position: "relative", }}>
//         {/* <Box sx={{position: "absolute", mt: -15,}}>
//         <CropperPreview
//           style={{
//             height: "45px",
//             width: "45px",
//             background: "black",
//             border: "1px solid #2b2a30",
//             position: "absolute",
//             left: "20px",
//             top: "20px",
//             borderRadius: "50%",
//           }}
//           ref={previewRef}
//           backgroundComponent={AdjustablePreviewBackground}
//           backgroundProps={adjustments}
//         />
//         </Box> */}
//         <Box sx={{ position: "absolute", mt: -4, display: "block", width: "100%"}}>
//             <Box sx={{mx: 4}}>
//             {mode !== "crop" && (
//           <Slider
//             color="warning"
//             size="small"
//             value={adjustments[mode]}
//             aria-label={mode}
//             valueLabelDisplay="auto"
//             onChange={(_ev, val, _thumb) => onChangeValue(Number(val))}
//             sx={{width: "100%"}}
//           />
//         )}
//             </Box>
//         </Box>
//       </Box>
//       <Navigation
//         mode={mode}
//         onChange={onChange}
//         onDownload={onDownload}
//         onReset={onReset}
//       />
//     </Box>
//   );
// };

// export default ImageEditor;
