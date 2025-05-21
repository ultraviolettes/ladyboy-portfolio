<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @include('partials.head')
        @yield('styles')
    </head>
    <body class="@yield('body_class', '')">

        @yield('content')

        <footer>
            @include('partials.footer')
        </footer>

        @yield('scripts')
    </body>
</html>
