"use client";
import { CoinPackage, CryptoAddress } from "@/types";
import { PageHeader } from "@/components/common";
import { Box, Container, IconButton } from "@mui/material";
import React from "react";
import { BuyCoinsContainer } from "@/components/store";
import Link from "next/link";
import WalletIcon from "@mui/icons-material/WalletOutlined";

const PageClient = ({
  data,
  currentTonRate,
}: {
  data: { packages: CoinPackage[]; addresses: CryptoAddress[] };
  currentTonRate: number;
}) => {
  return (
    <Box>
      <Container maxWidth="xl">
        <PageHeader
          title="Buy Coins"
          RightIcon={
            <Box>
              <Link href="/wallet">
                <IconButton>
                  <WalletIcon />
                </IconButton>
              </Link>
            </Box>
          }
        />
        <Box sx={{ pt: 2 }}>
          <BuyCoinsContainer data={data} currentTonRate={currentTonRate} />
        </Box>
      </Container>
    </Box>
  );
};

export default PageClient;
