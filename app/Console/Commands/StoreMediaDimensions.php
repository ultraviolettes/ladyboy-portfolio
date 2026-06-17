<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Backfill : stocke largeur/hauteur des médias images dans leurs custom properties.
 * Permet de réserver l'espace côté front (aspect-ratio) et d'activer le lazy-load
 * sans casser la mesure des hauteurs de colonnes du portfolio.
 * Les nouveaux uploads sont gérés automatiquement (voir AppServiceProvider).
 */
class StoreMediaDimensions extends Command
{
    protected $signature = 'media:store-dimensions {--force : Recalcule même si les dimensions existent déjà}';

    protected $description = 'Stocke largeur/hauteur des médias images (réservation d espace + lazy-load)';

    public function handle(): int
    {
        $media = Media::query()->where('mime_type', 'like', 'image/%')->get();
        $done = 0;
        $skipped = 0;

        foreach ($media as $m) {
            if (! $this->option('force') && $m->getCustomProperty('width') && $m->getCustomProperty('height')) {
                $skipped++;

                continue;
            }

            $path = $m->getPath();

            if (! is_file($path) || ($size = @getimagesize($path)) === false) {
                $skipped++;

                continue;
            }

            $m->setCustomProperty('width', $size[0]);
            $m->setCustomProperty('height', $size[1]);
            $m->save();
            $done++;
        }

        $this->info("Dimensions stockées : {$done} média(s) traité(s), {$skipped} ignoré(s).");

        return self::SUCCESS;
    }
}
