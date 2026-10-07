<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimpleLibBook extends Model
{
    protected $table = 'simple_lib_books';

    protected $fillable = [
        'title',
        'author',
        'genre',
        'rating',
        'cover_url',
    ];

    protected $casts = [
        'rating' => 'float',
    ];
}
