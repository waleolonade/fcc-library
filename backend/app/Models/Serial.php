<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Serial extends Model
{
    protected $table = 'serials';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'title', 'issn', 'publisher', 'frequency', 'subject', 'shelf_location', 'status'];
}
