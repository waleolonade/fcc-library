<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaChapter extends Model
{
    protected $table = 'media_chapters';
    protected $guarded = [];

    protected $casts = [
        'chapter_index' => 'integer',
        'start_seconds' => 'integer',
        'end_seconds' => 'integer',
    ];

    public function resource()
    {
        return $this->belongsTo(MediaResource::class, 'media_resource_id', 'id');
    }
}

