<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'name', 'code', 'faculty', 'hod_name', 'hod_email', 'hod_phone', 'hod_pin',
        'hod_photo', 'student_count', 'faculty_count', 'description', 'established', 'color'
    ];

    public function uploads()
    {
        return $this->hasMany(DepartmentUpload::class, 'department_id', 'id');
    }
}
