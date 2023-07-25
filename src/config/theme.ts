import { createTheme } from "@mui/material";

export const Theme = createTheme({
  palette: {
    // primary: {main: "#2196F3"},
    // secondary: {main: "#0069B5"},
    error: {main: "#ff0000"},
    info: {main: "#8ab4f8"},
  },
  typography: {
    "fontFamily": `"Barlow", "Montserrat", "Helvetica", "Arial", sans-serif`,
    "fontSize": 14,
    "fontWeightLight": 300,
    "fontWeightRegular": 400,
    "fontWeightMedium": 600,
    "fontWeightBold": 700,
    button: {
      textTransform: 'none'
    }
  },
});
