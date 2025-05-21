@extends('layouts.main')

@section('styles')
    @vite(['resources/js/app.js', 'resources/js/column-scroll.js', 'resources/css/portfolio.css'])
@endsection

@section('content')

<div class="frame">
    <div>Ladyboy Studio</div>
</div>

<main>
    <div class="columns" data-scroll-container>
        @foreach ($projects->chunk(ceil($projects->count() / 3)) as $projectChunk) <!-- Divise les projets en 3 colonnes -->
            <div @class([
                'column-wrap' => true,
                'column-wrap--height' => $loop->odd
            ])>
                <div class="column">
                    @foreach ($projectChunk as $project)
                        <div class="column__item"
                            data-project-id="{{ $project->id }}"
                            data-project-title="{{ $project->title }}"
                            data-project-description="{{ $project->description }}"
                            data-project-images="{{ $project->getMedia()->map(function($media) { return $media->getUrl(); })->toJson() }}">
                            <img class="column__item-img" src="{{ $project->getFirstMediaUrl() }}" alt="{{ $project->title }}">
                        </div>
                    @endforeach
                </div>
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

@endsection
