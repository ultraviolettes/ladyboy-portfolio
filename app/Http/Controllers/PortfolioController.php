<?php

namespace App\Http\Controllers;

use App\Models\Project;

class PortfolioController extends Controller
{
    //

    public function index()
    {
        $projects = Project::with('media')->latest()->get();

        return view('portfolio.index', compact('projects'));
    }
}
