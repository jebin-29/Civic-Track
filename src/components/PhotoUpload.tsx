import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { usePhotoUpload } from '@/hooks/use-photo-upload';
import { cn } from '@/lib/utils';

interface PhotoUploadProps {
  maxPhotos?: number;
  maxFileSize?: number;
  onPhotosChange?: (photos: any[]) => void;
  className?: string;
}

export const PhotoUpload = ({
  maxPhotos = 5,
  maxFileSize = 10,
  onPhotosChange,
  className
}: PhotoUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const {
    photos,
    uploading,
    addPhotos,
    removePhoto,
    maxPhotos: hookMaxPhotos,
    maxFileSize: hookMaxFileSize
  } = usePhotoUpload(maxPhotos, maxFileSize);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      addPhotos(files);
      onPhotosChange?.(Array.from(files));
    }
  }, [addPhotos, onPhotosChange]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      addPhotos(files);
      onPhotosChange?.(Array.from(files));
    }
  }, [addPhotos, onPhotosChange]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dropZoneRef.current?.classList.add('border-primary', 'bg-primary/5');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dropZoneRef.current?.classList.remove('border-primary', 'bg-primary/5');
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label>Add/Upload Photos</Label>

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300',
          'bg-gradient-to-br from-blue-50 to-purple-50',
          'hover:shadow-lg hover:scale-[1.01]',
          'border-gray-300 hover:border-blue-400',
          photos.length === 0 && 'min-h-[160px] flex items-center justify-center'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <div className="bg-white p-4 rounded-full shadow-md">
              <Camera className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-base font-medium text-gray-700">
              Upload Photos up to {maxPhotos} photos
            </p>
            <p className="text-base font-medium text-gray-700">
              Click to upload or drag and drop images
            </p>
            <Button className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg" type="button" onClick={(e) => e.stopPropagation()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {photos.length} of {maxPhotos} photos selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileDialog();
                }}
                disabled={photos.length >= maxPhotos}
              >
                <Upload className="w-4 h-4 mr-2" />
                Add More
              </Button>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-7 h-7 p-0 rounded-full opacity-0 group-hover:opacity-100 transition bg-black/60 hover:bg-red-600" onClick={(e) => {
                      e.stopPropagation();
                      removePhoto(photo.id);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>

                  {/* Status Indicators */}
                  <div className="absolute bottom-1 left-1">
                    {photo.error ? (
                      <div className="flex items-center gap-1 bg-destructive text-destructive-foreground px-2 py-1 rounded-full text-xs shadow">
                        <AlertCircle className="w-3 h-3" />
                        Error
                      </div>
                    ) : photo.uploaded ? (
                      <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs shadow">
                        <CheckCircle className="w-3 h-3" />
                        Uploaded
                      </div>
                    ) : uploading ? (
                      <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs shadow">
                        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Uploading
                      </div>
                    ) : null}
                  </div>

                  {/* File Info */}
                  <div className="mt-1 text-xs text-gray-500 truncate text-center">
                    {photo.file.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Uploading photos...</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '60%' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Requirements */}
      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg border">
        <p>• Maximum {maxPhotos} photos allowed</p>
        <p>• Maximum file size: {maxFileSize}MB per photo</p>
        <p>• Supported formats: JPG, PNG, GIF, WebP</p>
      </div>
    </div>
  );
}; 