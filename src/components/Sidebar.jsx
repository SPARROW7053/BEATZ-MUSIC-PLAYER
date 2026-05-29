import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, Users, ChevronDown, ChevronUp, LogOut, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ collapsed, setCollapsed, onClose }) => {
  const { currentUser, logout } = useAuth();
  const [playlistsExpanded, setPlaylistsExpanded] = useState(true);

  // Custom Playlists matching the image
  const playlists = [
    { name: 'Vibes & Chill', cover: '/covers/waves_of_time.png' },
    { name: 'Morning Boost', cover: '/covers/electric_dreams.png' },
    { name: 'Rhythm & Energy', cover: '/covers/echoes_of_midnight.png' },
  ];

  return (
    <aside 
      className={`bg-[#17181f] text-gray-400 flex flex-col h-full border-r border-white/5 overflow-visible shrink-0 relative transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Desktop Toggle Button (floating half-way over right border) */}
      {setCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute top-9 -right-3.5 w-7 h-7 rounded-full bg-[#17181f] border border-white/10 hover:border-white/20 text-gray-400 hover:text-white items-center justify-center shadow-lg transition-all z-50 cursor-pointer active:scale-90"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Brand Logo */}
      <div className={`flex items-center gap-3 pt-8 pb-7 ${collapsed ? 'justify-center px-0' : 'px-7'}`}>
        {/* Custom Orange Soundwave/Lightning SVG Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff9500] to-[#ff5e00] flex items-center justify-center shrink-0 shadow-[0_4px_15px_rgba(255,94,0,0.3)]">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex items-baseline select-none animate-fadeIn">
            <span className="text-white text-xl font-bold tracking-tight">Rhythmo</span>
            <span className="bg-gradient-to-r from-[#ff9500] to-[#ff5e00] bg-clip-text text-transparent text-xl font-bold tracking-tight">Tune</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className={`flex-1 space-y-1.5 overflow-y-auto premium-scrollbar ${collapsed ? 'px-2' : 'px-4'}`}>
        {/* Home */}
        <NavLink
          to="/"
          end
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 w-full'
            } ${
              isActive
                ? 'bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'hover:text-white hover:bg-white/5'
            }`
          }
          title={collapsed ? "Home" : ""}
        >
          <Home size={19} className="shrink-0" />
          {!collapsed && <span>Home</span>}
        </NavLink>

        {/* Categories / Explore */}
        <NavLink
          to="/explore"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 w-full'
            } ${
              isActive
                ? 'bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'hover:text-white hover:bg-white/5'
            }`
          }
          title={collapsed ? "Categories" : ""}
        >
          <Compass size={19} className="shrink-0" />
          {!collapsed && <span>Categories</span>}
        </NavLink>

        {/* Artists / Library */}
        <NavLink
          to="/library"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 w-full'
            } ${
              isActive
                ? 'bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'hover:text-white hover:bg-white/5'
            }`
          }
          title={collapsed ? "Artists" : ""}
        >
          <Users size={19} className="shrink-0" />
          {!collapsed && <span>Artists</span>}
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 mx-auto p-0' : 'px-4 w-full'
            } ${
              isActive
                ? 'bg-white/10 text-white border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                : 'hover:text-white hover:bg-white/5'
            }`
          }
          title={collapsed ? "Profile" : ""}
        >
          <User size={19} className="shrink-0" />
          {!collapsed && <span>Profile</span>}
        </NavLink>

        {/* Playlists Accordion (Hidden when collapsed) */}
        {!collapsed && (
          <div className="pt-6 animate-fadeIn">
            <button
              onClick={() => setPlaylistsExpanded(!playlistsExpanded)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-500 tracking-wider uppercase hover:text-white transition-colors"
            >
              <span>Playlists</span>
              {playlistsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {playlistsExpanded && (
              <div className="mt-2 space-y-1.5 pl-1">
                {playlists.map((pl) => (
                  <button
                    key={pl.name}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:text-white hover:bg-white/5 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/5 shadow-md transition-transform group-hover:scale-105 duration-200">
                      <img src={pl.cover} alt={pl.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="truncate flex-1 text-gray-400 group-hover:text-white transition-colors">{pl.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className={`p-4 border-t border-white/5 ${collapsed ? 'flex justify-center' : ''}`}>
        {currentUser ? (
          <button
            onClick={logout}
            className={`flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 p-0' : 'px-4 w-full'
            }`}
            title={collapsed ? "Logout" : ""}
          >
            <LogOut size={19} className="shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        ) : (
          <NavLink
            to="/login"
            className={`flex items-center gap-4 py-3.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-[#ff9500] hover:bg-[#ff9500]/5 transition-all duration-200 cursor-pointer ${
              collapsed ? 'justify-center w-12 h-12 p-0' : 'px-4 w-full'
            }`}
            title={collapsed ? "Login" : ""}
          >
            <LogOut size={19} className="shrink-0 rotate-180" />
            {!collapsed && <span>Login</span>}
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
