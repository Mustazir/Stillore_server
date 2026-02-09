import cloudinary from '../config/cloudinary';

// Extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');

    if (uploadIndex === -1) return null;

    // Get everything after 'upload/v1234567890/'
    const pathParts = parts.slice(uploadIndex + 2); // Skip 'upload' and version
    const fullPath = pathParts.join('/');

    // Remove file extension
    const publicId = fullPath.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

// Delete single image from Cloudinary
export const deleteImageFromCloudinary = async (imageUrl: string): Promise<boolean> => {
  try {
    const publicId = getPublicIdFromUrl(imageUrl);

    if (!publicId) {
      console.error('Could not extract public_id from URL:', imageUrl);
      return false;
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      console.log('✅ Image deleted from Cloudinary:', publicId);
      return true;
    } else {
      console.error('❌ Failed to delete image:', result);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

// Delete multiple images from Cloudinary
export const deleteImagesFromCloudinary = async (imageUrls: string[]): Promise<void> => {
  const deletePromises = imageUrls.map(url => deleteImageFromCloudinary(url));
  await Promise.all(deletePromises);
};