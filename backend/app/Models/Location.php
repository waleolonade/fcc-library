<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Location extends Model
{
    protected $table = 'locations';
    protected $fillable = ['id', 'branch_id', 'building', 'floor', 'room', 'area_name'];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }
}
