@extends('layouts.main')

@section('body_class', 'flex flex-col items-center justify-center relative')

@section('styles')
    <!-- Preload frame images -->
    @foreach (range(0,8) as $frame)
    <link rel="preload" href="{{ Vite::asset('resources/img/frames/frame-'.$frame.'.png') }}" as="image">
    @endforeach

    @vite(['resources/js/app.js', 'resources/js/loader.js', 'resources/css/app.css', 'resources/css/loader.css'])
@endsection

@section('content')
    <div class="intro loader-container overflow-hidden h-screen w-full">
        <div class="img-container flex flex-col items-center justify-center relative h-full w-full">
            <div class="character-container relative flex items-center justify-center w-[80vw] h-[80vh]" id="character-container">
                @foreach (range(0,8) as $frame )
                <img src="{{ Vite::asset('resources/img/frames/frame-'.$frame.'.png') }}"
                     alt="illustration Ladyboy Studio"
                     class="character-frame mx-auto absolute opacity-0 w-[80vw] h-[80vh] object-contain"
                     data-frame="{{ $frame }}"
                />
                @endforeach
            </div>

        </div>
    </div>


@endsection
