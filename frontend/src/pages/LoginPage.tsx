import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Eye, EyeOff, Sparkles, Loader2, User, KeyRound, AlertCircle } from 'lucide-react'
import { authService } from '../services'
import { useAuthStore } from '../store'
import { useQueryClient } from '@tanstack/react-query'

interface LoginForm { username: string; password: string }
type UserRole = 'student' | 'faculty' | 'principal' | 'admin'

export default function LoginPage() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>()
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  // Preset demo credentials for easy visual testing
  const demoCredentials: Record<UserRole, LoginForm> = {
    admin: { username: 'admin', password: 'Admin@123' },
    principal: { username: 'principal', password: 'Principal@123' },
    faculty: { username: 'faculty1', password: 'Faculty@123' },
    student: { username: 'stu00001', password: 'Student@123' }
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
    setValue('username', demoCredentials[role].username)
    setValue('password', demoCredentials[role].password)
    setError('')
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(data.username, data.password)
      setAuth(
        { id: res.user_id, username: res.username, role: res.role, email: '', is_active: true }, 
        res.access_token, 
        res.refresh_token
      )
      
      // Invalidate query cache globally to force dashboard components to reload with role context
      queryClient.invalidateQueries()
      const routes: Record<string, string> = { 
        admin: '/admin', 
        principal: '/principal', 
        faculty: '/faculty', 
        student: '/student' 
      }
      navigate(routes[res.role] || '/admin')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Glowing Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-purple-500/10 rounded-full blur-[130px] pointer-events-none animate-pulse delay-75" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        
        {/* Animated Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            CampusIQ AI <Sparkles className="w-4 h-4 text-emerald-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Academic Intelligence Platform</p>
        </motion.div>

        {/* Redesigned Glassmorphic Form Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6"
        >
          {/* Visual Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Select Profile Role
            </label>
            <div className="grid grid-cols-4 p-1 bg-slate-950/80 border border-slate-800 rounded-xl relative">
              {(['student', 'faculty', 'principal', 'admin'] as UserRole[]).map(role => {
                const isActive = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`relative py-2 text-xs font-bold uppercase rounded-lg transition-colors z-10 ${
                      isActive ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRoleTab"
                        className="absolute inset-0 bg-indigo-600 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    {role}
                  </button>
                )
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl flex items-start gap-2.5 text-xs text-red-400"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('username', { required: 'Username is required' })}
                  className="input pl-10 bg-slate-950/80 border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl placeholder:text-slate-600"
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  className="input pl-10 pr-10 bg-slate-950/80 border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white rounded-xl placeholder:text-slate-600"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me and Forgot Password links */}
            <div className="flex items-center justify-between text-xs pt-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={e => setRememberMe(e.target.checked)} 
                  className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-0" 
                />
                <span>Remember Me</span>
              </label>
              <a href="#" className="text-indigo-400 hover:underline">Forgot Password?</a>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full py-3 rounded-xl mt-4 flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Quick Seeding Hints Panel */}
          <div className="p-4 bg-slate-950/80 border border-slate-850 rounded-2xl">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 border-b border-slate-900 pb-2 mb-2">
              <span>Demo Accounts</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-900/30">Auto-filled</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
              <p>Username: <span className="font-mono text-white">{demoCredentials[selectedRole].username}</span></p>
              <p>Password: <span className="font-mono text-white">{demoCredentials[selectedRole].password}</span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
