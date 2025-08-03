'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface User {
  _id: string;
  full_name: string;
  email_address: string;
  phone_number: string;
  profile_image: string;
  account_status: string;
  is_verified: boolean;
  is_online: boolean;
  city: string;
  state: string;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function AdminsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    document.body.className = '';
    fetchUsers(1, '');
  }, []);

  const fetchUsers = async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '30',
        type: 'administrator'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
        setSearch(searchTerm);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchInput);
  };

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, search);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'badge-success';
      case 'inactive':
        return 'badge-warning';
      case 'banned':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="dashboard-main-wrapper">
      <Header />
      <Sidebar />
      
      <div className="dashboard-wrapper">
        <div className="dashboard-ecommerce">
          <div className="container-fluid dashboard-content">
            {/* Page Header */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="page-header">
                  <h2 className="pageheader-title">Administrators Management</h2>
                  <p className="pageheader-text">Manage administrator accounts and permissions</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/admin/dashboard" className="breadcrumb-link">Dashboard</a>
                        </li>
                        <li className="breadcrumb-item">
                          <a href="#" className="breadcrumb-link">Accounts</a>
                        </li>
                        <li className="breadcrumb-item active" aria-current="page">Administrators</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Administrator List ({pagination.totalCount} total)</h5>
                    <Link href="/admin/accounts/add-user" className="btn btn-primary">
                      <i className="fas fa-plus mr-2"></i>Add Administrator
                    </Link>
                  </div>
                  <div className="card-body">
                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="row mb-3">
                      <div className="col-md-8">
                        <div className="form-group">
                          <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Search by name, email, or phone..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <button type="submit" className="btn btn-outline-primary mr-2" disabled={loading}>
                          <i className="fas fa-search mr-1"></i>Search
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setSearchInput('');
                            fetchUsers(1, '');
                          }}
                          disabled={loading}
                        >
                          Clear
                        </button>
                      </div>
                    </form>

                    {/* Users Table */}
                    <div className="table-responsive">
                      <table className="table table-striped table-bordered">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Verified</th>
                            <th>Online</th>
                            <th>Joined</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan={10} className="text-center">
                                <i className="fas fa-spinner fa-spin mr-2"></i>Loading...
                              </td>
                            </tr>
                          ) : users.length > 0 ? (
                            users.map((user, index) => (
                              <tr key={user._id}>
                                <td>{((pagination.currentPage - 1) * 30) + index + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {user.profile_image ? (
																			<Image
																				src={user.profile_image} 
                                        alt={user.full_name}
                                        className="rounded-circle mr-2"
																				width={50}
                              					height={50}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
																			/>
                                    ) : (
                                      <div className="avatar-xs rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mr-2">
                                        {user.full_name.charAt(0)}
                                      </div>
                                    )}
                                    {user.full_name}
                                  </div>
                                </td>
                                <td>{user.email_address}</td>
                                <td>{user.phone_number}</td>
                                <td>{user.city ? `${user.city}, ${user.state}` : '-'}</td>
                                <td>
                                  <span className={`badge ${getStatusBadge(user.account_status)}`}>
                                    {user.account_status}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${user.is_verified ? 'badge-success' : 'badge-warning'}`}>
                                    {user.is_verified ? 'Yes' : 'No'}
                                  </span>
                                </td>
                                <td>
                                  <span className={`badge ${user.is_online ? 'badge-success' : 'badge-secondary'}`}>
                                    {user.is_online ? 'Online' : 'Offline'}
                                  </span>
                                </td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                  <div className="">
                                    <Link 
                                      href={`/admin/accounts/edit-user?id=${user._id}`}
                                      className="btn btn-outline-primary btn-sm mr-1"
                                      title="Edit"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </Link>
                                    <button 
                                      className="btn btn-outline-info btn-sm mr-1"
                                      title="View Details"
                                      onClick={() => {/* TODO: Implement view details */}}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="text-center">No administrators found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <nav aria-label="User pagination">
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pagination.currentPage - 1)}
                              disabled={!pagination.hasPrevPage || loading}
                            >
                              Previous
                            </button>
                          </li>
                          
                          {/* Page numbers */}
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNumber;
                            if (pagination.totalPages <= 5) {
                              pageNumber = i + 1;
                            } else if (pagination.currentPage <= 3) {
                              pageNumber = i + 1;
                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                              pageNumber = pagination.totalPages - 4 + i;
                            } else {
                              pageNumber = pagination.currentPage - 2 + i;
                            }
                            
                            return (
                              <li key={pageNumber} className={`page-item ${pagination.currentPage === pageNumber ? 'active' : ''}`}>
                                <button 
                                  className="page-link" 
                                  onClick={() => handlePageChange(pageNumber)}
                                  disabled={loading}
                                >
                                  {pageNumber}
                                </button>
                              </li>
                            );
                          })}
                          
                          <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => handlePageChange(pagination.currentPage + 1)}
                              disabled={!pagination.hasNextPage || loading}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}