<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Réparation : les GIF et vidéos uploadés avant le guard de Project::registerMediaConversions()
 * gardent des generated_conversions (thumb/column/detail) qui ne sont plus déclarées pour eux.
 * Filament voit le flag, demande la conversion, et Spatie lève InvalidConversion -> 500 sur
 * /admin/projects. On remet ces flags à zéro : ces médias sont servis en original.
 */
class PruneStaleMediaConversions extends Command
{
    protected $signature = 'media:prune-stale-conversions';

    protected $description = 'Supprime les flags de conversions périmés des GIF et vidéos';

    public function handle(): int
    {
        $pruned = 0;

        foreach (Media::all() as $media) {
            $mime = (string) $media->mime_type;
            $hasConversions = str_starts_with($mime, 'image/') && $mime !== 'image/gif';

            if ($hasConversions || empty($media->generated_conversions)) {
                continue;
            }

            $media->generated_conversions = [];
            $media->save();
            $pruned++;
        }

        $this->info("Flags de conversions nettoyés : {$pruned} média(s).");

        return self::SUCCESS;
    }
}
