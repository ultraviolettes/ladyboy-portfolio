<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('regenerate-webp', function () {
    $this->info('Starting regeneration of all images in WebP format...');

    // Call the Spatie MediaLibrary regenerate command with the appropriate options
    // We're using --with-responsive-images to ensure all responsive variants are regenerated
    $this->call('media-library:regenerate', [
        '--with-responsive-images' => true,
    ]);

    $this->info('All images have been regenerated in WebP format!');
})->purpose('Regenerate all images in WebP format');
