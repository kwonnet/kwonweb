'use client'
import { createTheme } from "@mui/material";

const theme = createTheme({
    cssVariables: {
      colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'capitalize',
          },
        },
      },
    },
    colorSchemes: {
      light: {
        palette: {
          background: {
            default: '#F9F9FE',
            paper: '#EEEEF9',
          }
        },
      },
      dark: {
        palette: {
          background: {
            default: '#111111',
            paper: '#131313',
            
          },
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 600,
        lg: 1200,
        xl: 1536,
      },
    },
  });

export default theme