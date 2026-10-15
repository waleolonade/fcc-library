<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReadingList extends Model
{
    protected $table = 'reading_lists';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'matric', 'title', 'description', 'is_public', 'item_count', 'items'];

    public function items()
    {
        return $this->hasMany(ReadingListItem::class, 'reading_list_id');
    }
}
