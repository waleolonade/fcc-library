<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Thesis extends Model
{
    protected $table = 'theses';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'year' => 'integer',
        'downloads' => 'integer',
        'citations' => 'integer',
    ];

    protected $appends = [
        'fileSize',
        'fileName',
        'submittedAt'
    ];

    public function getFileSizeAttribute() { return $this->attributes['file_size'] ?? $this->attributes['fileSize'] ?? null; }
    public function getFileNameAttribute() { return $this->attributes['file_name'] ?? $this->attributes['fileName'] ?? null; }
    public function getSubmittedAtAttribute() { return $this->attributes['submitted_at'] ?? $this->attributes['submittedAt'] ?? null; }
}
