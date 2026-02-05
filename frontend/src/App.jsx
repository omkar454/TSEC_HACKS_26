import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateCampaign from './pages/CreateCampaign';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CampaignDetails from './pages/CampaignDetails';
import CreatorDashboard from './pages/CreatorDashboard';
import Profile from './pages/Profile';
import Wallet from './pages/Wallet';
import AdminDashboard from './pages/AdminDashboard';
import AdminExpenses from './pages/AdminExpenses';
import { useAuth } from './context/AuthContext';
import FinternetMonitor from './components/FinternetMonitor';
import LandingPage from './pages/LandingPage';
import BackgroundEffects from './components/BackgroundEffects';

const App = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isLandingPage = pathname === '/';

  return (
    <div className={isLandingPage ? "relative min-h-screen bg-[#13131a]" : "relative sm:-8 p-4 bg-[var(--background)] min-h-screen flex flex-row transition-colors duration-300"}>
      <BackgroundEffects />
      {!isLandingPage && (
        <div className="sm:flex hidden mr-10 relative">
          <Sidebar />
        </div>
      )}

      <div className={isLandingPage ? "w-full" : "flex-1 max-sm:w-full max-w-[1280px] mx-auto sm:pr-5"}>
        <Navbar />

        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/explore" />} />
          <Route path="/explore" element={<Home />} />
          <Route path="/create-campaign" element={user ? <CreateCampaign /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
          <Route path="/dashboard" element={user ? <CreatorDashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'ADMIN' ? <AdminDashboard /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} />
          <Route path="/admin/expenses" element={user && user.role === 'ADMIN' ? <AdminExpenses /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} />
          <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
        </Routes>
      </div>
      <FinternetMonitor />
    </div>
  )
}

export default App
