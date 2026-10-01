<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PartnerLibrary extends Model
{
    protected $table = 'partner_libraries';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];
}
