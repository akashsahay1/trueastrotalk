'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';

interface MediaFile {
  _id: string;
  file_name: string;
  filename?: string; // backward compatibility
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  uploaded_at?: string; // backward compatibility
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string, mediaId?: string) => void;
  selectedImage?: string;
}

type ViewMode = 'grid' | 'list';

export default function MediaLibrary({ isOpen, onClose, onSelect, selectedImage }: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedImage || null);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFiles, setUploadingFiles] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarFile, setSidebarFile] = useState<MediaFile | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedFile(selectedImage || null);
  }, [selectedImage]);

  // Filter files based on search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return mediaFiles;
    
    const query = searchQuery.toLowerCase().trim();
    return mediaFiles.filter(file => 
      file.original_name.toLowerCase().includes(query) ||
      (file.file_name || file.filename || '').toLowerCase().includes(query)
    );
  }, [mediaFiles, searchQuery]);

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/media');
      if (response.ok) {
        const data = await response.json();
        setMediaFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching media files:', error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Validate all files
    const invalidFiles = fileArray.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      errorMessages.updateFailed(`Please select only image files. ${invalidFiles.length} non-image file(s) detected.`);
      event.target.value = '';
      return;
    }

    // Validate file sizes (max 10MB each)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      errorMessages.updateFailed(`${oversizedFiles.length} file(s) exceed 10MB limit`);
      event.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadingFiles(fileArray.length);
    setCurrentFileIndex(0);

    let successCount = 0;
    let failCount = 0;
    let lastUploadedPath = '';
    let lastUploadedId = '';

    // Upload files sequentially to show progress
    for (let i = 0; i < fileArray.length; i++) {
      setCurrentFileIndex(i + 1);
      const file = fileArray[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const xhr = new XMLHttpRequest();
        
        // Create a promise for each upload
        await new Promise<void>((resolve) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              // Calculate overall progress
              const fileProgress = (e.loaded / e.total) * 100;
              const overallProgress = ((i * 100) + fileProgress) / fileArray.length;
              setUploadProgress(overallProgress);
            }
          });

          xhr.onload = function() {
            if (xhr.status === 200 || xhr.status === 201) {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                successCount++;
                lastUploadedPath = response.file_path;
                lastUploadedId = response.file_id?.toString() || response.file_id;
              } else {
                failCount++;
              }
            } else {
              failCount++;
            }
            resolve();
          };

          xhr.onerror = function() {
            failCount++;
            resolve();
          };

          xhr.open('POST', '/api/admin/media/upload');
          xhr.send(formData);
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        failCount++;
      }
    }

    // Show results
    if (successCount > 0 && failCount === 0) {
      successMessages.created(`${successCount} file(s) uploaded successfully`);
      fetchMediaFiles(); // Refresh the media files
      // Select the last uploaded file
      if (lastUploadedPath) {
        setSelectedFile(lastUploadedPath);
        setSelectedMediaId(lastUploadedId);
      }
    } else if (successCount > 0 && failCount > 0) {
      errorMessages.updateFailed(`${successCount} file(s) uploaded, ${failCount} failed`);
      fetchMediaFiles();
    } else {
      errorMessages.updateFailed('All uploads failed');
    }

    setUploading(false);
    setUploadProgress(0);
    setUploadingFiles(0);
    setCurrentFileIndex(0);

    // Reset the input
    event.target.value = '';
  };

  const handleDeleteFile = async (fileId: string) => {
    const confirmed = await confirmDialogs.deleteItem('file');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/media/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMediaFiles();
        // If the deleted file was selected, clear selection
        const deletedFile = mediaFiles.find(f => f._id === fileId);
        if (deletedFile && selectedFile === deletedFile.file_path) {
          setSelectedFile(null);
          setSelectedMediaId(null);
        }
        // Close sidebar if showing deleted file
        if (sidebarFile?._id === fileId) {
          setShowSidebar(false);
          setSidebarFile(null);
        }
        successMessages.deleted('File');
      } else {
        errorMessages.deleteFailed('file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      errorMessages.deleteFailed('file');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const confirmed = await confirmDialogs.deleteItem(`${selectedFiles.size} file(s)`);
    if (!confirmed) return;

    try {
      const deletePromises = Array.from(selectedFiles).map(fileId =>
        fetch(`/api/admin/media/${fileId}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);
      fetchMediaFiles();
      setSelectedFiles(new Set());
      setShowSidebar(false);
      setSidebarFile(null);
      successMessages.deleted(`${selectedFiles.size} file(s)`);
    } catch (error) {
      console.error('Error deleting files:', error);
      errorMessages.deleteFailed('files');
    }
  };

  const handleFileClick = (file: MediaFile) => {
    if (viewMode === 'grid') {
      // In grid view, clicking opens sidebar
      setSidebarFile(file);
      setShowSidebar(true);
    } else {
      // In list view, clicking selects
      setSelectedFile(file.file_path);
      setSelectedMediaId(file._id);
    }
  };

  const handleFileSelect = (fileId: string, isChecked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (isChecked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAllFiles = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedFiles(new Set(filteredFiles.map(f => f._id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile, selectedMediaId || undefined);
      onClose();
    }
  };

  const handleSidebarSelect = () => {
    if (sidebarFile) {
      setSelectedFile(sidebarFile.file_path);
      setSelectedMediaId(sidebarFile._id);
      onSelect(sidebarFile.file_path, sidebarFile._id);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (file: MediaFile) => {
    const dateString = file.created_at || file.uploaded_at || '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl" style={{ height: '90vh', margin: '5vh auto', maxHeight: '90vh' }}>
        <div className="modal-content" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="modal-header" style={{ flexShrink: 0 }}>
            <h5 className="modal-title">Media Library</h5>
            <button
              type="button"
              className="close"
              onClick={onClose}
            >
              <span>&times;</span>
            </button>
          </div>
          
          <div className="modal-body p-0" style={{ flex: 1, overflowY: 'hidden', display: 'flex' }}>
            {/* Main content area */}
            <div style={{ flex: showSidebar ? '1 1 70%' : '1 1 100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Toolbar */}
              <div className="p-3 border-bottom">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <label className="btn btn-primary btn-sm">
                      <i className="fas fa-upload"></i> Upload Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        disabled={uploading}
                      />
                    </label>
                    {viewMode === 'list' && selectedFiles.size > 0 && (
                      <button
                        className="btn btn-danger btn-sm ml-2"
                        onClick={handleBulkDelete}
                      >
                        <i className="fas fa-trash"></i> Delete Selected ({selectedFiles.size})
                      </button>
                    )}
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4 text-right">
                    <div className="d-flex align-items-center justify-content-end">
                      <button
                        type="button"
                        className={`btn btn-link p-2 ${viewMode === 'grid' ? 'text-primary' : 'text-muted'}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid View"
                      >
                        <i className="fas fa-th fa-lg"></i>
                      </button>
                      <button
                        type="button"
                        className={`btn btn-link p-2 ${viewMode === 'list' ? 'text-primary' : 'text-muted'}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                      >
                        <i className="fas fa-list fa-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="mt-3">
                    {uploadingFiles > 1 && (
                      <div className="mb-1">
                        <small className="text-muted">
                          Uploading file {currentFileIndex} of {uploadingFiles}
                        </small>
                      </div>
                    )}
                    <div className="progress" style={{ height: '6px' }}>
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar" 
                        style={{ width: `${uploadProgress}%` }}
                      >
                      </div>
                    </div>
                    <small className="text-muted">Uploading... {Math.round(uploadProgress)}%</small>
                  </div>
                )}
              </div>

              {/* Media content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">
                      {searchQuery ? 'No files match your search criteria.' : 'No images uploaded yet. Upload your first image to get started.'}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Grid View - 6 images per row, no buttons */
                  <div className="row">
                    {filteredFiles.map((file) => (
                      <div key={file._id} className="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-12 mb-3">
                        <div 
                          className={`card h-100 ${selectedFile === file.file_path ? 'border-primary' : ''} ${sidebarFile?._id === file._id ? 'shadow-sm border-info' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleFileClick(file)}
                        >
                          <div 
                            className="card-img-top d-flex align-items-center justify-content-center"
                            style={{ height: '120px', overflow: 'hidden', backgroundColor: '#f8f9fa', position: 'relative' }}
                          >
                            <Image
                              src={file.file_path}
                              alt={file.original_name}
                              style={{ objectFit: 'cover' }}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 16vw"
                            />
                          </div>
                          <div className="card-body p-2">
                            <h6 className="card-title text-truncate mb-1 small" title={file.original_name}>
                              {file.original_name}
                            </h6>
                            <small className="text-muted d-block">
                              {formatFileSize(file.file_size)}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* List View - with checkboxes and bulk actions */
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>
                            <input
                              type="checkbox"
                              checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                              onChange={(e) => handleSelectAllFiles(e.target.checked)}
                            />
                          </th>
                          <th style={{ width: '80px' }}>Preview</th>
                          <th>Name</th>
                          <th style={{ width: '100px' }}>Size</th>
                          <th style={{ width: '150px' }}>Date</th>
                          <th style={{ width: '140px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFiles.map((file) => (
                          <tr key={file._id} className={selectedFile === file.file_path ? 'table-active' : ''}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedFiles.has(file._id)}
                                onChange={(e) => handleFileSelect(file._id, e.target.checked)}
                              />
                            </td>
                            <td>
                              <div style={{ width: '60px', height: '40px', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                                <Image
                                  src={file.file_path}
                                  alt={file.original_name}
                                  style={{ objectFit: 'cover' }}
                                  fill
                                  sizes="60px"
                                />
                              </div>
                            </td>
                            <td>
                              <div 
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleFileClick(file)}
                              >
                                <strong>{file.original_name}</strong>
                                <br />
                                <small className="text-muted">{file.file_name || file.filename}</small>
                              </div>
                            </td>
                            <td>{formatFileSize(file.file_size)}</td>
                            <td>
                              <small>{formatDate(file)}</small>
                            </td>
                            <td className="media-actions-cell">
                              <button
                                className={`btn ${selectedFile === file.file_path ? 'btn-primary' : 'btn-outline-primary'} btn-sm media-select-btn`}
                                onClick={() => {
                                  setSelectedFile(file.file_path);
                                  setSelectedMediaId(file._id);
                                }}
                              >
                                {selectedFile === file.file_path ? 'Selected' : 'Select'}
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm media-delete-btn"
                                onClick={() => handleDeleteFile(file._id)}
                                title="Delete"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {showSidebar && sidebarFile && (
              <div style={{ flex: '0 0 30%', borderLeft: '1px solid #dee2e6', display: 'flex', flexDirection: 'column' }}>
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">File Details</h6>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary" 
                    onClick={() => setShowSidebar(false)}
                    title="Close"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {/* Image Preview */}
                  <div className="p-3 text-center" style={{ borderBottom: '1px solid #dee2e6' }}>
                    <div style={{ position: 'relative', width: '200px', height: '150px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}>
                      <Image
                        src={sidebarFile.file_path}
                        alt={sidebarFile.original_name}
                        style={{ objectFit: 'cover' }}
                        fill
                        sizes="200px"
                      />
                    </div>
                  </div>
                  
                  {/* File Details */}
                  <div className="p-3">
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">File Name</label>
                      <p className="mb-0 small">{sidebarFile.original_name}</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">File Size</label>
                      <p className="mb-0 small">{formatFileSize(sidebarFile.file_size)}</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">Type</label>
                      <p className="mb-0 small">{sidebarFile.mime_type}</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">Uploaded</label>
                      <p className="mb-0 small">{formatDate(sidebarFile)}</p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label small text-muted mb-1">File Path</label>
                      <p className="mb-0 small text-break">{sidebarFile.file_path}</p>
                    </div>
                  </div>
                </div>
                
                {/* Sidebar Actions */}
                <div className="p-3 border-top">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm w-100 mb-2"
                    onClick={handleSidebarSelect}
                  >
                    <i className="fas fa-check"></i> Select This File
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm w-100"
                    onClick={() => handleDeleteFile(sidebarFile._id)}
                  >
                    <i className="fas fa-trash"></i> Delete File
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid #dee2e6' }}>
            <div className="d-flex justify-content-between align-items-center w-100">
              <div>
                {selectedFile && (
                  <small className="text-muted">
                    Selected: {mediaFiles.find(f => f.file_path === selectedFile)?.original_name}
                  </small>
                )}
              </div>
              <div className="modal-footer-buttons">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSelect}
                  disabled={!selectedFile}
                >
                  Select Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}