<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaCollection extends Model
{
    protected $table = 'media_collections';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function items()
    {
        return $this->belongsToMany(MediaResource::class, 'media_collection_items', 'collection_id', 'media_resource_id')
                    ->withPivot('sort_order')
                    ->orderBy('pivot_sort_order', 'asc');
    }
}

