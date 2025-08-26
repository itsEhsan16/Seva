import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ServicePage from "./components/ServicePage";
import AuthPage from "./components/AuthPage";
import EmailVerificationPage from "./components/EmailVerificationPage";
import BookingPage from "./components/BookingPage";
import BookingHistory from "./components/BookingHistory";
import TransactionHistory from "./components/TransactionHistory";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancelled from "./components/PaymentCancelled";
import ProviderDashboard from "./components/ProviderDashboard";
import AdminDashboard from "./components/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/services/:category" element={<ServicePage />} />
              <Route path="/auth" element={<AuthPage onClose={() => window.history.back()} />} />
              <Route path="/auth/verify" element={<EmailVerificationPage />} />
              <Route path="/booking" element={<BookingPage onBack={() => window.history.back()} />} />
              <Route path="/booking-history" element={<BookingHistory />} />
              <Route path="/transaction-history" element={<TransactionHistory />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancelled" element={<PaymentCancelled />} />
              <Route path="/provider" element={<ProviderDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
