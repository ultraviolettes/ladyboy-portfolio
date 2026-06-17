<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Throwable;

class MediaDimensions
{
    /**
     * Lit la largeur/hauteur d'un média image via son disque (local OU S3/object
     * storage) et les stocke en custom properties. Retourne true si stockées.
     *
     * On lit le fichier via Storage::disk (pas getPath()) pour fonctionner sur
     * Laravel Cloud où les médias sont sur un disque distant.
     */
    public static function store(Media $media, bool $force = false): bool
    {
        if (! str_starts_with((string) $media->mime_type, 'image/')) {
            return false;
        }

        if (! $force && $media->getCustomProperty('width') && $media->getCustomProperty('height')) {
            return false;
        }

        try {
            $contents = Storage::disk($media->disk)->get($media->getPathRelativeToRoot());
        } catch (Throwable) {
            return false;
        }

        if (! $contents) {
            return false;
        }

        $size = @getimagesizefromstring($contents);

        if ($size === false) {
            return false;
        }

        $media->setCustomProperty('width', $size[0]);
        $media->setCustomProperty('height', $size[1]);
        $media->save();

        return true;
    }
}
