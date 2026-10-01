<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Loan extends Model
{
    protected $table = 'loans';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'renewal_count' => 'integer',
        'fine_amount' => 'float',
    ];

    protected $appends = [
        'patronName',
        'bookId',
        'bookTitle',
        'callNumber',
        'issueDate',
        'dueDate',
        'returnDate',
        'fine',
        'renewalsCount',
        'barcode'
    ];

    public function getPatronNameAttribute() { return $this->attributes['patron_name'] ?? null; }
    public function getBookIdAttribute() { return $this->attributes['book_id'] ?? null; }
    public function getBookTitleAttribute() { return $this->attributes['book_title'] ?? null; }
    public function getCallNumberAttribute() { return $this->attributes['call_number'] ?? null; }
    public function getIssueDateAttribute() { return $this->attributes['borrow_date'] ?? null; }
    public function getDueDateAttribute() { return $this->attributes['due_date'] ?? null; }
    public function getReturnDateAttribute() { return $this->attributes['return_date'] ?? null; }
    public function getFineAttribute() { return (float) ($this->attributes['fine_amount'] ?? 0); }
    public function getRenewalsCountAttribute() { return (int) ($this->attributes['renewal_count'] ?? 0); }
    public function getBarcodeAttribute() { return $this->attributes['rfid_tag'] ?? ($this->attributes['id'] ?? null); }
}
