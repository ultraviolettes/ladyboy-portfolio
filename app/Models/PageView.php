<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PageView extends Model
{
    protected $fillable = [
        'url',
        'ip_address',
        'user_agent',
        'session_id',
        'viewable_type',
        'viewable_id',
    ];

    public function viewable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope pour filtrer par période.
     */
    public function scopeInPeriod($query, $start, $end = null)
    {
        if ($end) {
            return $query->whereBetween('created_at', [$start, $end]);
        }

        return $query->where('created_at', '>=', $start);
    }

    /**
     * Scope pour les vues uniques (par session).
     */
    public function scopeUnique($query)
    {
        return $query->distinct('session_id');
    }
}
