<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ladyboy Studio</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&display=swap" rel="stylesheet">
    @vite(['resources/js/app.js', 'resources/css/portfolio.css'])
</head>
<body>
<div class="frame">
    <div>Ladyboy Studio</div>
    <div>Portfolio créatif</div>
</div>

<main>
    <div class="content">
        @foreach ($projects->chunk(ceil($projects->count() / 3)) as $projectChunk) <!-- Divise les projets en 3 colonnes -->
            <div class="column">
                @foreach ($projectChunk as $project)
                    <div class="column__item" data-project-id="{{ $project->id }}" data-project-title="{{ $project->title }}" data-project-description="{{ $project->description }}">
                        <img class="column__item-img" src="{{ $project->getFirstMediaUrl() }}" alt="{{ $project->title }}">
                    </div>
                @endforeach
            </div>
        @endforeach
    </div>
</main>

<!-- Project details overlay -->
<div class="project-details">
    <div class="project-details__content">
        <div class="project-details__header">
            <h2 class="project-details__title"></h2>
            <div class="project-details__controls">
                <button class="project-details__back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Retour à la grille
                </button>
                <button class="project-details__close">&times;</button>
            </div>
        </div>
        <div class="project-details__main-content">
            <div class="project-details__image">
                <img src="" alt="">
            </div>
            <div class="project-details__description"></div>
        </div>
        <div class="project-details__thumbnails"></div>
    </div>
</div>

</body>
</html>
