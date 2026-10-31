<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    protected $table = 'reservations';
    public $timestamps = false;
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'matric',
        'patron_name',
        'book_id',
        'book_title',
        'call_number',
        'reserved_date',
        'expiry_date',
        'status',
        'pickup_branch',
        'queue_position'
    ];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id', 'id');
    }
}
