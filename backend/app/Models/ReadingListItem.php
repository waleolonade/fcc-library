<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReadingListItem extends Model
{
    protected $table = 'reading_list_items';
    public $timestamps = false;
    protected $fillable = ['id', 'reading_list_id', 'book_id', 'priority', 'notes', 'created_at'];

    public function book()
    {
        return $this->belongsTo(Book::class, 'book_id');
    }

    public function readingList()
    {
        return $this->belongsTo(ReadingList::class, 'reading_list_id');
    }
}
