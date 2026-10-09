"use client";
import { AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography, useColorScheme, useTheme } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { constant } from "@/config";
import { getNavigationItems } from "@/providers/navigation";
import CustomThemeSwitcher from "@/components/common/CustomThemeSwitcher";

export default function CustomLayout({ children, CustomToolbar }: { children: ReactNode; CustomToolbar: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? 64 : 240;
  const navigation = getNavigationItems(session?.user);
  const { mode } = useColorScheme();
  const sidebar = (mini: boolean) => (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflowX: "hidden" }}>
      <List aria-label="Main navigation" sx={{ px: 1, flex: 1 }}>
        {navigation.map((item, index) => {
          if (item.kind === "divider") return <Divider key={`divider-${index}`} sx={{ my: 1 }} />;
          if (item.segment === "#") return <Box key="theme" sx={{ px: 1 }}><CustomThemeSwitcher compact={mini} /></Box>;
          const href = `/${item.segment}`;
          const selected = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`) && !item.segment.startsWith("@"));
          return <Tooltip key={href} title={mini ? item.title : ""} placement="right">
            <ListItemButton component={Link} href={href} selected={selected} aria-current={selected ? "page" : undefined}
              aria-label={item.title} onClick={() => setMobileOpen(false)} sx={{ borderRadius: 1, minHeight: 48, mb: 0.5, px: 1.5 }}>
              <ListItemIcon sx={{ minWidth: mini ? 24 : 40, color: selected ? "primary.main" : "inherit" }}>{item.icon}</ListItemIcon>
              {!mini && <ListItemText primary={item.title} sx={{ whiteSpace: "nowrap", color: selected ? "primary.main" : "inherit" }} />}
            </ListItemButton>
          </Tooltip>;
        })}
      </List>
      {!mini && <Box component="footer" sx={{textAlign: "center", p: 2}}>
        <Box sx={{display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 1, mb: 1, fontSize: 12, '& a': {color: "text.secondary"}}}>
          <Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-of-service">Terms of Service</Link>
        </Box>
        <Typography variant="caption">© {constant.siteName} {new Date().getFullYear()}</Typography>
      </Box>}
    </Box>
  );
  return <Box sx={{ display: "flex", height: "100dvh", overflow: "hidden" }}>
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ zIndex: theme => theme.zIndex.drawer + 1, borderBottom: 1, borderColor: "divider" }}>
      <Toolbar sx={{ minHeight: "64px !important", gap: 1 }}>
        <IconButton aria-label="Open navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(value => !value)} sx={{ display: { md: "none" } }}><MenuIcon /></IconButton>
        <IconButton aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)} sx={{ display: { xs: "none", md: "inline-flex" } }}><MenuOpenIcon /></IconButton>
        <Link href="/" aria-label={`${constant.siteName} home`} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 44, minHeight: 44, flexShrink: 0 }}><Image src={mode === "light" ? "/logo-grey-320x320.png" : "/logo-white-320x320.png"} alt="" width={25} height={25} sizes="25px" style={{ display: "block" }} /></Link>
        <Box sx={{ flex: 1, display: {xs: 'block', lg: 'none'} }} />
        {CustomToolbar}
      </Toolbar>
    </AppBar>
    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { md: "none" } }}
      slotProps={{ paper: { sx: { width: 240, pt: "64px" } } }}>{sidebar(false)}</Drawer>
    <Drawer variant="permanent" sx={{ width, flexShrink: 0, display: { xs: "none", md: "block" } }}
      slotProps={{ paper: { sx: { width, top: 64, height: "calc(100dvh - 64px)" } } }}>{sidebar(collapsed)}</Drawer>
    <Box component="main" id="main-content" sx={{ flex: 1, minWidth: 0, mt: "64px", overflowY: pathname.startsWith("/messages") ? "hidden" : "auto", overflowX: "hidden" }}>
      <Box sx={{ maxWidth: pathname === "/tasks" ? "none" : 1200, mx: "auto", px: { xs: 0, md: 2 }, pb: { xs: pathname.startsWith("/messages") ? 0 : 7, md: 0 } }}>{children}</Box>
    </Box>
  </Box>;
}
