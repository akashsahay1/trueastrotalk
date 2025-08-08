'use client';

import { useState } from 'react';

interface OrphanedFilesData {
  totalFiles: number;
  referencedFiles: number;
  orphanedFiles: number;
  orphanedFilesList: string[];
  hasMore: boolean;
}

interface CleanupResult {
  deletedCount: number;
  failedCount: number;
  totalSizeFreed: string;
  errors: string[];
  isDryRun: boolean;
}

export default function FileCleanupPage() {
  const [analysisData, setAnalysisData] = useState<OrphanedFilesData | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeFiles = async () => {
    setIsLoading(true);
    setError(null);
    setCleanupResult(null);

    try {
      const response = await fetch('/api/admin/cleanup/orphaned-files');
      const result = await response.json();

      if (result.success) {
        setAnalysisData(result.data);
      } else {
        setError(result.message || 'Failed to analyze files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async (dryRun: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = dryRun 
        ? '/api/admin/cleanup/orphaned-files?dry-run=true'
        : '/api/admin/cleanup/orphaned-files?confirm=true';

      const response = await fetch(url, { method: 'DELETE' });
      const result = await response.json();

      if (result.success) {
        setCleanupResult(result.data);
        // Refresh analysis after cleanup
        if (!dryRun) {
          setTimeout(analyzeFiles, 1000);
        }
      } else {
        setError(result.message || 'Failed to cleanup files');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="page-titles">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><a href="/admin/dashboard">Dashboard</a></li>
          <li className="breadcrumb-item active">File Cleanup</li>
        </ol>
      </div>

      <div className="row">
        <div className="col-lg-12">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Orphaned Files Cleanup</h4>
              <p className="card-subtitle mb-0">
                Find and remove files that are no longer referenced in the database
              </p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {/* Analysis Section */}
              <div className="row">
                <div className="col-md-6">
                  <div className="card border-info">
                    <div className="card-header bg-info text-white">
                      <h5 className="mb-0">📊 File Analysis</h5>
                    </div>
                    <div className="card-body">
                      {!analysisData ? (
                        <p>Click &quot;Analyze Files&quot; to scan for orphaned files.</p>
                      ) : (
                        <div>
                          <div className="row text-center">
                            <div className="col-4">
                              <h3 className="text-primary">{analysisData.totalFiles}</h3>
                              <small>Total Files</small>
                            </div>
                            <div className="col-4">
                              <h3 className="text-success">{analysisData.referencedFiles}</h3>
                              <small>Referenced</small>
                            </div>
                            <div className="col-4">
                              <h3 className="text-warning">{analysisData.orphanedFiles}</h3>
                              <small>Orphaned</small>
                            </div>
                          </div>
                          
                          {analysisData.orphanedFiles > 0 && (
                            <div className="mt-4">
                              <h6>Sample Orphaned Files:</h6>
                              <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {analysisData.orphanedFilesList.map((file, index) => (
                                  <div key={index} className="list-group-item list-group-item-action py-2">
                                    <small className="text-muted">{file}</small>
                                  </div>
                                ))}
                              </div>
                              {analysisData.hasMore && (
                                <small className="text-muted">... and more files</small>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button 
                        className="btn btn-info btn-sm mt-3" 
                        onClick={analyzeFiles}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Analyzing...' : 'Analyze Files'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cleanup Section */}
                <div className="col-md-6">
                  <div className="card border-warning">
                    <div className="card-header bg-warning text-dark">
                      <h5 className="mb-0">🧹 Cleanup Actions</h5>
                    </div>
                    <div className="card-body">
                      {!analysisData ? (
                        <p>Run analysis first to see cleanup options.</p>
                      ) : analysisData.orphanedFiles === 0 ? (
                        <div className="alert alert-success">
                          <strong>✅ No orphaned files found!</strong><br/>
                          Your uploads directory is clean.
                        </div>
                      ) : (
                        <div>
                          <p>Found <strong>{analysisData.orphanedFiles} orphaned files</strong> that can be safely deleted.</p>
                          
                          <div className="btn-group-vertical d-grid gap-2">
                            <button 
                              className="btn btn-outline-warning btn-sm" 
                              onClick={() => runCleanup(true)}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Processing...' : '📝 Preview Deletion (Dry Run)'}
                            </button>
                            
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${analysisData.orphanedFiles} orphaned files? This action cannot be undone.`)) {
                                  runCleanup(false);
                                }
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Deleting...' : '🗑️ Delete All Orphaned Files'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              {cleanupResult && (
                <div className="row mt-4">
                  <div className="col-12">
                    <div className={`card border-${cleanupResult.isDryRun ? 'info' : 'success'}`}>
                      <div className={`card-header bg-${cleanupResult.isDryRun ? 'info' : 'success'} text-white`}>
                        <h5 className="mb-0">
                          {cleanupResult.isDryRun ? '📝 Cleanup Preview' : '✅ Cleanup Results'}
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row text-center">
                          <div className="col-md-3">
                            <h4 className="text-success">{cleanupResult.deletedCount}</h4>
                            <small>{cleanupResult.isDryRun ? 'Would Delete' : 'Deleted'}</small>
                          </div>
                          <div className="col-md-3">
                            <h4 className="text-danger">{cleanupResult.failedCount}</h4>
                            <small>Failed</small>
                          </div>
                          <div className="col-md-3">
                            <h4 className="text-info">{cleanupResult.totalSizeFreed}</h4>
                            <small>Space {cleanupResult.isDryRun ? 'Would Be' : ''} Freed</small>
                          </div>
                          <div className="col-md-3">
                            <h4 className="text-warning">{cleanupResult.errors.length}</h4>
                            <small>Errors</small>
                          </div>
                        </div>

                        {cleanupResult.errors.length > 0 && (
                          <div className="mt-3">
                            <h6>Errors:</h6>
                            <div className="alert alert-warning">
                              {cleanupResult.errors.map((error, index) => (
                                <div key={index}><small>{error}</small></div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Information Section */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="alert alert-info">
                    <h6><strong>ℹ️ How it works:</strong></h6>
                    <ul className="mb-0">
                      <li>Scans all files in the <code>/uploads</code> directory</li>
                      <li>Checks database references in users (profile images), media_files, and products collections</li>
                      <li>Identifies files that exist on disk but are not referenced in the database</li>
                      <li>Safely removes orphaned files to free up disk space</li>
                      <li>Always run a dry-run preview before actual deletion</li>
                    </ul>
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