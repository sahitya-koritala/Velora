import React, { useState } from 'react';
import { BrainCircuit, Lock, ArrowRight, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
 const [isLogin, setIsLogin] = useState(true);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [formData, setFormData] = useState({
 name: '',
 password: ''
 });
 const [showPassword, setShowPassword] = useState(false);

 const { login } = useAuth();
 const navigate = useNavigate();

 const handleSubmit = async (e) => {
 e.preventDefault();
 setLoading(true);
 setError(null);

 try {
 await new Promise(resolve => setTimeout(resolve, 800));
 
 if (formData.name.trim().length < 2) {
 throw new Error("Please enter a valid name.");
 }
 if (formData.password.length < 4) {
 throw new Error("Password must be at least 4 characters.");
 }

 const mockUser = {
 id: 'user-' + Math.random().toString(36).substr(2, 9),
 name: formData.name,
 full_name: formData.name
 };
 
 const mockToken = 'jwt_' + Math.random().toString(36).substr(2, 9);
 
 login(mockUser, mockToken);
 window.location.href = "/Dashboard";

 } catch (err) {
 console.error("Authentication error:", err);
 setError(err?.message || "Invalid credentials.");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen bg-main-gradient flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
 {/* Background elements */}
 <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
 <div className="absolute left-[-10%] top-[-10%] w-[800px] h-[800px] bg-hero-glow rounded-full blur-3xl"></div>
 <div className="absolute right-[-10%] bottom-[-10%] w-[600px] h-[600px] bg-hero-glow rounded-full blur-3xl"></div>
 </div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="sm:mx-auto sm:w-full sm:max-w-md z-10"
 >
 <div className="flex justify-center mb-6">
 <div className="w-16 h-16 rounded-2xl bg-sidebar-gradient flex items-center justify-center shadow-lg shadow-[#10B981]/30">
 <div className="w-7 h-7 rounded-lg bg-sidebar-gradient flex items-center justify-center shadow-sm shrink-0"><span className=" text-primary-dark font-black text-sm">V</span></div>
 </div>
 </div>
 <h2 className="mt-2 text-center text-4xl font-extrabold tracking-tight text-primary-dark mb-2">
 Velora
 </h2>
 <p className="text-center text-sm text-secondary-blue font-medium">
 {isLogin ? "Welcome back to your semantic engine" : "Join the future of intelligent discovery"}
 </p>
 </motion.div>

 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10"
 >
 <div className="glass-panel py-10 px-4 sm:px-10 relative overflow-hidden group hover:glow-highlight transition-all duration-500">
 <div className="absolute top-0 left-0 right-0 h-1.5 bg-sidebar-gradient"></div>
 
 <AnimatePresence mode="wait">
 {error && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6"
 >
 <p className="text-sm text-red-600 text-center font-medium">{error}</p>
 </motion.div>
 )}
 </AnimatePresence>

 <form className="space-y-5" onSubmit={handleSubmit}>
 <div>
 <label className="block text-sm font-bold text-primary-dark uppercase tracking-wide">
 Name
 </label>
 <div className="mt-1 relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <UserIcon className="h-5 w-5 text-[#10B981]/70 group-focus-within:text-[#10B981] transition-colors" />
 </div>
 <input
 type="text"
 required
 className="appearance-none block w-full pl-11 pr-3 py-3.5 border border-divider bg-white/60 rounded-xl text-primary-dark placeholder-secondary-blue/60 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all font-medium backdrop-blur-sm"
 placeholder="Enter your name"
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 />
 </div>
 </div>

 <div>
 <label className="block text-sm font-bold text-primary-dark uppercase tracking-wide">
 Password
 </label>
 <div className="mt-1 relative group">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
 <Lock className="h-5 w-5 text-[#10B981]/70 group-focus-within:text-[#10B981] transition-colors" />
 </div>
 <input
 type={showPassword ? "text" : "password"}
 required
 className="appearance-none block w-full pl-11 pr-10 py-3.5 border border-divider bg-white/60 rounded-xl text-primary-dark placeholder-secondary-blue/60 focus:outline-none focus:ring-2 focus:ring-[#10B981] focus:border-transparent transition-all font-medium backdrop-blur-sm"
 placeholder="••••••••"
 value={formData.password}
 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
 />
 <button
 type="button"
 onClick={() => setShowPassword(!showPassword)}
 className="absolute inset-y-0 right-0 pr-4 flex items-center"
 >
 {showPassword ? (
 <EyeOff className="h-5 w-5 text-secondary-blue hover:text-[#10B981] transition-colors" />
 ) : (
 <Eye className="h-5 w-5 text-secondary-blue hover:text-[#10B981] transition-colors" />
 )}
 </button>
 </div>
 </div>

 <div className="pt-4">
 <button
 type="submit"
 disabled={loading}
 className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-[#10B981]/30 text-base font-bold text-primary-dark bg-[#10B981] hover:bg-[#059669] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70"
 >
 {loading ? (
 <Loader2 className="w-5 h-5 animate-spin" />
 ) : (
 <>
 {isLogin ? 'Sign In to Dashboard' : 'Create Velora Account'}
 <ArrowRight className="ml-2 w-5 h-5" />
 </>
 )}
 </button>
 </div>
 </form>

 <div className="mt-6">
 <button
 type="button"
 onClick={() => {
 setIsLogin(!isLogin);
 setError(null);
 setFormData({ name: '', password: '' });
 }}
 className="w-full flex justify-center py-3.5 px-4 border border-divider rounded-xl bg-white/30 text-sm font-bold text-[#10B981] hover:bg-white/60 transition-all shadow-sm"
 >
 {isLogin ? 'Create an account instead' : 'Sign in instead'}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 );
}
