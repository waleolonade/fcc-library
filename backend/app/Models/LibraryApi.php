<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryApi extends Model
{
    protected $table = 'library_apis';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'is_preset' => 'boolean',
        'headers' => 'array',
    ];
}
