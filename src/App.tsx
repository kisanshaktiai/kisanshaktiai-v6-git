
import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/context/TenantContext";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<div>Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <Toaster />
            </div>
          </Router>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
