'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="dashboard-header">
      <nav className="navbar navbar-expand-lg navbar-light bg-white fixed-top">
        <a className="navbar-brand" href="/admin/dashboard">
          <Image src="/logo.png" alt="True Astrotalk" width={40} height={40} />
					<span className="ml-3"><strong>True Astrotalk</strong></span>
        </a>
        <div className="ml-auto" id="navbarSupportedContent">
          <ul className="navbar-nav ml-auto navbar-right-top flex-row">
            <li className="nav-item dropdown nav-user">
              <a className="nav-link nav-user-img" href="#" id="navbarDropdownMenuLink2" data-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false">
                <Image src="/assets/images/avatar-1.jpg" alt="Admin" className="avatar-xs rounded-circle" width={32} height={32} />
              </a>
              <div className="dropdown-menu dropdown-menu-right nav-user-dropdown" aria-labelledby="navbarDropdownMenuLink2">
                <div className="nav-user-info">
                  <h5 className="mb-0 text-white nav-user-name">Akash Sahay</h5>
                  <span className="status"></span><span>Administrator</span>
                </div>
                <a className="dropdown-item" href="#">
                  <i className="fas fa-user mr-2"></i>Account
                </a>
                <a className="dropdown-item" href="#">
                  <i className="fas fa-cog mr-2"></i>Settings
                </a>
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <i className="fas fa-power-off mr-2"></i>
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}