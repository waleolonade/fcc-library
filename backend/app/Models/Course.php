<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $table = 'courses';
    protected $primaryKey = 'code';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $fillable = [
        'code',
        'title',
        'department',
        'faculty',
        'level',
        'semester',
        'lecturer',
        'syllabus',
        'enrolled_students',
        'required_texts',
        'recommended_texts',
        'past_exams',
        'lecture_packs',
    ];

    protected $casts = [
        'required_texts' => 'array',
        'recommended_texts' => 'array',
        'past_exams' => 'array',
        'lecture_packs' => 'array',
    ];
}
