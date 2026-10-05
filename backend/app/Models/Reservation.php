<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $table = 'reservations';

    protected $fillable = [
        'user_identifier',
        'user_name',
        'book_id',
        'book_title',
        'reserved_from',
        'reserved_to',
        'status',
        'notes'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id', 'id');
    }
}
