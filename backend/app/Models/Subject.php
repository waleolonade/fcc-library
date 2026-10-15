<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    protected $table = 'subjects';
    protected $fillable = ['id', 'code', 'name', 'classification_system', 'parent_id'];

    public function parent()
    {
        return $this->belongsTo(Subject::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Subject::class, 'parent_id');
    }
}
