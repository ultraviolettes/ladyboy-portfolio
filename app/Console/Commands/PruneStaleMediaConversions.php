<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGeneratorFactory;

/**
 * Réparation : les GIF et vidéos uploadés avant le guard de Project::registerMediaConversions()
 * gardent des generated_conversions (thumb/column/detail) qui ne sont plus déclarées pour eux.
 * Filament voit le flag, demande la conversion, et Spatie lève InvalidConversion -> 500 sur
 * /admin/projects. On remet ces flags à zéro et on supprime les fichiers devenus orphelins.
 */
class PruneStaleMediaConversions extends Command
{
    protected $signature = 'media:prune-stale-conversions {--files : Supprime aussi les fichiers de conversions orphelins}';

    protected $description = 'Supprime les flags (et fichiers) de conversions périmés des GIF et vidéos';

    public function handle(): int
    {
        $pruned = 0;
        $files = 0;

        foreach (Media::all() as $media) {
            $mime = (string) $media->mime_type;

            // Les images hors GIF sont les seules à déclarer des conversions : on n'y touche pas.
            if (str_starts_with($mime, 'image/') && $mime !== 'image/gif') {
                continue;
            }

            if (! empty($media->generated_conversions)) {
                $media->generated_conversions = [];
                $media->save();
                $pruned++;
            }

            $disk = Storage::disk($media->conversions_disk);
            $directory = PathGeneratorFactory::create($media)->getPathForConversions($media);

            foreach ($disk->files($directory) as $path) {
                $files++;

                if (! $this->option('files')) {
                    $this->line("à supprimer : {$path}");

                    continue;
                }

                $disk->delete($path);
                $this->line("supprimé : {$path}");
            }
        }

        $this->info("Flags nettoyés : {$pruned} média(s).");
        $this->info($this->option('files')
            ? "Fichiers de conversions supprimés : {$files}."
            : "Fichiers orphelins détectés : {$files} (relancer avec --files pour supprimer).");

        return self::SUCCESS;
    }
}
