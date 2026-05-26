import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Music, Loader2, ArrowLeft, Phone, Mail, Hash } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import CountryPicker from '../components/CountryPicker';
import countryCodes from '../data/countryCodes';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countryCodes.find(c => c.code === 'IN'));
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  // Handle redirect result (for mobile Google auth flow)
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) navigate('/');
      })
      .catch((err) => {
        if (err.code && err.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect auth error:', err.code, err.message);
          setError(`Google auth failed: ${err.code}`);
        }
      });
  }, []);

  // Setup invisible recaptcha
  useEffect(() => {
    if (authMethod === 'phone' && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      } catch (e) { console.error(e); }
    }
  }, [authMethod]);

  // Detect mobile / in-app browser where popups are blocked
  const isMobileOrInApp = () => {
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod/i.test(ua) ||
      /FBAN|FBAV|Instagram|Line|WhatsApp|Snapchat|Twitter|MicroMessenger/i.test(ua);
  };

  const handleEmailAuth = async (e, mode) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: email.split('@')[0] });
      }
      navigate('/');
    } catch (err) {
      console.error(err.code, err.message);
      const msgs = {
        'auth/email-already-in-use': "Email already registered. Please sign in.",
        'auth/invalid-email': "Invalid email format.",
        'auth/user-disabled': "Account disabled.",
        'auth/user-not-found': "Invalid credentials.",
        'auth/wrong-password': "Invalid credentials.",
        'auth/invalid-credential': "Invalid credentials.",
        'auth/weak-password': "Password must be at least 6 characters.",
        'auth/operation-not-allowed': "This method is not enabled.",
      };
      setError(msgs[err.code] || "An error occurred. Please try again.");
    } finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setError(''); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      if (isMobileOrInApp()) {
        // Use redirect on mobile — popups are blocked in most mobile/in-app browsers
        await signInWithRedirect(auth, provider);
        // Page will redirect, so no navigate() needed here
        return;
      }

      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err) {
      console.error('Google auth error:', err.code, err.message);
      if (err.code === 'auth/popup-closed-by-user') setError("Sign-in cancelled.");
      else if (err.code === 'auth/unauthorized-domain') setError("This domain isn't authorized in Firebase. Add it in Firebase Console → Authentication → Settings → Authorized domains.");
      else if (err.code !== 'auth/cancelled-popup-request') setError(`Google auth failed (${err.code || 'unknown'}). Check console for details.`);
    } finally { setLoading(false); }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!phoneNumber || phoneNumber.length < 6) { setError("Enter a valid phone number."); return; }
    setLoading(true);
    try {
      const fullNumber = selectedCountry.dial + phoneNumber.replace(/\s/g, '');
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-phone-number') setError("Invalid phone number format.");
      else if (err.code === 'auth/too-many-requests') setError("Too many attempts. Try later.");
      else setError("Failed to send OTP. Please try again.");
      // Reset recaptcha on error
      if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length < 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError("Invalid OTP. Please check and try again.");
    } finally { setLoading(false); }
  };

  const resetPhoneAuth = () => {
    setOtpSent(false); setOtp(''); setConfirmationResult(null); setError('');
    if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; }
  };

  // ─── Shared sub-components ───
  const MethodTabs = ({ accent = 'cyan' }) => (
    <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 border border-white/5">
      <button type="button" onClick={() => { setAuthMethod('email'); resetPhoneAuth(); setError(''); }}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${authMethod === 'email' ? (accent === 'cyan' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' : 'bg-pink-500/15 text-pink-400 border border-pink-500/20') : 'text-gray-500 hover:text-white'}`}>
        <Mail size={13} /> Email
      </button>
      <button type="button" onClick={() => { setAuthMethod('phone'); setError(''); }}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${authMethod === 'phone' ? (accent === 'cyan' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20' : 'bg-pink-500/15 text-pink-400 border border-pink-500/20') : 'text-gray-500 hover:text-white'}`}>
        <Phone size={13} /> Phone
      </button>
    </div>
  );

  const ErrorBox = () => error ? (
    <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-4 py-3 rounded-xl text-center mb-4">
      {error}
    </motion.div>
  ) : null;

  const GoogleBtn = ({ label }) => (
    <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-4">
      <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      {label}
    </button>
  );

  const PhoneForm = ({ btnClass, btnLabel }) => (
    <AnimatePresence mode="wait">
      {!otpSent ? (
        <motion.form key="phone-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4" onSubmit={handleSendOtp}>
          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest block ml-1">Select Country</label>
          <CountryPicker selected={selectedCountry} onSelect={setSelectedCountry} />
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Phone size={16} /></div>
            <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="Phone number"
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all block" />
          </div>
          <p className="text-[10px] text-gray-600 ml-1">Full number: {selectedCountry.flag} {selectedCountry.dial} {phoneNumber || '...'}</p>
          <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] ${btnClass}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : btnLabel || "Send OTP"}
          </button>
        </motion.form>
      ) : (
        <motion.form key="otp-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4" onSubmit={handleVerifyOtp}>
          <div className="text-center mb-2">
            <p className="text-sm text-gray-400">OTP sent to <span className="text-white font-bold">{selectedCountry.dial} {phoneNumber}</span></p>
            <button type="button" onClick={resetPhoneAuth} className="text-neon-cyan text-xs font-bold mt-1 hover:underline">Change number</button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Hash size={16} /></div>
            <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required placeholder="Enter 6-digit OTP" maxLength={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all block tracking-[0.3em] text-center font-mono text-lg" />
          </div>
          <button type="submit" disabled={loading} className={`w-full py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.02] ${btnClass}`}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & Sign In"}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );

  const OrDivider = ({ bg }) => (
    <div className="relative flex items-center justify-center mt-5 mb-2">
      <div className="absolute w-full border-t border-white/10" />
      <span className={`${bg} px-3 font-semibold text-xs text-gray-500 relative`}>OR</span>
    </div>
  );

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 overflow-hidden bg-dark-bg">
      <div id="recaptcha-container" ref={recaptchaRef} />

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/25 rounded-full filter blur-[120px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full filter blur-[120px] animate-blob-delay-2" />
      </div>
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(rgba(0,243,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,243,255,0.3) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      <NavLink to="/" className="absolute top-6 left-6 text-gray-500 hover:text-neon-cyan transition-colors text-sm font-medium z-50 flex items-center gap-2">
        <ArrowLeft size={16} /> Back to Hub
      </NavLink>

      {/* ─── DESKTOP LAYOUT ─── */}
      <div className="hidden md:flex relative w-full max-w-4xl h-[620px] z-10" style={{ perspective: '1500px' }}>
        <div className="absolute inset-0 flex rounded-2xl overflow-hidden glass-card shadow-2xl border border-white/10">
          <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center bg-white/5 relative">
            <h2 className="text-3xl font-black text-white mb-4">New Here?</h2>
            <p className="text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">Sign up to discover new tracks, organize your library, and join the ultimate vibe.</p>
            <button onClick={() => { setIsLogin(false); setError(''); resetPhoneAuth(); }} className="px-8 py-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all font-semibold text-white tracking-widest uppercase text-xs">Sign Up</button>
          </div>
          <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center bg-white/5 relative">
            <h2 className="text-3xl font-black text-white mb-4 text-glow-pink">Welcome Back!</h2>
            <p className="text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">Already have an account? Log in to access your saved beats and playlists.</p>
            <button onClick={() => { setIsLogin(true); setError(''); resetPhoneAuth(); }} className="px-8 py-3 rounded-xl border border-white/20 hover:bg-white/10 hover:border-white/30 transition-all font-semibold text-white tracking-widest uppercase text-xs">Login</button>
          </div>
        </div>

        <motion.div className="absolute top-0 right-0 w-1/2 h-full z-20 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
          style={{ transformOrigin: "left center", transformStyle: "preserve-3d" }}
          animate={{ rotateY: isLogin ? 0 : -180 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 15 }}>

          {/* Front = Login */}
          <div className="absolute inset-0 rounded-r-2xl border border-white/10 overflow-y-auto hide-scrollbar flex flex-col p-10 justify-center"
            style={{ backfaceVisibility: "hidden", background: "linear-gradient(135deg, rgba(12,12,18,0.98) 0%, rgba(20,20,28,0.95) 100%)", backdropFilter: "blur(20px)" }}>
            <div className="absolute top-0 left-0 right-0 h-1 neon-gradient-bg opacity-70" />
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl neon-gradient-bg flex items-center justify-center text-white neon-shadow mb-4"><Music size={24} /></div>
              <h2 className="text-3xl font-black text-white text-glow">Sign In</h2>
            </div>
            <MethodTabs accent="cyan" />
            <ErrorBox />
            {authMethod === 'email' ? (
              <>
                <form className="space-y-4" onSubmit={(e) => handleEmailAuth(e, 'login')}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><User size={16} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all block" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock size={16} /></div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Password"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all block" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full neon-gradient-bg py-3 rounded-xl text-white font-bold text-sm neon-shadow transition-all flex items-center justify-center gap-2 mt-4 hover:scale-[1.02]">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                  </button>
                </form>
                <OrDivider bg="bg-[#0f0f15]" />
                <GoogleBtn label="Continue with Google" />
              </>
            ) : (
              <PhoneForm btnClass="neon-gradient-bg neon-shadow" btnLabel="Send OTP" />
            )}
          </div>

          {/* Back = Signup */}
          <div className="absolute inset-0 rounded-r-2xl border border-white/10 overflow-y-auto hide-scrollbar flex flex-col p-10 justify-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, rgba(20,12,18,0.98) 0%, rgba(28,15,20,0.95) 100%)", backdropFilter: "blur(20px)" }}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-orange-400 opacity-70" />
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white neon-shadow-pink mb-4"><Music size={24} /></div>
              <h2 className="text-3xl font-black text-white text-glow-pink">Create Account</h2>
            </div>
            <MethodTabs accent="pink" />
            <ErrorBox />
            {authMethod === 'email' ? (
              <>
                <form className="space-y-4" onSubmit={(e) => handleEmailAuth(e, 'signup')}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><User size={16} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all block" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock size={16} /></div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Password (Min 6 chars)"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all block" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-pink-500 to-orange-400 py-3 rounded-xl text-white font-bold text-sm neon-shadow-pink transition-all flex items-center justify-center gap-2 mt-6 hover:scale-[1.02]">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign Up"}
                  </button>
                </form>
                <OrDivider bg="bg-[#160d13]" />
                <GoogleBtn label="Sign Up with Google" />
              </>
            ) : (
              <PhoneForm btnClass="bg-gradient-to-tr from-pink-500 to-orange-400 neon-shadow-pink" btnLabel="Send OTP" />
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="md:hidden relative w-full max-w-[400px] h-[580px] z-10" style={{ perspective: '1200px' }}>
        <motion.div className="w-full h-full relative" style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isLogin ? 0 : -180 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 60, damping: 15 }}>

          {/* Mobile Login (Front) */}
          <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-y-auto hide-scrollbar flex flex-col p-6 sm:p-8 justify-center"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "linear-gradient(135deg, rgba(12,12,18,0.98) 0%, rgba(20,20,28,0.95) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <div className="absolute top-0 left-0 right-0 h-1 neon-gradient-bg opacity-70" />
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 rounded-2xl neon-gradient-bg flex items-center justify-center text-white neon-shadow mb-3"><Music size={20} /></div>
              <h2 className="text-2xl font-black text-white text-glow">Sign In</h2>
            </div>
            <MethodTabs accent="cyan" />
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl text-center mb-4">{error}</div>}
            {authMethod === 'email' ? (
              <>
                <form className="space-y-3.5" onSubmit={(e) => handleEmailAuth(e, 'login')}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><User size={16} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock size={16} /></div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/30 transition-all" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full neon-gradient-bg py-3 rounded-xl text-white font-bold text-sm neon-shadow transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign In"}
                  </button>
                </form>
                <OrDivider bg="bg-transparent" />
                <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </button>
              </>
            ) : (
              <PhoneForm btnClass="neon-gradient-bg neon-shadow" btnLabel="Send OTP" />
            )}
            <p className="text-center text-sm text-gray-500 mt-5">
              Don't have an account? <button onClick={() => { setIsLogin(false); resetPhoneAuth(); setError(''); }} className="text-neon-cyan font-bold">Sign up</button>
            </p>
          </div>

          {/* Mobile Signup (Back) */}
          <div className="absolute inset-0 rounded-2xl border border-white/10 overflow-y-auto hide-scrollbar flex flex-col p-6 sm:p-8 justify-center"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "linear-gradient(135deg, rgba(20,12,18,0.98) 0%, rgba(28,15,20,0.95) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-orange-400 opacity-70" />
            <div className="flex flex-col items-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-white neon-shadow-pink mb-3"><Music size={20} /></div>
              <h2 className="text-2xl font-black text-white text-glow-pink">Create Account</h2>
            </div>
            <MethodTabs accent="pink" />
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold px-4 py-2.5 rounded-xl text-center mb-4">{error}</div>}
            {authMethod === 'email' ? (
              <>
                <form className="space-y-3.5" onSubmit={(e) => handleEmailAuth(e, 'signup')}>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><User size={16} /></div>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email Address"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all" />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500"><Lock size={16} /></div>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password (Min 6 chars)"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white/90 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-gradient-to-tr from-pink-500 to-orange-400 py-3 rounded-xl text-white font-bold text-sm neon-shadow-pink transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Sign Up"}
                  </button>
                </form>
                <OrDivider bg="bg-transparent" />
                <button type="button" onClick={handleGoogleAuth} disabled={loading} className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Sign Up with Google
                </button>
              </>
            ) : (
              <PhoneForm btnClass="bg-gradient-to-tr from-pink-500 to-orange-400 neon-shadow-pink" btnLabel="Send OTP" />
            )}
            <p className="text-center text-sm text-gray-500 mt-5">
              Already have an account? <button onClick={() => { setIsLogin(true); resetPhoneAuth(); setError(''); }} className="text-pink-400 font-bold">Log in</button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
