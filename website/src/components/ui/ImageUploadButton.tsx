import { useRef } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';

export interface ImageUploadButtonProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  uploading?: boolean;
  aspect?: 'square' | 'cover';
  className?: string;
}

export function ImageUploadButton({
  label,
  currentUrl,
  onUpload,
  onDelete,
  uploading,
  aspect = 'square',
  className = '',
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className={`relative group ${aspect === 'cover' ? 'w-full h-36' : 'w-24 h-24'} cursor-pointer ${className}`}
         onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
             className="hidden" onChange={handleFileChange} />

      {currentUrl ? (
        <img src={currentUrl} alt={label}
             className={`w-full h-full object-cover ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`} />
      ) : (
        <div className={`w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400 font-bold text-center px-1">{label}</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] text-white font-bold">Change</span>
          </>
        )}
      </div>

      {/* Delete button */}
      {currentUrl && !uploading && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
