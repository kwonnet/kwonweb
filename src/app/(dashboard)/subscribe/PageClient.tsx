"use client";
import { CryptoAddress, SubscriptionPlan, UserTypeEnum } from "@/types";
import PageHeader from "@/components/common/PageHeader";
import { Box, Button, Container, Typography } from "@mui/material";
import React, { useState } from "react";
import DisplayCarouselItems from "./DisplayCarouselItems";
import { useAuthSession } from "@/hooks";
import { useCurrentAuthUser } from "@/lib/swrHooks";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

function ScrollableTabsButtonAuto({
  onTabCallback,
}: {
  onTabCallback?: (userType: UserTypeEnum) => void;
}) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    onTabCallback &&
      onTabCallback(
        newValue === 0
          ? UserTypeEnum.PERSONAL
          : newValue === 1
            ? UserTypeEnum.BUSINESS
            : UserTypeEnum.GOVERNMENT
      );
  };

  return (
    <Box sx={{ bgcolor: "background.paper", my: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        // variant="scrollable"
        // scrollButtons="auto"
        aria-label="scrollable auto tabs example"
        // centered={true}
        sx={{ justifyContent: "space-between", width: "100%" }}

      >
        <Tab label="Personal" />
        <Tab label="Business" />
        <Tab label="Government" />
      </Tabs>
    </Box>
  );
}

const PageClient = ({
  plans,
  tonRate,
  cryptoAddreses,
}: {
  plans: SubscriptionPlan[];
  tonRate: number;
  cryptoAddreses: CryptoAddress[];
}) => {
  const { token, user } = useAuthSession();

  // const  { data: user } = useCurrentAuthUser(token)

  // const subPlans = plans.filter((item) => item.accountType === user?.userType);

  const [selectedUserType, setSelectedUserType] = useState<UserTypeEnum>(user?.userType);

  const onTabCallback = (userType: UserTypeEnum) => {
    setSelectedUserType(userType);
  };

  const subPlans = plans.filter(
    (item) => item.accountType === selectedUserType
  );

  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="Upgrade Account" />
        <Box sx={{}}>
          {plans.length === 0 && (
            <Typography>No premium plans yet! </Typography>
          )}
          <ScrollableTabsButtonAuto onTabCallback={onTabCallback} />
          <Box>
            <DisplayCarouselItems
              plans={subPlans}
              cryptoAddreses={cryptoAddreses}
              tonRate={tonRate}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;

// <Paper
//                     onClick={() => handlePlanSelection(PlanTypeEnum.YEARLY)}
//                     elevation={getElevation(PlanTypeEnum.YEARLY)}
//                     sx={{
//                       p: 2,
//                       cursor: "pointer",
//                       border: (theme) =>
//                         getBorder(
//                           PlanTypeEnum.YEARLY,
//                           theme.vars.palette.info.light
//                         ),
//                     }}
//                   >
//                     <Stack
//                       spacing={1}
//                       direction={"row"}
//                       sx={{ alignItems: "center" }}
//                     >
//                       <Typography
//                         sx={{ fontFamily: "PlayFair" }}
//                         variant="subtitle1"
//                       >
//                         Annual Plan{" "}
//                       </Typography>
//                       <Chip
//                         size="small"
//                         color="info"
//                         label={`Save ${plan.discount * 100}%`}
//                       />
//                     </Stack>
//                     <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
//                       ${(plan.price * (1 - plan.discount)).toFixed(2)} / month{" "}
//                     </Typography>
//                     <Typography
//                       sx={{ fontFamily: "PlayFair" }}
//                       variant="caption"
//                     >
//                       ${(plan.price * (1 - plan.discount) * 12).toFixed(2)} per
//                       year, billed annually{" "}
//                     </Typography>
//                   </Paper>
//                   <Paper
//                     onClick={() => handlePlanSelection(PlanTypeEnum.MONTHLY)}
//                     elevation={getElevation(PlanTypeEnum.MONTHLY)}
//                     sx={{
//                       p: 2,
//                       cursor: "pointer",
//                       mt: 1,
//                       border: (theme) =>
//                         getBorder(
//                           PlanTypeEnum.MONTHLY,
//                           theme.vars.palette.info.light
//                         ),
//                     }}
//                   >
//                     <Stack
//                       spacing={1}
//                       direction={"row"}
//                       sx={{ alignItems: "center" }}
//                     >
//                       <Typography
//                         sx={{ fontFamily: "PlayFair" }}
//                         variant="subtitle1"
//                       >
//                         Monthly Plan{" "}
//                       </Typography>
//                     </Stack>
//                     <Typography sx={{ fontFamily: "PlayFair" }} variant="h6">
//                       ${plan.price.toFixed(2)} / month{" "}
//                     </Typography>
//                     <Typography
//                       sx={{ fontFamily: "PlayFair" }}
//                       variant="caption"
//                     >
//                       ${(plan.price * 12).toFixed(2)} per year, billed monthly{" "}
//                     </Typography>
//                   </Paper>
//                   <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
//                     <FormControlLabel
//                       control={
//                         <Switch
//                           checked={state.isRecurring}
//                           onChange={handleChange}
//                           color="warning"
//                           inputProps={{ "aria-label": "controlled" }}
//                         />
//                       }
//                       label="Recurring"
//                     />
//                   </Box>
//                   <Typography
//                     sx={{ fontFamily: "PlayFair", py: 1, textAlign: "center" }}
//                     variant="h5"
//                   >
//                     Subscribe & Pay{" "}
//                   </Typography>
//                   <Box>
//                     <Grid container spacing={2}>
//                       <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
//                         <LoadingButton
//                           size="small"
//                           variant="outlined"
//                           color="success"
//                           onClick={() => {}}
//                           disabled={state.isLoading}
//                           loading={state.isLoading}
//                           sx={{
//                             p: 2,
//                             width: "100%",
//                             // fontSize: { lg: 12, md: 12, sm: 8, xs: 8 },
//                             // borderRadius: 30,
//                           }}
//                         >
//                           ${formatNumberWithCommas(state.amount)}
//                         </LoadingButton>
//                       </Grid>

//                       <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
//                         <LoadingButton
//                           size="small"
//                           variant="outlined"
//                           color="primary"
//                           onClick={(ev) =>
//                             handleWalletPurchase(
//                               ev,
//                               parseFloat((state.amount / 0.013).toFixed(2))
//                             )
//                           }
//                           disabled={state.isLoading}
//                           loading={state.isLoading}
//                           sx={{
//                             p: 2,
//                             width: "100%",
//                             // fontSize: { lg: 12, md: 12, sm: 8, xs: 8 },
//                             // borderRadius: 30,
//                           }}
//                         >
//                           {formatNumberWithCommas(state.amount / 0.013)} TZX
//                         </LoadingButton>
//                       </Grid>
//                       <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
//                         <LoadingButton
//                           size="small"
//                           variant="outlined"
//                           color="error"
//                           onClick={(ev) =>
//                             handleTonPurchase(
//                               ev,
//                               parseFloat((state.amount / tonRate).toFixed(2))
//                             )
//                           }
//                           disabled={state.isLoading}
//                           loading={state.isLoading}
//                           sx={{
//                             p: 2,
//                             width: "100%",
//                             // fontSize: { lg: 12, md: 12, sm: 8, xs: 8 },
//                             // borderRadius: 30,
//                           }}
//                         >
//                           {formatNumberWithCommas(state.amount / tonRate)} TON
//                         </LoadingButton>
//                       </Grid>
//                       <Grid size={{ lg: 6, md: 6, sm: 6, xs: 6 }}>
//                         <LoadingButton
//                           size="small"
//                           variant="outlined"
//                           color="warning"
//                           onClick={() => {}}
//                           disabled={state.isLoading}
//                           loading={state.isLoading}
//                           sx={{
//                             p: 2,
//                             width: "100%",
//                             // fontSize: { lg: 12, md: 12, sm: 8, xs: 8 },
//                             // borderRadius: 30,
//                           }}
//                         >
//                           {formatNumberWithCommas(state.amount / 0.013)} ⭐️
//                         </LoadingButton>
//                       </Grid>
//                     </Grid>
//                   </Box>
