<?php

use App\Http\Controllers\PortfolioController;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;

// Route::get('/', function () {
//    return view('welcome');
// })->name('home');

// Route::view('dashboard', 'dashboard')
//    ->middleware(['auth', 'verified'])
//    ->name('dashboard');

Route::get('/', function () {
    return view('loader');
})->name('loader');

Route::get('/portfolio', [PortfolioController::class, 'index'])
    ->name('portfolio');

// Route::middleware(['auth'])->group(function () {
//    Route::redirect('settings', 'settings/profile');
//
//    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
//    Volt::route('settings/password', 'settings.password')->name('settings.password');
//    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
// });

require __DIR__ . '/auth.php';
