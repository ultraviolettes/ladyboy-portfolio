<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>{{ $title ?? 'Ladyboy Studio - Welcome' }}</title>

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- Preload custom font -->
<link rel="preload" href="{{ Vite::asset('resources/fonts/MilkywayRoundedTyp.otf') }}" as="font" type="font/otf" crossorigin>
<style>
    @font-face {
        font-family: 'MilkywayRoundedTyp';
        src: url('{{ Vite::asset('resources/fonts/MilkywayRoundedTyp.otf') }}') format('opentype');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
    }
</style>
