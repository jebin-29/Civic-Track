import { useState, useCallback } from 'react';

interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
  uploaded: boolean;
  error?: string;
}

interface UsePhotoUploadReturn {
  photos: UploadedPhoto[];
  uploading: boolean;
  addPhotos: (files: FileList | File[]) => void;
  removePhoto: (id: string) => void;
  uploadPhotos: () => Promise<string[]>;
  clearPhotos: () => void;
  maxPhotos: number;
  maxFileSize: number; // in MB
}

export const usePhotoUpload = (maxPhotos: number = 5, maxFileSize: number = 10): UsePhotoUploadReturn => {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return 'File must be an image';
    }

    // Check file size (convert MB to bytes)
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    return null;
  }, [maxFileSize]);

  const addPhotos = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newPhotos: UploadedPhoto[] = [];

    fileArray.forEach((file) => {
      const error = validateFile(file);
      
      if (error) {
        console.error(`File ${file.name}: ${error}`);
        return;
      }

      if (photos.length + newPhotos.length >= maxPhotos) {
        console.warn(`Maximum ${maxPhotos} photos allowed`);
        return;
      }

      const photo: UploadedPhoto = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        uploaded: false
      };

      newPhotos.push(photo);
    });

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length, maxPhotos, validateFile]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const uploadPhotos = useCallback(async (): Promise<string[]> => {
    if (photos.length === 0) {
      return [];
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      // Simulate upload to backend
      for (const photo of photos) {
        if (photo.uploaded) {
          uploadedUrls.push(photo.preview);
          continue;
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simulate upload success/failure
        const success = Math.random() > 0.1; // 90% success rate

        if (success) {
          // In real app, this would be the URL returned from the server
          const uploadedUrl = `https://api.civictrack.com/uploads/${photo.id}.jpg`;
          uploadedUrls.push(uploadedUrl);
          
          setPhotos(prev => prev.map(p => 
            p.id === photo.id 
              ? { ...p, uploaded: true, preview: uploadedUrl }
              : p
          ));
        } else {
          setPhotos(prev => prev.map(p => 
            p.id === photo.id 
              ? { ...p, error: 'Upload failed' }
              : p
          ));
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }

    return uploadedUrls;
  }, [photos]);

  const clearPhotos = useCallback(() => {
    photos.forEach(photo => {
      URL.revokeObjectURL(photo.preview);
    });
    setPhotos([]);
  }, [photos]);

  return {
    photos,
    uploading,
    addPhotos,
    removePhoto,
    uploadPhotos,
    clearPhotos,
    maxPhotos,
    maxFileSize
  };
}; 