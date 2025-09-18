import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './App';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { AuthProvider } from './components/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { SettingsLayout } from './pages/settings/SettingsLayout';
export function AppRouter() {
  return <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard>
                <App />
              </AuthGuard>} />
          <Route path="/profile" element={<AuthGuard>
                <Profile />
              </AuthGuard>} />
          <Route path="/settings" element={<AuthGuard>
                <SettingsLayout />
              </AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>;
}