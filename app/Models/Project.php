<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Project extends Model implements HasMedia
{
    //
    use InteractsWithMedia;

    protected $fillable = ['title', 'slug', 'description', 'external_link'];

    protected static function booted(): void
    {
        static::saving(function (self $project): void {
            // Le slug n'est généré qu'une fois : une URL déjà partagée (ou déjà
            // comptée dans les stats) ne doit jamais changer si le titre évolue.
            if (blank($project->slug)) {
                $project->slug = $project->generateUniqueSlug();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function generateUniqueSlug(): string
    {
        $base = Str::slug((string) $this->title) ?: 'projet';
        $slug = $base;
        $suffix = 2;

        while (static::where('slug', $slug)->whereKeyNot($this->getKey())->exists()) {
            $slug = $base . '-' . $suffix++;
        }

        return $slug;
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        // Les conversions image (thumb/column) ne s'appliquent ni aux vidéos,
        // ni aux GIF : les convertir en webp écraserait l'animation sur la 1re
        // frame. Un GIF est donc servi tel quel, en original.
        if ($media !== null && ! str_starts_with((string) $media->mime_type, 'image/')) {
            return;
        }

        if ($media !== null && $media->mime_type === 'image/gif') {
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
            $isGif = $media->mime_type === 'image/gif';

            return [
                // Un GIF reste un 'image' côté front (balise <img>), donc il s'anime
                'type' => $isImage ? 'image' : 'video',
                // image -> conversion 'column' (légère) ; GIF et vidéo -> original
                'url' => $isImage && ! $isGif && $media->hasGeneratedConversion('column')
                    ? $media->getUrl('column')
                    : $media->getUrl(),
                'full' => $isImage && ! $isGif && $media->hasGeneratedConversion('detail')
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
            $isGif = $image->mime_type === 'image/gif';

            return [
                'type' => 'image',
                'url' => ! $isGif && $image->hasGeneratedConversion('column') ? $image->getUrl('column') : $image->getUrl(),
                'alt' => $this->title,
                'width' => $image->getCustomProperty('width'),
                'height' => $image->getCustomProperty('height'),
            ];
        }

        $first = $this->getMedia()->first();

        return $first ? ['type' => 'video', 'url' => $first->getUrl(), 'alt' => $this->title] : null;
    }
}
