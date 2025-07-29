"use client";
import { Box, Button, CardMedia, Paper } from "@mui/material";
import {
  closePaymentModal,
  useFlutterwave,
  FlutterWaveButton,
} from "flutterwave-react-v3";
import React, { ReactNode, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuthSession } from "@/hooks";
import { purchaseCoins } from "@/lib/coins";
import { CoinPackage } from "@/types";
import { getErrorMessage } from "@/utils";
import { getFlutterWaveCoinConfig } from "@/utils/payment";
import { FlutterWaveResponse } from "flutterwave-react-v3/dist/types";
import axios from "axios";
import { axiosAPI } from "@/config/axios";
// import { openLink } from "@telegram-apps/sdk-react";
// import { axiosAPI } from "@/config";

type IState = {
  isOpen: boolean;
  loading: boolean;
};

type IProps = {
  title: string;
  item: CoinPackage;
};

export interface CoinPaymentProps {
  amount: number;
  packageId: string;
  [key: string]: any;
}

const FlutterwaveCoinPayBtn = ({ item, title }: IProps) => {

  const amount = parseFloat((item.price * 0.013).toFixed(2));

  const [state, setState] = React.useState<IState>({
    isOpen: false,
    loading: false,
  });

  const { user, token } = useAuthSession();

  const config = getFlutterWaveCoinConfig(user, item);

  const getPaymentLink = async() => {
    try {
        setState(prev => ({...prev, loading: true}))
        axiosAPI.accessToken = token
        const response = await axiosAPI.post('/payments/link',config)
        const link = response.data
        // openLink(link);
    } catch (error: any) {
        toast.error(error.message)
    }finally{
        setState(prev => ({...prev, loading: false}))
    }
  }

  if (amount < 1 || amount > 1000) return null;

  return (
    <>
      <Box sx={{ textAlign: "center" }}>
      <Button
          sx={{
            p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
            fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
            borderRadius: 1,
          }}
          onClick={(ev) => getPaymentLink()}
          variant="contained"
          size="small"
          color="warning"
          fullWidth
          endIcon={
            <CardMedia
              image="/flutterwave2.png"
              sx={{ height: 12, width: 12 }}
            />
          }
          disabled={state.loading}
          loading={state.loading}
        >
          {title} ${amount}
        </Button>
      </Box>
    </>
  );
};

export default FlutterwaveCoinPayBtn;




// "use client";
// import { Box, Button, CardMedia, Paper } from "@mui/material";
// import {
//   closePaymentModal,
//   useFlutterwave,
//   FlutterWaveButton,
// } from "flutterwave-react-v3";
// import React, { ReactNode, useCallback, useEffect } from "react";
// import { toast } from "react-toastify";
// import { useAuth } from "@/hooks";
// import { purchaseCoins } from "@/lib/coins";
// import { CoinCurrencyEnum, CoinPackage } from "@/types";
// import { getErrorMessage } from "@/utils";
// import { getFlutterWaveCoinConfig } from "@/utils/payment";
// import { FlutterWaveResponse } from "flutterwave-react-v3/dist/types";
// import axios from "axios";
// import { openLink } from "@telegram-apps/sdk-react";
// import { axiosAPI } from "@/config";

// type IState = {
//   isOpen: boolean;
//   isCompleted: boolean;
// };

// type IProps = {
//   title: string;
//   item: CoinPackage;
// };

// export interface CoinPaymentProps {
//   amount: number;
//   packageId: string;
//   [key: string]: any;
// }

// function generateInputFields(data: any, parentKey = "") {
//   const inputs: ReactNode[] = [];

//   for (const key in data) {
//     if (data.hasOwnProperty(key)) {
//       const value = data[key];
//       const inputName = parentKey ? `${parentKey}[${key}]` : key;

//       if (typeof value === "object" && value !== null) {
//         // Recursively handle nested objects
//         inputs.push(...generateInputFields(value, inputName));
//       } else {
//         // Create the input field for a primitive value
//         inputs.push(
//           <input type="hidden" name={`${inputName}`} value={`${value}`} />
//         );
//       }
//     }
//   }

//   return inputs;
// }
// const FlutterwaveCoinPayBtn = ({ item, title }: IProps) => {
//   const amount = parseFloat((item.price * 0.013).toFixed(2));

//   const [state, setState] = React.useState<IState>({
//     isOpen: false,
//     isCompleted: false,
//   });

//   const { user, token } = useAuth();

//   const paymentCallback = async (response: FlutterWaveResponse) => {
//     try {
//       const result = await purchaseCoins(
//         {
//           packageId: item.id,
//           currency: CoinCurrencyEnum.FIAT,
//           meta: { ...response, isFlw: true },
//         },
//         token
//       );
//       if (result.data) return toast.success(result.message);
//       toast.error(result.message);
//     } catch (error) {
//       toast.error(getErrorMessage(error));
//     }
//   };

//   const flutterwavePayment = useCallback(
//     () => {
//       const config = getFlutterWaveCoinConfig(user, item);
//       // eslint-disable-next-line
//       return useFlutterwave(config);
//     },
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     []
//   );

//   const toggleModal = () => {
//     setState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
//   };

//   const triggerPayment = () => {
//     const handleFlutterPayment = flutterwavePayment();
//     return handleFlutterPayment({
//       callback: (res) => {
//         setState((prev) => ({ ...prev, isCompleted: true }));
//         toast.info(
//           "Transaction completed, your wallet will be credited shortly. Thank you!",
//           { position: "top-right" }
//         );
//         paymentCallback({ ...res });
//         closePaymentModal();
//         toggleModal();
//       },
//       onClose: () => {
//         toggleModal();
//       },
//     });
//   };

//   if (amount < 1 || amount > 1000) return null;

//   //   test button payment

//   const config = getFlutterWaveCoinConfig(user, item);
//   const fwConfig = {
//     ...config,
//     text: `${title} $${amount}`,
//     callback: (response: FlutterWaveResponse) => {
//       console.log(response);
//       closePaymentModal(); // this will close the modal programmatically
//     },
//     onClose: () => {},
//   };

//   const inputFields = generateInputFields(config);

//   const getPaymentLink = async() => {
//     try {
//         const response = await axiosAPI.post('/payments/link',config)
//         const link = response.data
//         openLink(link);
//     } catch (error: any) {
//         console.log(error)
//         toast.error(error.message)
//     }
//   }

 

//   return (
//     <>
//       <Box sx={{ textAlign: "center" }}>
//       <Button
//           sx={{
//             p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
//             fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
//             borderRadius: 1,
//           }}
//           onClick={(ev) => getPaymentLink()}
//           variant="contained"
//           size="small"
//           color="warning"
//           fullWidth
//           endIcon={
//             <CardMedia
//               image="/flutterwave2.png"
//               sx={{ height: 12, width: 12 }}
//             />
//           }
//           disabled={state.isCompleted}
//         >
//           {title} ${amount}
//         </Button>
//         {/* <FlutterWaveButton {...fwConfig} /> */}
//         {/* <Button
//           sx={{
//             p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
//             fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
//             borderRadius: 1,
//           }}
//           onClick={(ev) => triggerPayment()}
//           variant="contained"
//           size="small"
//           color="warning"
//           fullWidth
//           endIcon={
//             <CardMedia
//               image="/flutterwave2.png"
//               sx={{ height: 12, width: 12 }}
//             />
//           }
//           disabled={state.isCompleted}
//         >
//           {title} ${amount}
//         </Button> */}

//         {/* <form
//           method="POST"
//           action="https://checkout.flutterwave.com/v3/hosted/pay"
//         >
//           {inputFields.map((field, index) => (<React.Fragment key={index}>{field}</React.Fragment>))}
//           <Button
//             sx={{
//               p: { lg: 0.5, md: 0.5, sm: 0.5, xs: 0.5 },
//               fontSize: { lg: 12, md: 12, sm: 12, xs: 12 },
//               borderRadius: 1,
//             }}
//             variant="contained"
//             size="small"
//             color="warning"
//             fullWidth
//             endIcon={
//               <CardMedia
//                 image="/flutterwave2.png"
//                 sx={{ height: 12, width: 12 }}
//               />
//             }
//             type="submit"
//           >
//             {title} ${amount}
//           </Button>
//         </form> */}
//       </Box>
//     </>
//   );
// };

// export default FlutterwaveCoinPayBtn;
