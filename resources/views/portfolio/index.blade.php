@extends('layouts.main')

@section('title', $activeProject ? $activeProject->title . ' — Ladyboy Studio' : 'Ladyboy Studio — Portfolio')

@section('meta')
    @php
        $ogImage = $activeProject?->gridThumb()['url'] ?? null;
        $ogDescription = $activeProject
            ? Str::limit(strip_tags((string) $activeProject->description), 200)
            : 'Le portfolio de Ladyboy Studio.';
    @endphp
    <meta name="description" content="{{ $ogDescription }}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="@yield('title')">
    <meta property="og:description" content="{{ $ogDescription }}">
    <meta property="og:url" content="{{ url()->current() }}">
    @if ($ogImage)
        <meta property="og:image" content="{{ $ogImage }}">
        <meta name="twitter:card" content="summary_large_image">
    @endif
@endsection

@section('styles')
    @vite(['resources/js/app.js', 'resources/js/column-scroll.js', 'resources/css/portfolio.css'])
@endsection

@section('content')

<div class="frame">
    <div>Ladyboy Studio</div>
    <button class="button-search" id="search-toggle" type="button" aria-label="Rechercher un projet" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
    </button>
    <button class="button-menu" id="burger-menu">
        <span></span>
    </button>
</div>

<!-- Recherche projets -->
<div class="search-panel">
    <input type="search" class="search-panel__input" placeholder="Rechercher un projet…" autocomplete="off" spellcheck="false">
    <p class="search-panel__empty" hidden>Aucun projet ne correspond.</p>
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
    <div class="columns" data-scroll-container data-active-project="{{ $activeProject?->slug }}" data-grid-url="{{ route('portfolio') }}">
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
                            data-project-slug="{{ $project->slug }}"
                            data-project-url="{{ route('portfolio.project', $project) }}"
                            data-project-title="{{ $project->title }}"
                            data-project-description="{{ $project->description }}"
                            data-project-media="{{ $project->frontMedia()->toJson() }}"
                            data-external-link="{{ $project->external_link }}">
                            @if ($thumb && $thumb['type'] === 'video')
                                <video class="column__item-img" muted loop autoplay playsinline preload="metadata" src="{{ $thumb['url'] }}#t=0.1"></video>
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

<!-- Project details overlay : les médias défilent en grand à l'horizontale -->
<div class="project-details">
    <button class="project-details__close" type="button" aria-label="Fermer le projet">&times;</button>

    <div class="project-details__bar">
        <h2 class="project-details__title"></h2>
        <div class="project-details__external-link">
            <a href="#" target="_blank" rel="noopener noreferrer">
                <img src="{{ Vite::asset('resources/img/view.png') }}" class="project-details__external-img" alt="View project" />
            </a>
        </div>
    </div>

    <div class="project-details__viewport">
        <div class="project-details__track"></div>
    </div>

    <p class="project-details__description"></p>
</div>

@endsection
