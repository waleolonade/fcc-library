<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HelpdeskTicket extends Model
{
    protected $table = 'helpdesk_tickets';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'matric', 'patron_name', 'category', 'subject', 'message', 'status', 'librarian_reply', 'replied_by'];
}
