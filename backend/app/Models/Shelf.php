<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shelf extends Model
{
    protected $table = 'shelves';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'branch_id', 'shelf_code', 'floor', 'aisle', 'call_number_start', 'call_number_end', 'qr_code', 'capacity', 'current_count', 'status'];
}
