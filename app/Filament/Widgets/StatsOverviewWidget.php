<?php

namespace App\Filament\Widgets;

use App\Models\PageView;
use App\Models\Project;
use Filament\Widgets\Concerns\InteractsWithPageFilters;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class StatsOverviewWidget extends BaseWidget
{
    use InteractsWithPageFilters;

    protected static ?int $sort = 1;

    protected function getFilters(): ?array
    {
        return [
            'day' => 'Aujourd\'hui',
            'week' => 'Cette semaine',
            'month' => 'Ce mois',
            'year' => 'Cette année',
        ];
    }

    protected function getStats(): array
    {
        $filter = $this->filter ?? 'month';
        [$currentStart, $previousStart, $previousEnd, $periodLabel] = $this->getPeriodDates($filter);

        // Projets
        $totalProjects = Project::count();
        $projectsCurrentPeriod = Project::where('created_at', '>=', $currentStart)->count();
        $projectsPreviousPeriod = Project::whereBetween('created_at', [$previousStart, $previousEnd])->count();

        // Médias
        $totalMedia = Media::count();
        $mediaCurrentPeriod = Media::where('created_at', '>=', $currentStart)->count();
        $mediaPreviousPeriod = Media::whereBetween('created_at', [$previousStart, $previousEnd])->count();

        // Pages vues
        $pageViewsCurrentPeriod = PageView::inPeriod($currentStart)->count();
        $pageViewsPreviousPeriod = PageView::inPeriod($previousStart, $previousEnd)->count();

        // Visiteurs uniques (par session)
        $uniqueVisitorsCurrentPeriod = PageView::inPeriod($currentStart)->distinct('session_id')->count('session_id');
        $uniqueVisitorsPreviousPeriod = PageView::inPeriod($previousStart, $previousEnd)->distinct('session_id')->count('session_id');

        // Tendances
        $projectTrend = $this->calculateTrend($projectsCurrentPeriod, $projectsPreviousPeriod);
        $mediaTrend = $this->calculateTrend($mediaCurrentPeriod, $mediaPreviousPeriod);
        $pageViewsTrend = $this->calculateTrend($pageViewsCurrentPeriod, $pageViewsPreviousPeriod);
        $visitorsTrend = $this->calculateTrend($uniqueVisitorsCurrentPeriod, $uniqueVisitorsPreviousPeriod);

        return [
            Stat::make('Pages vues', $pageViewsCurrentPeriod)
                ->description($this->formatTrendDescription($pageViewsCurrentPeriod, $pageViewsTrend, $filter))
                ->descriptionIcon($this->getTrendIcon($pageViewsTrend))
                ->color($this->getTrendColor($pageViewsTrend)),

            Stat::make('Visiteurs uniques', $uniqueVisitorsCurrentPeriod)
                ->description($this->formatTrendDescription($uniqueVisitorsCurrentPeriod, $visitorsTrend, $filter))
                ->descriptionIcon($this->getTrendIcon($visitorsTrend))
                ->color($this->getTrendColor($visitorsTrend)),

            Stat::make('Projets', $totalProjects)
                ->description($this->formatTrendDescription($projectsCurrentPeriod, $projectTrend, $filter))
                ->descriptionIcon($this->getTrendIcon($projectTrend))
                ->color($this->getTrendColor($projectTrend)),

            Stat::make('Médias', $totalMedia)
                ->description($this->formatTrendDescription($mediaCurrentPeriod, $mediaTrend, $filter))
                ->descriptionIcon($this->getTrendIcon($mediaTrend))
                ->color($this->getTrendColor($mediaTrend)),
        ];
    }

    private function getPeriodDates(string $filter): array
    {
        $now = Carbon::now();

        return match ($filter) {
            'day' => [
                $now->copy()->startOfDay(),
                $now->copy()->subDay()->startOfDay(),
                $now->copy()->subDay()->endOfDay(),
                'aujourd\'hui',
            ],
            'week' => [
                $now->copy()->startOfWeek(),
                $now->copy()->subWeek()->startOfWeek(),
                $now->copy()->subWeek()->endOfWeek(),
                'cette semaine',
            ],
            'year' => [
                $now->copy()->startOfYear(),
                $now->copy()->subYear()->startOfYear(),
                $now->copy()->subYear()->endOfYear(),
                'cette année',
            ],
            default => [
                $now->copy()->startOfMonth(),
                $now->copy()->subMonth()->startOfMonth(),
                $now->copy()->subMonth()->endOfMonth(),
                'ce mois',
            ],
        };
    }

    private function calculateTrend(int $current, int $previous): ?float
    {
        if ($previous === 0) {
            return $current > 0 ? 100.0 : null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function formatTrendDescription(int $count, ?float $trend, string $filter): string
    {
        $periodLabels = [
            'day' => ['ce jour', 'vs hier'],
            'week' => ['cette semaine', 'vs semaine dernière'],
            'month' => ['ce mois', 'vs mois dernier'],
            'year' => ['cette année', 'vs année dernière'],
        ];

        [$current, $comparison] = $periodLabels[$filter] ?? $periodLabels['month'];

        if ($trend === null) {
            return "{$count} {$current}";
        }

        $sign = $trend >= 0 ? '+' : '';

        return "{$sign}{$trend}% {$comparison}";
    }

    private function getTrendIcon(?float $trend): string
    {
        if ($trend === null || $trend === 0.0) {
            return 'heroicon-m-minus';
        }

        return $trend > 0 ? 'heroicon-m-arrow-trending-up' : 'heroicon-m-arrow-trending-down';
    }

    private function getTrendColor(?float $trend): string
    {
        if ($trend === null || $trend === 0.0) {
            return 'gray';
        }

        return $trend > 0 ? 'success' : 'danger';
    }
}
