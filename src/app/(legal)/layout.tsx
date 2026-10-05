import type {ReactNode} from "react";
import Link from "next/link";
import {Box, Container, Divider, Stack, Typography} from "@mui/material";

export default function LegalLayout({children}: {children: ReactNode}) {
  return <Box sx={{minHeight: "100dvh", bgcolor: "background.default", color: "text.primary"}}>
    <Box component="header" sx={{borderBottom: 1, borderColor: "divider"}}>
      <Container maxWidth="md" sx={{py: 2}}>
        <Stack direction="row" sx={{alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap"}}>
          <Link href="/" style={{textDecoration: "none"}}><Typography variant="h5" sx={{fontWeight: 700, color: "primary.main"}}>Kwonnet</Typography></Link>
          <Box component="nav" aria-label="Legal navigation" sx={{display: "flex", gap: 2, flexWrap: "wrap", '& a': {color: "primary.main", textUnderlineOffset: "4px"}}}>
            <Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-of-service">Terms of Service</Link>
          </Box>
        </Stack>
      </Container>
    </Box>
    <Container component="main" maxWidth="md" sx={{py: {xs: 3, md: 5}, '& h1': {fontSize: {xs: "2rem", md: "2.75rem"}, lineHeight: 1.2, mb: 1}, '& h2': {fontSize: "1.25rem", mt: 4, mb: 1}, '& p, & li': {lineHeight: 1.8}, '& p': {mb: 2}, '& ul': {pl: 3, mb: 2}, '& a': {color: "primary.main", textUnderlineOffset: "4px"}}}>
      {children}
    </Container>
    <Container component="footer" maxWidth="md" sx={{pb: 3}}><Divider sx={{mb: 2}} />
      <Stack direction="row" sx={{justifyContent: "space-between", gap: 2, flexWrap: "wrap"}}>
        <Typography variant="body2" color="text.secondary">Kwonnet · Social connections, conversations, and games</Typography>
        <Link href="/">Back to Kwonnet</Link>
      </Stack>
    </Container>
  </Box>;
}
