'use client'
import { createTheme } from "@mui/material";
declare module "@mui/material/styles" {
  interface Palette {
    // Palette['primary']
    gradient: {
      contrastText: string;
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
      B900: string;
      C900: string;
      D900: string;
      E900: string;


    };
    shades: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
    };
    tints: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
      
    };
  }

  interface PaletteOptions {
    gradient?: {
      contrastText: string;
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
      B900: string;
      C900: string;
      D900: string;
      E900: string;
    };
    shades: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
    };
    tints: {
      "100": string;
      "200": string;
      "300": string;
      "400": string;
      "500": string;
      "600": string;
      "700": string;
      "800": string;
      "900": string;
      A900: string;
    };
  }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        
    }
  }

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    
  }
}

// Extend the color property of IconButtonProps
declare module '@mui/material/IconButton' {
    interface IconButtonPropsColorOverrides {
        gradient: true;
    }
  }

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }
  // allow configuration using `createTheme()`
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

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
          // background: {
          //   default: '#F9F9FE',
          //   paper: '#EEEEF9',
          // },
          // primary: {
          //   main: "#031d37",
          //   contrastText: "#fff",
          // },
          // secondary: {
          //   main: "#17385c",
          //   contrastText: "#fff",
          // },
          shades: {
            "100": "#031a32",
            "200": "#02172c",
            "300": "#021427",
            "400": "#021121",
            "500": "#020f1c",
            "600": "#010c16",
            "700": "#010910",
            "800": "#01060b",
            "900": "#000305",
            A900: "#000000",
          },
          tints: {
            "100": "#2e4c6c",
            "200": "#45607d",
            "300": "#5d748d",
            "400": "#74889d",
            "500": "#8b9cae",
            "600": "#a2afbe",
            "700": "#b9c3ce",
            "800": "#d1d7de",
            "900": "#e8ebef",
            A900: "#ffffff",
          },
          gradient: {
            contrastText: "#fff",

            "100": "linear-gradient(145deg, #031d37, #06304d)",

            "200":
              "linear-gradient(135deg, rgba(3, 37, 71, 1) 0%, rgba(34, 89, 145, 1) 100%)",
            "300":
              "linear-gradient(135deg, rgba(3, 37, 71, 1) 0%, rgba(0, 0, 0, 1) 100%)",

            "400":
              "linear-gradient(145deg, #031d37 0%, #092c53 50%, #1e5169 100%)",

            "500": "linear-gradient(145deg, #031d37 0%, #1c4464 70%)",

            "600": "linear-gradient(145deg, #031d37 0%, #0a3e54 80%)",

            "700": "linear-gradient(145deg, #031d37 0%, #1e5169 100%)",

            "800": "linear-gradient(145deg, #031d37 0%, #341d56 100%)",

            "900": "linear-gradient(145deg, #031d37 0%, #27675b 100%)",

            A900: "linear-gradient(145deg, #031d37 0%, #27675b 100%)",

            B900: "linear-gradient(145deg, #031d37 0%, #533c52 100%)",

            C900: "linear1: `background: hsla(225, 62%, 10%, 1); background: linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);background: -moz-linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);background: -webkit-linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);filter: progid: DXImageTransform.Microsoft.gradient( startColorstr='#0A122A', endColorstr='#5460F9', GradientType=1 )`",
            D900: "linear-gradient(45deg, #031d37, #044b7f)",
            E900: "linear-gradient(135deg, #031d37 30%, #044b7f 90%)"
          },
        },
      },
      dark: {
        palette: {
          // primary: {
          //   main: "#031d37",
          //   contrastText: "#fff",
          // },
          // secondary: {
          //   main: "#17385c",
          //   contrastText: "#fff",
          // },
          background: {
            default: '#111111',
            paper: '#131313',
            
          },
          shades: {
            "100": "#031a32",
            "200": "#02172c",
            "300": "#021427",
            "400": "#021121",
            "500": "#020f1c",
            "600": "#010c16",
            "700": "#010910",
            "800": "#01060b",
            "900": "#000305",
            A900: "#000000",
          },
          tints: {
            "100": "#2e4c6c",
            "200": "#45607d",
            "300": "#5d748d",
            "400": "#74889d",
            "500": "#8b9cae",
            "600": "#a2afbe",
            "700": "#b9c3ce",
            "800": "#d1d7de",
            "900": "#e8ebef",
            A900: "#ffffff",
          },
          gradient: {
            contrastText: "rgba(255,255,255,0.8)",

            "100": "linear-gradient(145deg, #07111c, #07111c)",

            "200": "linear-gradient(135deg, #0c1c2e 0%, #0c1c2e 100%)",

            "300": "linear-gradient(135deg, #07111c 0%, #07111c 100%)",

            "400":
              "linear-gradient(145deg, #031d37 0%, #092c53 50%, #1e5169 100%)",

            "500": "linear-gradient(145deg, #031d37 0%, #1c4464 70%)",

            "600": "linear-gradient(145deg, #031d37 0%, #0a3e54 80%)",

            "700": "linear-gradient(145deg, #031d37 0%, #1e5169 100%)",

            "800": "linear-gradient(145deg, #031d37 0%, #341d56 100%)",

            "900": "linear-gradient(145deg, #031d37 0%, #27675b 100%)",

            A900: "linear-gradient(145deg, #031d37 0%, #27675b 100%)",

            B900: "linear-gradient(145deg, #031d37 0%, #533c52 100%)",

            C900: "linear1: `background: hsla(225, 62%, 10%, 1); background: linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);background: -moz-linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);background: -webkit-linear-gradient(90deg, hsla(225, 62%, 10%, 1) 0%, hsla(236, 93%, 65%, 1) 100%);filter: progid: DXImageTransform.Microsoft.gradient( startColorstr='#0A122A', endColorstr='#5460F9', GradientType=1 )`",
            D900: "linear-gradient(45deg, #031d37, #044b7f)",
            E900: "linear-gradient(135deg, #031d37 30%, #044b7f 90%)"
          },
        },
      },
    },
    // colorSchemes: {
    //   light: {
    //     palette: {
    //       background: {
    //         default: '#F9F9FE',
    //         paper: '#EEEEF9',
    //       }
    //     },
    //   },
    //   dark: {
    //     palette: {
    //       background: {
    //         default: '#111111',
    //         paper: '#131313',
            
    //       },
    //     },
    //   },
    // },
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