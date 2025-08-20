'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface AppConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    environment: 'test' | 'live';
  };
  app: {
    name: string;
    version: string;
    minSupportedVersion: string;
  };
  commission: {
    defaultRate: number;
    minimumPayout: number;
  };
}

export default function GeneralSettingsPage() {
	const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper function to get auth token from cookies
  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth-token='));
    return authCookie ? authCookie.split('=')[1] : '';
  };
  const [config, setConfig] = useState<AppConfig>({
    razorpay: {
      keyId: '',
      keySecret: '',
      environment: 'test'
    },
    app: {
      name: 'True Astrotalk',
      version: '1.0.0',
      minSupportedVersion: '1.0.0'
    },
    commission: {
      defaultRate: 25,
      minimumPayout: 1000
    }
  });

  // Load current configuration
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/general', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Configuration saved successfully!');
      } else {
        const error = await response.json();
        console.error('Save failed:', error);
        alert(`Failed to save: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration: ' + error);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (section: keyof AppConfig, field: string, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    document.body.className = '';
  }, []);

  if (loading) {
    return (
      <div className="dashboard-main-wrapper">
        <Header />
        <Sidebar />
        <div className="dashboard-wrapper">
          <div className="dashboard-ecommerce">
            <div className="container-fluid dashboard-content">
              <div className="row">
                <div className="col-xl-12">
                  <div className="text-center">
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p className="mt-3">Loading general options...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  <h2 className="pageheader-title">General Settings</h2>
                  <p className="pageheader-text">Manage general settings</p>
                  <div className="page-breadcrumb">
                    <nav aria-label="breadcrumb">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/admin/dashboard" className="breadcrumb-link">Dashboard</Link></li>
                        <li className="breadcrumb-item">Settings</li>
                        <li className="breadcrumb-item active" aria-current="page">General Settings</li>
                      </ol>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            {/* Razorpay Configuration */}
            <div className="row">
              <div className="col-xl-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title">Payment Gateway Configuration</h5>
                  </div>
                  <div className="card-body">
                    <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="razorpayKeyId">Razorpay Key ID <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              id="razorpayKeyId"
                              value={config.razorpay.keyId}
                              onChange={(e) => handleConfigChange('razorpay', 'keyId', e.target.value)}
                              placeholder="rzp_test_xxxxxxxxx or rzp_live_xxxxxxxxx"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="razorpayKeySecret">Razorpay Key Secret <span className="text-danger">*</span></label>
                            <input
                              type="password"
                              className="form-control"
                              id="razorpayKeySecret"
                              value={config.razorpay.keySecret}
                              onChange={(e) => handleConfigChange('razorpay', 'keySecret', e.target.value)}
                              placeholder="Enter Razorpay secret key"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="form-group">
                            <label htmlFor="razorpayEnvironment">Environment</label>
                            <select
                              className="form-control"
                              id="razorpayEnvironment"
                              value={config.razorpay.environment}
                              onChange={(e) => handleConfigChange('razorpay', 'environment', e.target.value)}
                            >
                              <option value="test">Test</option>
                              <option value="live">Live</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* App Configuration */}
            <div className="row">
              <div className="col-xl-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title">App Configuration</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="appName">App Name</label>
                          <input
                            type="text"
                            className="form-control"
                            id="appName"
                            value={config.app.name}
                            onChange={(e) => handleConfigChange('app', 'name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="appVersion">Current Version</label>
                          <input
                            type="text"
                            className="form-control"
                            id="appVersion"
                            value={config.app.version}
                            onChange={(e) => handleConfigChange('app', 'version', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="minVersion">Minimum Supported Version</label>
                          <input
                            type="text"
                            className="form-control"
                            id="minVersion"
                            value={config.app.minSupportedVersion}
                            onChange={(e) => handleConfigChange('app', 'minSupportedVersion', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Configuration */}
            <div className="row">
              <div className="col-xl-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="card-title">Business Configuration</h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="commissionRate">Default Commission Rate (%)</label>
                          <input
                            type="number"
                            className="form-control"
                            id="commissionRate"
                            value={config.commission.defaultRate}
                            onChange={(e) => handleConfigChange('commission', 'defaultRate', parseInt(e.target.value) || 0)}
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="minimumPayout">Minimum Payout (₹)</label>
                          <input
                            type="number"
                            className="form-control"
                            id="minimumPayout"
                            value={config.commission.minimumPayout}
                            onChange={(e) => handleConfigChange('commission', 'minimumPayout', parseInt(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="row">
              <div className="col-xl-12">
                <div className="card">
                  <div className="card-body">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={saveConfig}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Configuration
                        </>
                      )}
                    </button>
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