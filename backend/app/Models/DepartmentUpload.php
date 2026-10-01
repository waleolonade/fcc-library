<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentUpload extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'title', 'author', 'department_id', 'department_name',
        'uploaded_by_hod_id', 'hod_name', 'course_code', 'target_level',
        'semester', 'resource_type', 'file_name', 'file_data_url',
        'access_scope', 'status', 'review_notes', 'reviewed_by',
        'assigned_call_number', 'assigned_shelf', 'book_id'
    ];

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'id');
    }

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id', 'id');
    }
}
