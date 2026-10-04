"use client";
import { Box, Container, IconButton, Tab, Tabs } from "@mui/material";
import Link from "next/link";
import React, { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Fade } from "react-awesome-reveal";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import DisplayTasks from "./DisplayTasks";
import CompletedTasks from "./CompletedTasks";
import { useAuthSession } from "@/hooks";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 1 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

const TasksClient = () => {
  const { user } = useAuthSession();

  const roles = ["SUPER", "ADMIN"];


  const [state, setState] = useState({tab: 0})

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setState(prev => ({...prev, tab: newValue}));
  };

  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader title="Tasks" />
        {roles.includes(user.role) && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              position: "absolute",
              right: 10,
              top: 4,
            }}
          >
            <Fade delay={100} direction="left">
              <IconButton
                size="small"
                disableRipple
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: (theme) => theme.vars.palette.gradient.contrastText,
                  padding: 1,
                  marginBottom: 0,
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                  },
                }}
                LinkComponent={Link}
                href="/create-task"
              >
                <AddTaskOutlinedIcon />
              </IconButton>
            </Fade>
          </Box>
        )}
        <Box>
          <Box>
            <Tabs
              value={state.tab}
              onChange={handleTabChange}
              indicatorColor="secondary"
              textColor="inherit"
              variant="fullWidth"
              scrollButtons="auto"
              aria-label="Subscription plan tiers"
              centered={true}
            >
              <Tab key={0} label={"Tasks"} {...a11yProps(0)} />
              <Tab key={1} label={"Completed"} {...a11yProps(1)} />
            </Tabs>
          </Box>
          <TabPanel key={0} value={state.tab} index={0}>
            <DisplayTasks />
          </TabPanel>
          <TabPanel key={1} value={state.tab} index={1}>
            <CompletedTasks />
          </TabPanel>
        </Box>
      </Container>
    </Box>
  );
};

export default TasksClient;
