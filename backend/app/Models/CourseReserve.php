<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CourseReserve extends Model
{
    use HasFactory;

    protected $table = 'course_reserves';

    protected $fillable = [
        'department_code',
        'department_name',
        'title',
        'author',
        'reserved_for',
        'shelf',
        'duration',
        'copies',
        'status',
    ];
}
