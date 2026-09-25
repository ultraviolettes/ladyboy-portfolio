<?php

namespace App\Http\Controllers;

use App\Models\Project;

class PortfolioController extends Controller
{
    public function index()
    {
        return view('portfolio.index', [
            'projects' => $this->projects(),
            'activeProject' => null,
        ]);
    }

    /**
     * Même page que la grille, avec le projet déjà ouvert : l'overlay est
     * rendu côté client, seul l'état initial change.
     */
    public function show(Project $project)
    {
        return view('portfolio.index', [
            'projects' => $this->projects(),
            'activeProject' => $project,
        ]);
    }

    private function projects()
    {
        return Project::with('media')->latest()->get();
    }
}
