<?php

namespace App\Service;

use Cloudinary\Cloudinary;
use Cloudinary\Api\Upload\UploadApi;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Service wrapper for Cloudinary image uploads.
 */
class CloudinaryService
{
    private Cloudinary $cloudinary;

    public function __construct(string $cloudinaryUrl)
    {
        $this->cloudinary = new Cloudinary($cloudinaryUrl);
    }

    /**
     * Upload an image to Cloudinary.
     *
     * @param UploadedFile $file The uploaded file
     * @param string $folder The folder in Cloudinary (e.g., 'avatars')
     * @param string|null $publicId Optional public ID for the image
     * @return array{url: string, public_id: string} Upload result
     */
    public function upload(UploadedFile $file, string $folder = 'avatars', ?string $publicId = null): array
    {
        $options = [
            'folder' => $folder,
            'resource_type' => 'image',
            'transformation' => [
                'width' => 400,
                'height' => 400,
                'crop' => 'fill',
                'gravity' => 'face',
                'quality' => 'auto',
                'fetch_format' => 'auto',
            ],
        ];

        if ($publicId) {
            $options['public_id'] = $publicId;
            $options['overwrite'] = true;
        }

        $result = $this->cloudinary->uploadApi()->upload(
            $file->getPathname(),
            $options
        );

        return [
            'url' => $result['secure_url'],
            'public_id' => $result['public_id'],
        ];
    }

    /**
     * Delete an image from Cloudinary.
     *
     * @param string $publicId The public ID of the image to delete
     * @return bool Whether the deletion was successful
     */
    public function delete(string $publicId): bool
    {
        try {
            $result = $this->cloudinary->uploadApi()->destroy($publicId);
            return $result['result'] === 'ok';
        } catch (\Exception $e) {
            return false;
        }
    }
}
