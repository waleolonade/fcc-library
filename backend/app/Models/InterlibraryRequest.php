<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InterlibraryRequest extends Model
{
    protected $table = 'interlibrary_requests';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'matric', 'patron_name', 'partner_institution', 'title', 'author', 'identifier', 'status', 'staff_note', 'submitted_at'];
}
