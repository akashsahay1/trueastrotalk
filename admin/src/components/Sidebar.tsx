'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      icon: 'fa-tachometer-alt',
      href: '/admin/dashboard',
      active: pathname === '/admin/dashboard'
    },
    {
      title: 'Accounts',
      icon: 'fa-users',
      submenu: [
        {
          title: 'Admins',
          href: '/admin/accounts/admins',
          active: pathname.startsWith('/admin/accounts/admins')
        },
        {
          title: 'Astrologers',
          href: '/admin/accounts/astrologers',
          active: pathname.startsWith('/admin/accounts/astrologers')
        },
        {
          title: 'Customers',
          href: '/admin/accounts/customers',
          active: pathname.startsWith('/admin/accounts/customers')
        },
        {
          title: 'Managers',
          href: '/admin/accounts/managers',
          active: pathname.startsWith('/admin/accounts/managers')
        }
      ]
    },
    {
      title: 'Sessions',
      icon: 'fa-comments',
      submenu: [
        {
          title: 'Call',
          href: '/admin/sessions/call',
          active: pathname.startsWith('/admin/sessions/call')
        },
        {
          title: 'Chat',
          href: '/admin/sessions/chat',
          active: pathname.startsWith('/admin/sessions/chat')
        },
        {
          title: 'Video',
          href: '/admin/sessions/video',
          active: pathname.startsWith('/admin/sessions/video')
        }
      ]
    },
    {
      title: 'Products',
      icon: 'fa-shopping-cart',
      submenu: [
        {
          title: 'All Products',
          href: '/admin/products',
          active: pathname === '/admin/products' || pathname.startsWith('/admin/products/edit/')
        },
        {
          title: 'Categories',
          href: '/admin/products/categories',
          active: pathname.startsWith('/admin/products/categories')
        }
      ]
    },
    {
      title: 'Finance',
      icon: 'fa-dollar-sign',
      submenu: [
        {
          title: 'Wallets',
          href: '/admin/finance/wallets',
          active: pathname.startsWith('/admin/finance/wallets')
        },
        {
          title: 'Commissions',
          href: '/admin/finance/commissions',
          active: pathname.startsWith('/admin/finance/commissions')
        },
        {
          title: 'Transactions',
          href: '/admin/finance/transactions',
          active: pathname.startsWith('/admin/finance/transactions')
        }
      ]
    },
    {
      title: 'Notifications',
      icon: 'fa-bell',
      submenu: [
        {
          title: 'Send Notification',
          href: '/admin/notifications/send',
          active: pathname.startsWith('/admin/notifications/send')
        },
        {
          title: 'Notification History',
          href: '/admin/notifications/history',
          active: pathname.startsWith('/admin/notifications/history')
        },
        {
          title: 'User Preferences',
          href: '/admin/notifications/preferences',
          active: pathname.startsWith('/admin/notifications/preferences')
        }
      ]
    },
    {
      title: 'Support',
      icon: 'fa-headset',
      href: '/admin/support',
      active: pathname.startsWith('/admin/support')
    },
    {
      title: 'Settings',
      icon: 'fa-cogs',
      submenu: [
				{
          title: 'General',
          href: '/admin/settings/general',
          active: pathname.startsWith('/admin/settings/general')
        },
        {
          title: 'Astrologers',
          href: '/admin/settings/astrologers',
          active: pathname.startsWith('/admin/settings/astrologers')
        }
      ]
    }
  ];

  return (
    <div className="nav-left-sidebar sidebar-dark">
      <div className="menu-list">
        <nav className="navbar navbar-expand-lg navbar-light">
          <Link className="d-xl-none d-lg-none text-white" href="/admin/dashboard">Dashboard</Link>
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
                          {item.submenu.map((subitem, subindex) => (
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