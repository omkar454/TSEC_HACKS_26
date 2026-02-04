import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
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
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user } = useAuth();

  return (
    <div className="relative sm:-8 p-4 bg-[var(--background)] min-h-screen flex flex-row transition-colors duration-300">
      <div className="sm:flex hidden mr-10 relative">
        <Sidebar />
      </div>

      <div className="flex-1 max-sm:w-full max-w-[1280px] mx-auto sm:pr-5">
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-campaign" element={user ? <CreateCampaign /> : <Navigate to="/login" />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
          <Route path="/dashboard" element={user ? <CreatorDashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user && user.role === 'ADMIN' ? <AdminDashboard /> : (user ? <Navigate to="/" /> : <Navigate to="/login" />)} />
          <Route path="/wallet" element={user ? <Wallet /> : <Navigate to="/login" />} />
          <Route path="/campaign-details/:id" element={<CampaignDetails />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
