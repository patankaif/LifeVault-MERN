import React from 'react';
import { Route, Switch } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import ForgotPassword from '@/pages/ForgotPassword';
import Dashboard from '@/pages/Dashboard';
import PresentVault from '@/pages/PresentVault';
import FutureVault from '@/pages/FutureVault';
import DeathVault from '@/pages/DeathVault';
import SharedVault from '@/pages/SharedVault';
import ConfirmAlive from '@/pages/ConfirmAlive';
import Profile from '@/pages/Profile';
import SlotDetail from '@/pages/SlotDetail';
import NotFound from '@/pages/NotFound';

function Router() {
  console.log('[App Router] Current path:', window.location.pathname);
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/present-vault" component={PresentVault} />
      <Route path="/future-vault" component={FutureVault} />
      <Route path="/death-vault" component={DeathVault} />
      <Route path="/slots/:id" component={SlotDetail} />
      <Route path="/schedule-slot/:token" component={SharedVault} />
      <Route path="/shared-vault/:token" component={SharedVault} />
      <Route path="/confirm-alive/:token" component={ConfirmAlive} />
      <Route path="/profile" component={Profile} />
      <Route path="/404" component={NotFound} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
