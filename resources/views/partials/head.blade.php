<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<title>{{ $title ?? 'Ladyboy Studio - Welcome' }}</title>

<link rel="icon" href="{{ Vite::asset('resources/img/favicon.png') }}" sizes="any">

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
<link rel="preconnect" href="https://fonts.bunny.net">
<link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|abhaya-libre:400,500,600,700" rel="stylesheet" />

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://www.instagram.com" crossorigin>
<link rel="preconnect" href="https://www.behance.net" crossorigin>

<!-- DNS prefetch for performance -->
<link rel="dns-prefetch" href="https://www.instagram.com">
<link rel="dns-prefetch" href="https://www.behance.net">
