<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DigitalResource extends Model
{
    protected $table = 'digital_resources';
    protected $fillable = ['id', 'book_id', 'file_path', 'file_size', 'mime_type', 'access_rights', 'download_count', 'view_count'];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id');
    }
}
