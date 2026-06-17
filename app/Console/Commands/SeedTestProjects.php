<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * Utilitaire DE TEST UNIQUEMENT : génère des projets factices (marqués "TEST ..")
 * pour valider le mécanisme de scroll du portfolio avec assez de contenu.
 * Réversible via --clear. À ne pas utiliser en production.
 */
class SeedTestProjects extends Command
{
    protected $signature = 'projects:seed-test
        {count=20 : Nombre de projets de test à créer}
        {--clear : Supprime les projets de test (titre "TEST ..") au lieu d en créer}
        {--force : Autorise la création même en environnement de production}';

    protected $description = 'Crée ou supprime des projets de test (avec images) pour tester le scroll';

    public function handle(): int
    {
        if ($this->option('clear')) {
            $projects = Project::where('title', 'like', 'TEST %')->get();
            $projects->each->delete(); // Spatie supprime aussi les médias associés
            $this->info("Supprimé {$projects->count()} projets de test. Total restant : ".Project::count());

            return self::SUCCESS;
        }

        // Garde-fou : ne jamais créer de faux projets en production par accident
        if ($this->getLaravel()->environment('production') && ! $this->option('force')) {
            $this->error('Refus de créer des projets de test en production. Relance avec --force si tu es sûr.');

            return self::FAILURE;
        }

        // Fichiers source = images réelles des projets existants (extensions sûres pour les conversions)
        $sources = Media::query()->get()
            ->map(fn (Media $m) => $m->getPath())
            ->filter(fn (string $path) => is_file($path)
                && in_array(strtolower(pathinfo($path, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'webp']))
            ->values();

        if ($sources->isEmpty()) {
            $this->error('Aucun fichier image source trouvé (jpg/png/webp).');

            return self::FAILURE;
        }

        $count = (int) $this->argument('count');

        for ($i = 1; $i <= $count; $i++) {
            $project = Project::create([
                'title' => sprintf('TEST %02d', $i),
                'description' => 'Projet de test généré pour valider le scroll du portfolio.',
                'external_link' => null,
            ]);

            $source = $sources[($i - 1) % $sources->count()];
            // preservingOriginal() => copie le fichier, ne touche pas au média d origine
            $project->addMedia($source)->preservingOriginal()->toMediaCollection();

            $this->getOutput()->write('.');
        }

        $this->newLine();
        $this->info("Créé {$count} projets de test. Total projets : ".Project::count());
        $this->comment('Pour nettoyer : php artisan projects:seed-test --clear');

        return self::SUCCESS;
    }
}
