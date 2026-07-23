import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services'
import { useAuthStore, useThemeStore } from '../store'

interface LoginForm { username: string; password: string }

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()
  const { setAuth } = useAuthStore()
  const { isDark } = useThemeStore()
  const navigate = useNavigate()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    try {
      const res = await authService.login(data.username, data.password)
      setAuth({ id: res.user_id, username: res.username, role: res.role, email: '', is_active: true }, res.access_token, res.refresh_token)
      const routes: Record<string, string> = { admin: '/admin', principal: '/principal', faculty: '/faculty', student: '/student' }
      navigate(routes[res.role] || '/admin')
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CampusIQ AI</h1>
          <p className="text-primary-200 mt-1">Academic Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
              <input
                {...register('username', { required: 'Username is required' })}
                className="input"
                placeholder="Enter your username"
                autoComplete="username"
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Demo Credentials</p>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <p>Admin: <span className="font-mono">admin / Admin@123</span></p>
              <p>Student: <span className="font-mono">stu00001 / Student@123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
