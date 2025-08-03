'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();


  useEffect(() => {
    // Add body class for login page styling
    document.body.className = 'bg-light';
    
    return () => {
      // Clean up on unmount
      document.body.className = '';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to dashboard on successful login
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center">
      <div className="splash-container">
        <div className="card shadow-sm">
          <div className="card-header text-center">
            <a href="/dashboard" className="d-flex flex-column align-items-center">
              <Image 
                className="logo-img mb-2" 
                src="/logo.png" 
                alt="True Astrotalk Logo"
                width={80}
                height={80}
              />
              <h3 className="text-primary mb-0" style={{ color: '#1877F2' }}>True Astrotalk</h3>
              <small className="text-muted">Admin Panel</small>
            </a>
            <span className="splash-description mt-3">Please enter your admin credentials.</span>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-2">
                <input 
                  className="form-control" 
                  id="email" 
                  type="email" 
                  placeholder="Email Address" 
                  autoComplete="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group mb-2">
                <input 
                  className="form-control" 
                  id="password" 
                  type="password" 
                  placeholder="Password" 
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label className="custom-control custom-checkbox">
                  <input className="custom-control-input" type="checkbox" />
                  <span className="custom-control-label">Remember Me</span>
                </label>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                style={{ backgroundColor: '#1877F2', borderColor: '#1877F2' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}