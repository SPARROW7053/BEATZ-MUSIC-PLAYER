import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, ShieldCheck, LogIn, LogOut, Loader2, Edit3, Save, X, Camera, Plus, CheckCircle2 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import ImageCropperModal from '../components/ImageCropperModal';

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  // Image Editing States
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        setFetching(false);
        return;
      }
      
      try {
        setDisplayName(currentUser.displayName || '');
        setPhotoURL(currentUser.photoURL || '');
        
        // Fetch extra details from Firestore
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhoneNumber(data.phoneNumber || '');
        } else {
          setPhoneNumber(currentUser.phoneNumber || '');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage) => {
    setPhotoURL(croppedImage);
    setShowCropper(false);
    setSelectedImage(null);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Update Firebase Auth Profile (DisplayName & Photo)
      await updateProfile(currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });
      
      // 2. Update Firestore for extra info (Phone Number)
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName: displayName,
        photoURL: photoURL,
        phoneNumber: phoneNumber,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      await currentUser.reload();
      setSuccess("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[70vh] w-full flex items-center justify-center">
        <Loader2 size={40} className="text-neon-cyan animate-spin" />
      </div>
    );
  }

  // If the user is NOT logged in
  if (!currentUser) {
    return (
      <div className="min-h-full w-full flex items-center justify-center p-4 py-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card max-w-md w-full p-10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 neon-gradient-bg opacity-70" />
          
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto mb-6 flex items-center justify-center text-gray-400">
            <User size={40} />
          </div>
          
          <h2 className="text-3xl font-black text-white text-glow mb-4">Guest Profile</h2>
          <p className="text-gray-400 mb-8 px-4">
            You are not currently logged in. Sign up or log in to access your saved playlists and customize your listening experience.
          </p>

          <NavLink 
            to="/login"
            className="w-full neon-gradient-bg py-4 rounded-xl text-white font-bold text-sm neon-shadow transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            <LogIn size={18} />
            Log In / Sign Up
          </NavLink>
        </motion.div>
      </div>
    );
  }

  // If the user IS logged in
  return (
    <div className="min-h-full w-full flex flex-col items-center p-4 py-12 relative max-w-4xl mx-auto">
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {showCropper && (
          <ImageCropperModal 
            image={selectedImage} 
            onCropComplete={handleCropComplete} 
            onCancel={() => { setShowCropper(false); setSelectedImage(null); }} 
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight">My Profile</h1>
          {isEditing ? (
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  setIsEditing(false);
                  // Reset to original data
                  setDisplayName(currentUser.displayName || '');
                  setPhotoURL(currentUser.photoURL || '');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all text-sm font-bold"
              >
                <X size={16} /> Cancel
              </button>
              <button 
                disabled={loading}
                onClick={handleSaveProfile}
                className="flex items-center gap-2 px-6 py-2 rounded-xl neon-gradient-bg text-white neon-shadow transition-all text-sm font-bold hover:scale-105"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                Save Changes
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all text-sm font-bold group"
            >
              <Edit3 size={16} className="group-hover:text-neon-cyan transition-colors" /> Edit Profile
            </button>
          )}
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium animate-shake">{error}</div>}
        {success && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center font-medium flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> {success}
          </motion.div>
        )}

        {/* Profile Details Card */}
        <div className="glass-card w-full p-8 relative overflow-hidden mb-8 shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-purple to-neon-cyan opacity-50" />
          
          <div className="flex flex-col md:flex-row items-start gap-10">
            {/* Avatar Section */}
            <div className="relative group self-center md:self-start">
              <div 
                className={`w-36 h-36 rounded-full overflow-hidden border-4 relative z-10 bg-dark-bg flex items-center justify-center transition-all duration-500 
                  ${isEditing ? 'border-neon-cyan cursor-pointer scale-105 shadow-[0_0_30px_rgba(0,243,255,0.3)]' : 'border-white/10'}`}
                onClick={() => isEditing && fileInputRef.current.click()}
              >
                {photoURL ? (
                  <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={60} className="text-gray-500" />
                )}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center transition-opacity hover:bg-black/40">
                    <Camera size={28} className="text-white mb-1" />
                    <span className="text-[10px] text-white font-black uppercase tracking-widest">Update</span>
                  </div>
                )}
              </div>
              <div className={`absolute inset-0 bg-neon-cyan/20 blur-xl rounded-full scale-110 z-0 transition-opacity ${isEditing ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
            </div>

            {/* Info Section */}
            <div className="flex-1 w-full space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Username / Display Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] ml-1">Username</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                    />
                  ) : (
                    <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-lg font-bold text-white shadow-inner">
                      {displayName || 'Not set'}
                    </div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] ml-1">Phone Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input 
                        type="tel" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl text-gray-300 font-medium">
                      <Phone size={16} className="text-neon-cyan opacity-60" />
                      {phoneNumber || 'Not Linked'}
                    </div>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] ml-1">Email Address (Primary)</label>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl text-gray-500 font-medium group transition-all">
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-neon-pink opacity-40" />
                      <span className="truncate">{currentUser.email}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">Fixed</span>
                  </div>
                  <p className="text-[10px] text-gray-600 ml-1">Primary email cannot be changed as it is linked to your authentication provider.</p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Account Security Settings */}
        <div className="glass-card p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-pink to-neon-purple opacity-30" />
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 neon-shadow-green">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Security & Access</h3>
              <p className="text-sm text-gray-500">Manage your account protection and authentication status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400 font-medium">Verification Status</span>
                {currentUser.emailVerified ? (
                  <span className="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-lg text-xs tracking-wider uppercase flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="text-orange-400 font-bold bg-orange-400/10 px-3 py-1 rounded-lg text-xs tracking-wider uppercase">Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-400 font-medium">User Identifier (UID)</span>
                <span className="text-gray-500 text-[10px] font-mono truncate max-w-[140px] opacity-60">{currentUser.uid}</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center">
               <button 
                onClick={handleLogout}
                className="w-full py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-sm transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                Sign Out Securely
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
