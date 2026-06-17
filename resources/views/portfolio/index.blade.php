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
            <img src="{{ Vite::asset('resources/img/about.png') }}" alt="Ladyboy Studio — about"/>
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
        @php
            // Répartition round-robin pour équilibrer les 3 colonnes (ex. 7 projets -> 3/2/2)
            $columns = $projects->values()->groupBy(fn ($project, $i) => $i % 3);
        @endphp
        @foreach ($columns as $projectChunk)
            <div class="column-wrap">
                <div class="column">
                    @foreach ($projectChunk as $project)
                        @php $thumb = $project->gridThumb(); @endphp
                        <div class="column__item"
                            data-project-id="{{ $project->id }}"
                            data-project-title="{{ $project->title }}"
                            data-project-description="{{ $project->description }}"
                            data-project-media="{{ $project->frontMedia()->toJson() }}"
                            data-external-link="{{ $project->external_link }}">
                            @if ($thumb && $thumb['type'] === 'video')
                                <video class="column__item-img" muted playsinline preload="metadata" src="{{ $thumb['url'] }}#t=0.1"></video>
                            @elseif ($thumb && ($thumb['width'] ?? null) && ($thumb['height'] ?? null))
                                {{-- dimensions connues -> espace réservé (pas de layout shift, mesure du scroll fiable) --}}
                                <img class="column__item-img" decoding="async" width="{{ $thumb['width'] }}" height="{{ $thumb['height'] }}" src="{{ $thumb['url'] }}" alt="{{ $thumb['alt'] }}">
                            @elseif ($thumb)
                                <img class="column__item-img" decoding="async" src="{{ $thumb['url'] }}" alt="{{ $thumb['alt'] }}">
                            @endif
                        </div>
                    @endforeach
                </div>
            </div>
        @endforeach
    </div>
</main>

<!-- Project details overlay -->
<div class="project-details">
    <button class="project-details__close" type="button" aria-label="Fermer le projet">&times;</button>
    <div class="project-details__content">
        <div class="project-details__main-content">
            <div class="project-details__image">
                <img src="" alt="" loading="lazy">
                <video controls playsinline preload="metadata" style="display: none"></video>
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
