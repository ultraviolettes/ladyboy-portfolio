<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Project extends Model implements HasMedia
{
    //
    use InteractsWithMedia;

    protected $fillable = ['title', 'description', 'external_link'];

    public function registerMediaConversions(?Media $media = null): void
    {
        // Les conversions image (thumb/column) ne s'appliquent pas aux vidéos
        if ($media !== null && ! str_starts_with((string) $media->mime_type, 'image/')) {
            return;
        }

        $this->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->format('webp')
            ->optimize()
            ->quality(80)
            ->nonQueued();

        $this->addMediaConversion('column')
            ->width(800)
            ->format('webp')
            ->optimize()
            ->quality(85)
            ->nonQueued();

        // Version optimisée pour l'affichage en grand dans la fiche projet
        // (évite de charger l'original, souvent > 1 Mo)
        $this->addMediaConversion('detail')
            ->width(1400)
            ->format('webp')
            ->optimize()
            ->quality(82)
            ->nonQueued();
    }

    /**
     * Médias formatés pour le front : type (image/vidéo) + URLs.
     */
    public function frontMedia(): \Illuminate\Support\Collection
    {
        return $this->getMedia()->map(function (Media $media) {
            $isImage = str_starts_with((string) $media->mime_type, 'image/');

            return [
                'type' => $isImage ? 'image' : 'video',
                // image -> conversion 'column' (légère) ; vidéo -> fichier original
                'url' => $isImage && $media->hasGeneratedConversion('column')
                    ? $media->getUrl('column')
                    : $media->getUrl(),
                'full' => $isImage && $media->hasGeneratedConversion('detail')
                    ? $media->getUrl('detail')
                    : $media->getUrl(),
            ];
        })->values();
    }

    /**
     * Vignette de la grille : 1re image du projet, sinon 1re vidéo (frame).
     */
    public function gridThumb(): ?array
    {
        $image = $this->getMedia()->first(
            fn (Media $m) => str_starts_with((string) $m->mime_type, 'image/')
        );

        if ($image) {
            return [
                'type' => 'image',
                'url' => $image->hasGeneratedConversion('column') ? $image->getUrl('column') : $image->getUrl(),
                'alt' => $this->title,
                'width' => $image->getCustomProperty('width'),
                'height' => $image->getCustomProperty('height'),
            ];
        }

        $first = $this->getMedia()->first();

        return $first ? ['type' => 'video', 'url' => $first->getUrl(), 'alt' => $this->title] : null;
    }
}
