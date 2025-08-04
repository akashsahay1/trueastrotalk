'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { confirmDialogs, successMessages, errorMessages } from '@/lib/sweetalert';

interface MediaFile {
  _id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  selectedImage?: string;
}

export default function MediaLibrary({ isOpen, onClose, onSelect, selectedImage }: MediaLibraryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(selectedImage || null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchMediaFiles();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedFile(selectedImage || null);
  }, [selectedImage]);

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
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.onload = function() {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            fetchMediaFiles(); // Refresh the media files
            setSelectedFile(response.file_path);
          } else {
            alert(response.message || 'Upload failed');
          }
        } else {
          alert('Upload failed');
        }
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.onerror = function() {
        alert('Upload failed');
        setUploading(false);
        setUploadProgress(0);
      };

      xhr.open('POST', '/api/admin/media/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }

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

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
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
          
          <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {/* Upload Section */}
            <div className="mb-4">
              <div className="row">
                <div className="col-md-6">
                  <label className="btn btn-primary">
                    <i className="fas fa-upload"></i> Upload New Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="col-md-6">
                  {uploading && (
                    <div>
                      <div className="progress">
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{ width: `${uploadProgress}%` }}
                        >
                          {Math.round(uploadProgress)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Media Grid */}
            <div style={{ minHeight: '200px' }}>
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="row">
                  {mediaFiles.length === 0 ? (
                    <div className="col-12 text-center py-5">
                      <p className="text-muted">No images uploaded yet. Upload your first image to get started.</p>
                    </div>
                  ) : (
                    mediaFiles.map((file) => (
                      <div key={file._id} className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3">
                      <div 
                        className={`card h-100 ${selectedFile === file.file_path ? 'border-primary' : ''}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div 
                          className="card-img-top d-flex align-items-center justify-content-center"
                          style={{ height: '150px', overflow: 'hidden', backgroundColor: '#f8f9fa', position: 'relative' }}
                          onClick={() => setSelectedFile(file.file_path)}
                        >
                          <Image
                            src={file.file_path}
                            alt={file.original_name}
                            style={{ 
                              objectFit: 'cover' 
                            }}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                        <div className="card-body p-2">
                          <h6 className="card-title text-truncate mb-1" title={file.original_name}>
                            {file.original_name}
                          </h6>
                          <small className="text-muted d-block">
                            {formatFileSize(file.file_size)}
                          </small>
                          <small className="text-muted d-block">
                            {new Date(file.uploaded_at).toLocaleDateString()}
                          </small>
                        </div>
                        <div className="card-footer p-2">
                          <div className="d-flex justify-content-between">
                            <button
                              className={`btn btn-sm ${selectedFile === file.file_path ? 'btn-primary' : 'btn-outline-primary'}`}
                              onClick={() => setSelectedFile(file.file_path)}
                            >
                              {selectedFile === file.file_path ? 'Selected' : 'Select'}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteFile(file._id)}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer" style={{ flexShrink: 0, borderTop: '1px solid #dee2e6' }}>
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
  );
}