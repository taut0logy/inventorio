import React, { useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pencil, Loader2, AlertCircle } from 'lucide-react';
import { t } from '@/lib/i18n';

/**
 * Facebook-style avatar upload component with pen icon overlay.
 * Clicking the avatar opens the file selector.
 */
export default function AvatarUpload({ 
    currentAvatarUrl, 
    userName,
    name = "avatar",
    onPreviewChange,
    maxSizeMB = 1,
    className = ""
}) {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(currentAvatarUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setError(t('avatar.error.type', 'Please select a JPG, PNG, GIF, or WebP image.'));
            return;
        }

        // Validate file size
        const maxBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setError(t('avatar.error.size', `Image must be smaller than ${maxSizeMB}MB.`));
            return;
        }

        setIsLoading(true);

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setIsLoading(false);
            if (onPreviewChange) {
                onPreviewChange(reader.result, file);
            }
        };
        reader.onerror = () => {
            setError(t('avatar.error.read', 'Failed to read image file.'));
            setIsLoading(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className={`flex items-start gap-6 ${className}`}>
            {/* Avatar with pen icon */}
            <div className="flex flex-col items-center">
                <div 
                    className="relative cursor-pointer group"
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleClick()}
                    style={{ width: '96px', height: '96px' }}
                >
                    {/* Avatar */}
                    <Avatar className="h-24 w-24 border-2 border-muted">
                        {isLoading ? (
                            <AvatarFallback className="bg-muted">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </AvatarFallback>
                        ) : (
                            <>
                                <AvatarImage src={preview} alt={userName} />
                                <AvatarFallback className="text-xl">
                                    {getInitials(userName)}
                                </AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    
                    {/* Pen icon overlay - bottom right of circle */}
                    <div 
                        className="absolute bg-primary text-primary-foreground rounded-full p-2 shadow-lg transition-all group-hover:scale-110"
                        style={{ bottom: '4px', right: '4px' }}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </div>
                </div>

                {/* Caption below avatar */}
                <p className="text-sm text-muted-foreground mt-2 text-center">
                    {t('profile.field.avatar_help', 'JPG, GIF or PNG. Max 1MB.')}
                </p>
                
                {/* Error message */}
                {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input 
                type="file"
                ref={fileInputRef}
                name={name}
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
            />
        </div>
    );
}
