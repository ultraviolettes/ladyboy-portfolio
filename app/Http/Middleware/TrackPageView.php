<?php

namespace App\Http\Middleware;

use App\Models\PageView;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackPageView
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Ne tracker que les réponses réussies (2xx)
        if ($response->isSuccessful() && $request->isMethod('GET')) {
            $this->recordPageView($request);
        }

        return $response;
    }

    private function recordPageView(Request $request): void
    {
        // Exclure les requêtes AJAX et les assets statiques
        if ($request->ajax() || $request->wantsJson()) {
            return;
        }

        $url = $request->path();

        // Exclure les routes d'assets et fichiers statiques
        if ($this->shouldExclude($url)) {
            return;
        }

        $data = [
            'url' => '/' . ltrim($url, '/'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $request->session()->getId(),
        ];

        // Si on visite un projet, associer la vue au projet
        $route = $request->route();
        if ($route && $route->getName() === 'portfolio.show') {
            $project = $route->parameter('project');
            if ($project) {
                $data['viewable_type'] = $project::class;
                $data['viewable_id'] = $project->id;
            }
        }

        PageView::create($data);
    }

    private function shouldExclude(string $url): bool
    {
        $excludedPrefixes = [
            'admin',
            'livewire',
            '_debugbar',
            'storage',
            'build',
            'vendor',
        ];

        foreach ($excludedPrefixes as $prefix) {
            if (str_starts_with($url, $prefix)) {
                return true;
            }
        }

        $excludedExtensions = ['.js', '.css', '.map', '.ico', '.png', '.jpg', '.svg', '.woff', '.woff2'];

        foreach ($excludedExtensions as $ext) {
            if (str_ends_with($url, $ext)) {
                return true;
            }
        }

        return false;
    }
}
