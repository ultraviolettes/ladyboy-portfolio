<?php

namespace App\Console\Commands;

use App\Support\MediaDimensions;
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
            if (MediaDimensions::store($m, (bool) $this->option('force'))) {
                $done++;
            } else {
                $skipped++;
            }
        }

        $this->info("Dimensions stockées : {$done} média(s) traité(s), {$skipped} ignoré(s).");

        return self::SUCCESS;
    }
}
