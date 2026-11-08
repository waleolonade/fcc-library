<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaTranscript extends Model
{
    protected $table = 'media_transcripts';
    protected $guarded = [];

    protected $casts = [
        'timed_cues' => 'array',
    ];

    public function resource()
    {
        return $this->belongsTo(MediaResource::class, 'media_resource_id', 'id');
    }
}

