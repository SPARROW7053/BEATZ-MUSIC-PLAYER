import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PlayerBar from './components/PlayerBar';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Library from './pages/Library';
import Login from './pages/Login';
import Profile from './pages/Profile';

const AnimatedRoutes = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  // Login page — full bleed without layout
  if (isLoginPage) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
        </Routes>
      </AnimatePresence>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#121318] text-white overflow-hidden relative font-sans">
      {/* ─── Premium Ambient Background Glows (Bloom Effects) ─── */}
      <div className="fixed top-0 right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-[1] animate-blob" />
      <div className="fixed bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-teal-600/5 rounded-full mix-blend-screen filter blur-[150px] pointer-events-none z-[1] animate-blob-delay-4" />
      <div className="fixed top-[50%] left-[60%] w-[400px] h-[400px] bg-[#ff9500]/5 rounded-full mix-blend-screen filter blur-[140px] pointer-events-none z-[1] animate-blob-delay-2" />

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 bottom-0 left-0 w-64 z-50 md:hidden"
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Section: Sidebar + Main Panel */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Sidebar (Desktop Only) with dynamic animated width */}
        <div className={`hidden md:block shrink-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>

        {/* Right Pane: Header + Scrollable Content */}
        <div className="flex-1 flex flex-col overflow-hidden px-8 pt-6 relative z-10">
          <Navbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main
            id="main-scroll-area"
            className="flex-1 overflow-y-auto premium-scrollbar select-none pb-6"
          >
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/library" element={<Library />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Persistent Bottom Player Bar */}
      <PlayerBar />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
