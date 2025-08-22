'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UserInfo {
  full_name: string;
  user_type: string;
  profile_image?: string;
}

export default function Header() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    full_name: 'Administrator',
    user_type: 'Administrator'
  });


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
                {userInfo.profile_image ? (
                  <Image src={userInfo.profile_image} alt={userInfo.full_name} className="avatar-xs rounded-circle" width={32} height={32} />
                ) : (
                  <div className="avatar-xs rounded-circle bg-primary text-white d-flex align-items-center justify-content-center">
                    {userInfo.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </a>
              <div className="dropdown-menu dropdown-menu-right nav-user-dropdown" aria-labelledby="navbarDropdownMenuLink2">
                <div className="nav-user-info">
                  <h5 className="mb-0 text-white nav-user-name">{userInfo.full_name}</h5>
                  <span className="status"></span><span className="text-capitalize">{userInfo.user_type}</span>
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