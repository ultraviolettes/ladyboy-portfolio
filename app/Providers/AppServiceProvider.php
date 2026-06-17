<?php

namespace App\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Stocke les dimensions des images à l'upload pour réserver l'espace
        // côté front (lazy-load sans casser la mesure du scroll).
        Event::listen(MediaHasBeenAddedEvent::class, function (MediaHasBeenAddedEvent $event): void {
            $media = $event->media;

            if (! str_starts_with((string) $media->mime_type, 'image/')) {
                return;
            }

            $path = $media->getPath();

            if (! is_file($path)) {
                return;
            }

            $size = @getimagesize($path);

            if ($size === false) {
                return;
            }

            $media->setCustomProperty('width', $size[0]);
            $media->setCustomProperty('height', $size[1]);
            $media->save();
        });
    }
}
