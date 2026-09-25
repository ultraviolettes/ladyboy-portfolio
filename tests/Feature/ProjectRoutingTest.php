<?php

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('génère un slug à la création', function () {
    $project = Project::create(['title' => 'New Balance Été 2026']);

    expect($project->slug)->toBe('new-balance-ete-2026');
});

it('suffixe le slug quand le titre existe déjà', function () {
    Project::create(['title' => 'New Balance']);
    $second = Project::create(['title' => 'New Balance']);

    expect($second->slug)->toBe('new-balance-2');
});

it('ne change pas le slug quand le titre est modifié', function () {
    $project = Project::create(['title' => 'Titre initial']);

    $project->update(['title' => 'Titre remanié']);

    // Une URL déjà partagée ou déjà comptée dans les stats doit rester valable
    expect($project->fresh()->slug)->toBe('titre-initial');
});

it('sert la page du projet sur son URL propre', function () {
    $project = Project::create(['title' => 'Pochette Schlag']);

    $this->get("/portfolio/{$project->slug}")
        ->assertOk()
        ->assertSee('Pochette Schlag — Ladyboy Studio', false)
        ->assertSee('data-active-project="pochette-schlag"', false);
});

it('renvoie une 404 sur un slug inconnu', function () {
    $this->get('/portfolio/projet-inexistant')->assertNotFound();
});

it('ouvre la grille sans projet actif', function () {
    $this->get('/portfolio')
        ->assertOk()
        ->assertSee('data-active-project=""', false);
});
