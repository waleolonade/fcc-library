<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fine extends Model
{
    protected $table = 'fines';

    protected $fillable = [
        'loan_id',
        'patron_matric',
        'amount',
        'balance_remaining',
        'reason',
        'status',
        'waived_by',
        'waived_at'
    ];

    protected $casts = [
        'amount' => 'float',
        'balance_remaining' => 'float',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class, 'loan_id', 'id');
    }
}
