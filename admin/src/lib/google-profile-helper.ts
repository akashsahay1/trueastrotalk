import { UploadService } from './upload-service';

/**
 * Helper functions for handling Google OAuth profile images
 * in the centralized media library system
 */

export interface GoogleProfileData {
  userId: string;
  name: string;
  email: string;
  picture?: string;
}

/**
 * Register Google profile image in media library and update user profile
 * This should be called during Google OAuth login/registration
 */
export async function handleGoogleProfileImage(profileData: GoogleProfileData) {
  const { picture } = profileData;

  if (!picture) {
    return null; // No profile image to process
  }

  try {
    // Register Google profile image as external image in media library
    const result = await UploadService.registerExternalImage();

    if (result.success) {
      return {
        mediaId: result.file_id,
        imageUrl: picture,
        isExternal: true
      };
    } else {
      console.error('Failed to register Google profile image:', result.error);
      return null;
    }

  } catch (error) {
    console.error('Error handling Google profile image:', error);
    return null;
  }
}

/**
 * Check if an image URL is from Google's servers
 */
export function isGoogleProfileImage(imageUrl: string): boolean {
  return imageUrl.includes('googleusercontent.com') || 
         imageUrl.includes('google.com/') ||
         imageUrl.includes('lh3.googleusercontent.com') ||
         imageUrl.includes('lh4.googleusercontent.com') ||
         imageUrl.includes('lh5.googleusercontent.com') ||
         imageUrl.includes('lh6.googleusercontent.com');
}

/**
 * Determine if an image is internal (uploaded to our server) or external
 */
export function isInternalImage(imageUrl: string): boolean {
  return imageUrl.startsWith('/uploads/') || 
         imageUrl.includes('/uploads/');
}

/**
 * Get media library statistics for different image sources
 */
export async function getImageSourceStats() {
  try {
    const response = await fetch('/api/admin/media?limit=1'); // Just get stats
    const data = await response.json();
    
    if (data.success && data.statistics) {
      return {
        fileTypes: data.statistics.file_types,
        sources: data.statistics.sources,
        totalFiles: data.pagination.total
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching media stats:', error);
    return null;
  }
}