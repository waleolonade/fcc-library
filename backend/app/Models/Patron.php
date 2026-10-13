<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

if (!class_exists('App\Models\Patron')) {
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
        'barcode',
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

    public function getBarcodeAttribute() {
        if (!empty($this->attributes['barcode'])) {
            return $this->attributes['barcode'];
        }
        $matric = $this->attributes['matric'] ?? '';
        $dept = $this->attributes['department'] ?? '';
        $deptCode = 'CSC';
        if (preg_match('/(?:FCC[\/-])?([A-Za-z]{2,4})[\/-]/i', $matric, $m)) {
            $deptCode = strtoupper($m[1]);
        } elseif (stripos($dept, 'computer') !== false) {
            $deptCode = 'CSC';
        } elseif (stripos($dept, 'co-operative') !== false || stripos($dept, 'cooperative') !== false) {
            $deptCode = 'CEM';
        } elseif (stripos($dept, 'banking') !== false) {
            $deptCode = 'BNF';
        } elseif (stripos($dept, 'public') !== false) {
            $deptCode = 'PAD';
        } elseif (stripos($dept, 'agric') !== false) {
            $deptCode = 'AGR';
        } elseif (stripos($dept, 'business') !== false) {
            $deptCode = 'BAM';
        }
        $digits = preg_replace('/[^0-9]/', '', $matric);
        $suffix = !empty($digits) ? str_pad(substr($digits, -5), 5, '0', STR_PAD_LEFT) : '26409';
        return "FCC-STU-{$deptCode}-{$suffix}";
    }
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
}

