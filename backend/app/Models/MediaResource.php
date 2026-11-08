<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaResource extends Model
{
    protected $table = 'media_resources';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'duration_seconds' => 'integer',
        'file_size_bytes' => 'integer',
        'download_allowed' => 'boolean',
        'view_count' => 'integer',
        'play_count' => 'integer',
        'rating' => 'float',
        'subject_keywords' => 'array',
        'technical_metadata' => 'array',
    ];

    public function chapters()
    {
        return $this->hasMany(MediaChapter::class, 'media_resource_id', 'id')->orderBy('chapter_index', 'asc');
    }

    public function transcripts()
    {
        return $this->hasMany(MediaTranscript::class, 'media_resource_id', 'id');
    }

    public function progress()
    {
        return $this->hasMany(MediaProgress::class, 'media_resource_id', 'id');
    }

    public function companionBook()
    {
        return $this->belongsTo(Book::class, 'companion_book_id', 'id');
    }

    public function collections()
    {
        return $this->belongsToMany(MediaCollection::class, 'media_collection_items', 'media_resource_id', 'collection_id');
    }
}

