<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaProgress extends Model
{
    protected $table = 'media_progress';
    protected $guarded = [];

    protected $casts = [
        'last_position_seconds' => 'integer',
        'total_duration_seconds' => 'integer',
        'completion_percentage' => 'integer',
        'completed' => 'boolean',
        'last_accessed_at' => 'datetime',
    ];

    public function resource()
    {
        return $this->belongsTo(MediaResource::class, 'media_resource_id', 'id');
    }
}

