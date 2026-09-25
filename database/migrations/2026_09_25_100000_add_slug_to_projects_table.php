<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('slug')->nullable()->after('title');
        });

        // Backfill des projets existants : slug unique dérivé du titre.
        $used = [];

        foreach (DB::table('projects')->orderBy('id')->get(['id', 'title']) as $project) {
            $base = Str::slug((string) $project->title) ?: 'projet';
            $slug = $base;
            $suffix = 2;

            while (in_array($slug, $used, true)) {
                $slug = $base . '-' . $suffix++;
            }

            $used[] = $slug;

            DB::table('projects')->where('id', $project->id)->update(['slug' => $slug]);
        }

        // Index posé après le backfill (la colonne reste nullable : le modèle
        // garantit toujours un slug, et un change() serait fragile en SQLite).
        Schema::table('projects', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
