import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import toast from 'react-hot-toast';

const ADMIN_BYPASS = { email: 'admin@test.com', password: 'admin123' }; // TODO remove before production

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    if (data.email === ADMIN_BYPASS.email && data.password === ADMIN_BYPASS.password) {
      toast.success('Admin bypass login (testing)');
      localStorage.setItem('token', 'admin-test-token-12345');
      localStorage.setItem(
        'user',
        JSON.stringify({ name: 'Admin User', email: 'admin@test.com', _id: 'admin-id-123' })
      );
      navigate('/dashboard');
      return;
    }

    const res = await login(data.email, data.password);
    if (res.success) {
      toast.success('Login successful');
      navigate('/dashboard');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}<Link to="/register" className="text-primary-600 hover:underline">register</Link>
          </p>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 text-center">
            Test: admin@test.com / admin123
          </div>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  className="input pl-10"
                  placeholder="you@example.com"
                  {...register('email', {
                    required: 'Email required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  {...register('password', {
                    required: 'Password required',
                    minLength: { value: 6, message: 'Min 6 characters' },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;