<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleBook extends Model
{
    use HasFactory;

    protected $table = 'google_books';

    protected $fillable = [
        'volume_id',
        'title',
        'subtitle',
        'authors',
        'publisher',
        'published_date',
        'description',
        'isbn_10',
        'isbn_13',
        'page_count',
        'categories',
        'thumbnail_url',
        'preview_link',
        'info_link',
        'canonical_volume_link',
        'viewability',
        'embeddable',
        'is_ebook',
        'epub_available',
        'pdf_available',
        'web_reader_link',
        'is_recommended',
        'recommendation_category',
        'recommendation_notes',
        'saved_by',
    ];

    protected $casts = [
        'authors'        => 'array',
        'categories'     => 'array',
        'embeddable'     => 'boolean',
        'is_ebook'       => 'boolean',
        'epub_available' => 'boolean',
        'pdf_available'  => 'boolean',
        'is_recommended' => 'boolean',
        'page_count'     => 'integer',
    ];
}
