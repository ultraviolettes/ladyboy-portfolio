@extends('layouts.main')

@section('styles')
    @vite(['resources/js/app.js', 'resources/js/column-scroll.js', 'resources/css/portfolio.css'])
@endsection

@section('content')

<div class="frame">
    <div>Ladyboy Studio</div>
    <button class="button-menu" id="burger-menu">
        <span></span>
    </button>
</div>

<!-- Menu Panel -->
<div class="menu-panel">
    <div class="menu-panel__content">
        <div class="menu-panel__header">
            <img src="{{ Vite::asset('resources/img/about.png') }}" alt="" class="h-48 w-96 object-fill"/>
        </div>
        <div class="menu-panel__nav">
            <div><a href="mailto:hello@ladyboy.studio"><img src="{{ Vite::asset('resources/img/contact.png') }}" alt="" /></a></div>
            <div><a href="https://www.instagram.com/ladyboyentertainment" target="_blank"><img src="{{ Vite::asset('resources/img/insta.png') }}" alt="" /></a></div>
            <div><a href="https://www.behance.net/ladyboystudio" target="_blank"><img src="{{ Vite::asset('resources/img/behance.png') }}" alt="" /></a></div>
        </div>
    </div>
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
                            data-project-images="{{ $project->getMedia()->map(function($media) { return $media->getUrl(); })->toJson() }}"
                            data-original-image="{{ $project->getFirstMediaUrl() }}"
                            data-external-link="{{ $project->external_link }}">
                            <img class="column__item-img" loading="lazy" width="800" height="auto" src="{{ $project->getFirstMediaUrl('default', 'column') }}" alt="{{ $project->title }}">
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
        <div class="project-details__main-content">
            <div class="project-details__image">
                <img src="" alt="" loading="lazy">
            </div>
            <div class="project-details__content">
                <div class="project-details__header">
                    <h2 class="project-details__title"></h2>
                </div>
                <div class="project-details__description"></div>
                <div class="project-details__external-link">
                    <a href="#" target="_blank" rel="noopener noreferrer">
                        <img src="{{ Vite::asset('resources/img/view.png') }}" class="project-details__thumbnail" alt="View project" />
                    </a>
                </div>
            </div>
        </div>
        <div class="project-details__thumbnails"></div>
    </div>
</div>

@endsection
