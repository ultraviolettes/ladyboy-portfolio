# Ladyboy Studio Portfolio

A modern portfolio website for Ladyboy Studio built with Laravel, Livewire, and Filament admin panel.

## Overview

This project is a portfolio website that showcases Ladyboy Studio's work. It features:

- A visually appealing loader page with animations
- A portfolio page displaying projects with images
- An admin panel for managing portfolio projects
- Media management for project images

## Technologies

- **Backend**: Laravel 12.x
- **Frontend**: 
  - Livewire 3.x with Volt
  - Tailwind CSS 4.x
  - AnimeJS for animations
- **Admin Panel**: Filament 3.x
- **Media Management**: Spatie Media Library
- **Build Tool**: Vite 6.x
- **Testing**: Pest PHP

## Requirements

- PHP 8.2 or higher
- Composer
- Node.js & NPM/Yarn
- MySQL or another Laravel-supported database

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ladyboy-portfolio.git
   cd ladyboy-portfolio
   ```

2. Install PHP dependencies:
   ```bash
   composer install
   ```

3. Install JavaScript dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

4. Create a copy of the environment file:
   ```bash
   cp .env.example .env
   ```

5. Generate an application key:
   ```bash
   php artisan key:generate
   ```

6. Configure your database in the `.env` file:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=ladyboy_portfolio
   DB_USERNAME=root
   DB_PASSWORD=
   ```

7. Run database migrations:
   ```bash
   php artisan migrate
   ```

8. Create a symbolic link for storage:
   ```bash
   php artisan storage:link
   ```

9. Build frontend assets:
   ```bash
   npm run build
   # or
   yarn build
   ```

## Development

To start the development server:

```bash
# Start Laravel development server
php artisan serve

# Watch for frontend changes
npm run dev
# or
yarn dev
```

Alternatively, use the combined development command:

```bash
composer dev
```

This will start the Laravel server, queue worker, logs, and Vite development server concurrently.

## Admin Panel

The admin panel is accessible at `/admin`. You'll need to create a user first:

```bash
php artisan make:filament-user
```

Follow the prompts to create an admin user, then log in at `/admin`.

## Project Structure

- `app/` - Contains the core code of the application
  - `Filament/` - Filament admin panel resources and pages
  - `Http/Controllers/` - Application controllers
  - `Models/` - Eloquent models
- `resources/` - Contains views, CSS, and JavaScript
  - `views/` - Blade templates
  - `css/` - CSS files
  - `js/` - JavaScript files
  - `img/` - Image assets
- `routes/` - Contains route definitions
- `public/` - Publicly accessible files
- `storage/` - File uploads and other storage
- `tests/` - Test files

## Testing

Run the test suite with:

```bash
php artisan test
# or
composer test
```

## Deployment

1. Set up your production server with PHP, Composer, and Node.js
2. Clone the repository on your server
3. Install dependencies:
   ```bash
   composer install --optimize-autoloader --no-dev
   npm install
   ```
4. Build assets:
   ```bash
   npm run build
   ```
5. Set up your environment variables for production
6. Generate application key if not already set:
   ```bash
   php artisan key:generate
   ```
7. Run migrations:
   ```bash
   php artisan migrate --force
   ```
8. Configure your web server (Nginx/Apache) to point to the public directory
9. Set up proper permissions for storage and bootstrap/cache directories

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open-sourced software licensed under the MIT license.
