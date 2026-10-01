<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patron extends Model
{
    protected $table = 'patrons';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'borrow_quota' => 'integer',
        'active_loans_count' => 'integer',
        'overdue_count' => 'integer',
        'outstanding_fines' => 'float',
        'profile_completion' => 'integer',
    ];

    protected $appends = [
        'libraryId',
        'borrowQuota',
        'activeLoansCount',
        'overdueCount',
        'outstandingFines',
        'clearanceStatus',
        'registeredBranch',
        'validUntil',
        'photoUrl',
        'researchInterests',
        'profileCompletion'
    ];

    public function getLibraryIdAttribute() { return $this->attributes['library_id'] ?? null; }
    public function getBorrowQuotaAttribute() { return (int) ($this->attributes['borrow_quota'] ?? 5); }
    public function getActiveLoansCountAttribute() { return (int) ($this->attributes['active_loans_count'] ?? 0); }
    public function getOverdueCountAttribute() { return (int) ($this->attributes['overdue_count'] ?? 0); }
    public function getOutstandingFinesAttribute() { return (float) ($this->attributes['outstanding_fines'] ?? 0); }
    public function getClearanceStatusAttribute() { return $this->attributes['clearance_status'] ?? 'Active Student'; }
    public function getRegisteredBranchAttribute() { return $this->attributes['registered_branch'] ?? null; }
    public function getValidUntilAttribute() { return $this->attributes['valid_until'] ?? null; }
    public function getPhotoUrlAttribute() { return $this->attributes['photo_url'] ?? null; }
    public function getResearchInterestsAttribute() { return $this->attributes['research_interests'] ?? null; }
    public function getProfileCompletionAttribute() { return (int) ($this->attributes['profile_completion'] ?? 95); }
}
