<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SimpleLibAuthor extends Model
{
    protected $table = 'simple_lib_authors';

    protected $fillable = [
        'name',
        'nationality',
        'rating',
    ];

    protected $casts = [
        'rating' => 'float',
    ];
}
