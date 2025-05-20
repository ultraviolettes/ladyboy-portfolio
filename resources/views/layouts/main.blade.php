<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @include('partials.head')
        @yield('styles')
    </head>
    <body class="@yield('body_class', 'flex flex-col items-center justify-center relative')">

        <main>
            @yield('content')
        </main>

        @yield('scripts')
    </body>
</html>
