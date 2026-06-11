import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminIssueDetail from "./pages/AdminIssueDetail";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyIssues from "./pages/MyIssues";
import ReportIssue from "./pages/ReportIssue";
import IssueDetail from "./pages/IssueDetail";
import AdminDashboard from "./pages/AdminDashboard";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import EditIssue from "./pages/EditIssue";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/my-issues" element={<MyIssues />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/issue/:id" element={<IssueDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/issues/:id" element={<AdminIssueDetail />} />
            <Route path="/edit-issue/:id" element={<EditIssue />} />
            <Route path="/profile" element={<UserProfile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
