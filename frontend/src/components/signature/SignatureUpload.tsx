
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image } from 'lucide-react';

interface SignatureUploadProps {
  uploadedImage: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
}

const SignatureUpload: React.FC<SignatureUploadProps> = ({
  uploadedImage,
  onImageUpload,
  onRemoveImage,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setIsLoading(true);
      setTimeout(() => {
        onImageUpload(event);
        setIsLoading(false);
      }, 100);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Upload Your Signature</h3>
          
          {!uploadedImage ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-gray-700 mb-2">Drop your signature image here or click to browse</p>
                  <p className="text-sm text-gray-500">Supports JPG, PNG files up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="signature-upload"
                  disabled={isLoading}
                />
                <label htmlFor="signature-upload">
                  <Button 
                    type="button" 
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    {isLoading ? 'Processing...' : 'Choose File'}
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={uploadedImage}
                  alt="Uploaded signature"
                  className="max-w-full max-h-48 rounded-lg shadow-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={onRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                <Image className="w-4 h-4 inline mr-1" />
                Signature uploaded successfully
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureUpload;
