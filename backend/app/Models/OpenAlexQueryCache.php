<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpenAlexQueryCache extends Model
{
    use HasFactory;

    protected $table = 'openalex_queries_cache';
    protected $primaryKey = 'query_hash';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'query_hash',
        'endpoint',
        'request_params',
        'response_meta',
        'response_results',
        'response_group_by',
        'hits_count',
        'expires_at',
    ];

    protected $casts = [
        'request_params'    => 'array',
        'response_meta'      => 'array',
        'response_results'   => 'array',
        'response_group_by'  => 'array',
        'hits_count'         => 'integer',
        'expires_at'         => 'datetime',
    ];

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }
}
