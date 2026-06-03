// Refresh HMR
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrderProvider } from "@/context/OrderContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

import Admin from "./pages/Admin";
import Balcao from "./pages/Balcao";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OrderProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

            <Route path="/admin" element={<Admin />} />
            <Route path="/balcao" element={<Balcao />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </OrderProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
