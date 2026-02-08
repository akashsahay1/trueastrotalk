'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [userType, setUserType] = useState<string>('');

  useEffect(() => {
    // Fetch user type from auth check API
    const fetchUserType = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          const data = await response.json();
          setUserType(data.userType || '');
        }
      } catch (error) {
        console.error('Failed to fetch user type:', error);
      }
    };
    fetchUserType();
  }, []);

  const isManager = userType === 'manager';

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'fa-tachometer-alt',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      title: 'Accounts',
      icon: 'fa-users',
      submenu: [
        {
          title: 'Admins',
          href: '/accounts/admins',
          active: pathname?.startsWith('/accounts/admins') || false,
          adminOnly: true
        },
        {
          title: 'Astrologers',
          href: '/accounts/astrologers',
          active: pathname?.startsWith('/accounts/astrologers') || false
        },
        {
          title: 'Customers',
          href: '/accounts/customers',
          active: pathname?.startsWith('/accounts/customers') || false
        },
        {
          title: 'Managers',
          href: '/accounts/managers',
          active: pathname?.startsWith('/accounts/managers') || false
        }
      ]
    },
    {
      title: 'Sessions',
      icon: 'fa-comments',
      submenu: [
        {
          title: 'Call',
          href: '/sessions/call',
          active: pathname?.startsWith('/sessions/call') || false
        },
        {
          title: 'Chat',
          href: '/sessions/chat',
          active: pathname?.startsWith('/sessions/chat') || false
        },
        {
          title: 'Video',
          href: '/sessions/video',
          active: pathname?.startsWith('/sessions/video') || false
        }
      ]
    },
    {
      title: 'Products',
      icon: 'fa-shopping-cart',
      submenu: [
        {
          title: 'All Products',
          href: '/products',
          active: pathname === '/products' || pathname?.startsWith('/products/edit/') || false
        },
        {
          title: 'Categories',
          href: '/products/categories',
          active: pathname?.startsWith('/products/categories') || false
        }
      ]
    },
    {
      title: 'Orders',
      icon: 'fa-shopping-bag',
      submenu: [
        {
          title: 'Complete',
          href: '/orders/complete',
          active: pathname?.startsWith('/orders/complete') || false
        },
        {
          title: 'Pending',
          href: '/orders/pending',
          active: pathname?.startsWith('/orders/pending') || false
        },
        {
          title: 'History',
          href: '/orders/history',
          active: pathname?.startsWith('/orders/history') || false
        }
      ]
    },
    {
      title: 'Finance',
      icon: 'fa-dollar-sign',
      submenu: [
        {
          title: 'Wallets',
          href: '/finance/wallets',
          active: pathname?.startsWith('/finance/wallets') || false
        },
        {
          title: 'Commissions',
          href: '/finance/commissions',
          active: pathname?.startsWith('/finance/commissions') || false
        },
        {
          title: 'Transactions',
          href: '/finance/transactions',
          active: pathname?.startsWith('/finance/transactions') || false
        }
      ]
    },
    {
      title: 'Notifications',
      icon: 'fa-bell',
      submenu: [
        {
          title: 'Send Notification',
          href: '/notifications/send',
          active: pathname?.startsWith('/notifications/send') || false
        },
        {
          title: 'Notification History',
          href: '/notifications/history',
          active: pathname?.startsWith('/notifications/history') || false
        },
        {
          title: 'User Preferences',
          href: '/notifications/preferences',
          active: pathname?.startsWith('/notifications/preferences') || false
        }
      ]
    },
    {
      title: 'Reports',
      icon: 'fa-chart-line',
      href: '/reports',
      active: pathname?.startsWith('/reports') || false
    },
    {
      title: 'Settings',
      icon: 'fa-cogs',
      submenu: [
        {
          title: 'General',
          href: '/settings/general',
          active: pathname?.startsWith('/settings/general') || false,
          adminOnly: true
        },
        {
          title: 'Astrologers',
          href: '/settings/astrologers',
          active: pathname?.startsWith('/settings/astrologers') || false
        }
      ]
    }
  ];

  return (
    <div className="nav-left-sidebar sidebar-dark">
      <div className="menu-list">
        <nav className="navbar navbar-expand-lg navbar-light">
          <Link className="d-xl-none d-lg-none text-white" href="/dashboard">Dashboard</Link>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav"
            aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav flex-column">              
              {menuItems.map((item, index) => (
                <li key={index} className="nav-item">
                  {item.submenu ? (
                    <>
                      <a className={`nav-link ${item.submenu.some(sub => sub.active) ? 'active' : ''}`} 
                         href="#" 
                         data-toggle="collapse" 
                         aria-expanded={item.submenu.some(sub => sub.active)}
                         data-target={`#submenu-${index}`} 
                         aria-controls={`submenu-${index}`}>
                        <i className={`fas fa-fw ${item.icon}`}></i>
                        {item.title}
                      </a>
                      <div id={`submenu-${index}`} className={`collapse submenu ${item.submenu.some(sub => sub.active) ? 'show' : ''}`}>
                        <ul className="nav flex-column">
                          {item.submenu
                            .filter(subitem => !isManager || !subitem.adminOnly)
                            .map((subitem, subindex) => (
                            <li key={subindex} className="nav-item">
                              <Link
                                className='nav-link'
                                href={subitem.href}
                              >
                                {subitem.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <Link 
                      className={`nav-link ${item.active ? 'active' : ''}`} 
                      href={item.href}
                    >
                      <i className={`fas fa-fw ${item.icon}`}></i>
                      {item.title}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>
    </div>
  );
}