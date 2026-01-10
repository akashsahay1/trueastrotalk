import DatabaseService from '@/lib/database';

/**
 * Media Model - handles all media-related database operations
 */
export class Media {
  media_id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_type: string;
  uploaded_by: string;
  is_external: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<Media>) {
    this.media_id = data.media_id || '';
    this.filename = data.filename || '';
    this.original_name = data.original_name || '';
    this.file_path = data.file_path || '';
    this.file_size = data.file_size || 0;
    this.mime_type = data.mime_type || '';
    this.file_type = data.file_type || '';
    this.uploaded_by = data.uploaded_by || '';
    this.is_external = data.is_external || false;
    this.created_at = data.created_at || new Date();
    this.updated_at = data.updated_at || new Date();
  }

  /**
   * Find media by media_id
   */
  static async findByMediaId(mediaId: string): Promise<Media | null> {
    if (!mediaId || typeof mediaId !== 'string' || mediaId.trim() === '') {
      return null;
    }

    try {
      const collection = await DatabaseService.getCollection('media');
      const doc = await collection.findOne({ media_id: mediaId });
      return doc ? new Media(doc as unknown as Partial<Media>) : null;
    } catch (error) {
      console.error('Error finding media:', error);
      return null;
    }
  }

  /**
   * Resolve profile image URL from user's profile_image_id
   */
  static async resolveProfileImage(
    user: Record<string, unknown>,
    baseUrl: string
  ): Promise<string | null> {
    const profileImageId = user.profile_image_id;

    if (!profileImageId || typeof profileImageId !== 'string' || profileImageId.trim() === '') {
      return null;
    }

    const media = await Media.findByMediaId(profileImageId);
    if (!media || !media.file_path) {
      return null;
    }

    // External URLs return as-is, local paths get baseUrl prepended
    if (media.file_path.startsWith('http')) {
      return media.file_path;
    }
    return `${baseUrl}${media.file_path}`;
  }

  /**
   * Resolve any media_id to full URL
   */
  static async resolveUrl(mediaId: string, baseUrl: string): Promise<string | null> {
    const media = await Media.findByMediaId(mediaId);
    if (!media || !media.file_path) {
      return null;
    }

    if (media.file_path.startsWith('http')) {
      return media.file_path;
    }
    return `${baseUrl}${media.file_path}`;
  }

  /**
   * Generate a new media_id
   * @param timestamp - Optional timestamp to use (for consistency with filename timestamps)
   */
  static generateMediaId(timestamp?: number): string {
    const ts = timestamp || Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `media_${ts}_${random}`;
  }

  /**
   * Create a new media entry for external image (e.g., Google profile)
   */
  static async createExternalImage(
    imageUrl: string,
    fileType: string,
    uploadedBy: string
  ): Promise<{ mediaId: string; filePath: string } | null> {
    try {
      const mediaId = Media.generateMediaId();
      const now = new Date();

      const collection = await DatabaseService.getCollection('media');
      await collection.insertOne({
        media_id: mediaId,
        filename: 'external_image',
        original_name: 'external_profile.jpg',
        file_path: imageUrl,
        file_size: 0,
        mime_type: 'image/jpeg',
        file_type: fileType,
        uploaded_by: uploadedBy,
        is_external: true,
        created_at: now,
        updated_at: now
      });

      return { mediaId, filePath: imageUrl };
    } catch (error) {
      console.error('Error creating external image:', error);
      return null;
    }
  }
}

export default Media;
