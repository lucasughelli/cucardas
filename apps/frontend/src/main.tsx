import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./shared/errors/ErrorBoundary";
import { installGlobalErrorReporting } from "./shared/errors/reportError";
import "./shared/theme/theme.css";
// Inicializa el tema (lee localStorage y aplica data-theme) en el arranque, en cualquier página.
import "./shared/theme/themeStore";

installGlobalErrorReporting();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15_000 } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
