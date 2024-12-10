import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/700.css";
import { createTheme, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./style.css";
import { shadcnTheme } from "./theme";

const theme = createTheme({
  fontFamily: "Geist Sans, sans-serif",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <App />
    </MantineProvider>
  </React.StrictMode>
);
