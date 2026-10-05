<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $table = 'reviews';

    protected $fillable = [
        'user_identifier',
        'user_name',
        'book_id',
        'comment',
        'rating',
        'is_verified'
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_verified' => 'boolean'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id', 'id');
    }
}
