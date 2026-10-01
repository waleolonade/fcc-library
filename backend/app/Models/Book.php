<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    protected $table = 'books';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'is_digital' => 'boolean',
        'keywords' => 'array',
        'chapters' => 'array',
        'references_data' => 'array',
        'year' => 'integer',
        'pdf_pages' => 'integer',
        'copies_total' => 'integer',
        'copies_available' => 'integer',
        'citations' => 'integer',
        'rating' => 'float',
    ];

    protected $appends = [
        'isDigital',
        'pdfPages',
        'fileSize',
        'fileName',
        'fileDataUrl',
        'externalUrl',
        'authorCredentials',
        'authorAffiliation',
        'coAuthors',
        'callNumber',
        'shelfLocation',
        'courseCode',
        'targetLevel',
        'accessLevel',
        'rightsStatus',
        'copiesTotal',
        'copiesAvailable',
        'uploadedAt',
        'uploadedBy',
        'references',
        'referenceStyle'
    ];

    public function getIsDigitalAttribute() { return (bool) ($this->attributes['is_digital'] ?? false); }
    public function getPdfPagesAttribute() { return (int) ($this->attributes['pdf_pages'] ?? 0); }
    public function getFileSizeAttribute() { return $this->attributes['file_size'] ?? null; }
    public function getFileNameAttribute() { return $this->attributes['file_name'] ?? null; }
    public function getFileDataUrlAttribute() { return $this->attributes['file_data_url'] ?? null; }
    public function getExternalUrlAttribute() { return $this->attributes['external_url'] ?? null; }
    public function getAuthorCredentialsAttribute() { return $this->attributes['author_credentials'] ?? null; }
    public function getAuthorAffiliationAttribute() { return $this->attributes['author_affiliation'] ?? null; }
    public function getCoAuthorsAttribute() { return $this->attributes['co_authors'] ?? null; }
    public function getCallNumberAttribute() { return $this->attributes['call_number'] ?? null; }
    public function getShelfLocationAttribute() { return $this->attributes['shelf_location'] ?? null; }
    public function getCourseCodeAttribute() { return $this->attributes['course_code'] ?? null; }
    public function getTargetLevelAttribute() { return $this->attributes['target_level'] ?? null; }
    public function getAccessLevelAttribute() { return $this->attributes['access_level'] ?? null; }
    public function getRightsStatusAttribute() { return $this->attributes['rights_status'] ?? null; }
    public function getCopiesTotalAttribute() { return (int) ($this->attributes['copies_total'] ?? 1); }
    public function getCopiesAvailableAttribute() { return (int) ($this->attributes['copies_available'] ?? 1); }
    public function getUploadedAtAttribute() { return $this->attributes['uploaded_at'] ?? null; }
    public function getUploadedByAttribute() { return $this->attributes['uploaded_by'] ?? null; }
    public function getReferencesAttribute() {
        $raw = $this->attributes['references_data'] ?? null;
        if (!$raw) return [];
        return is_array($raw) ? $raw : (json_decode($raw, true) ?: []);
    }
    public function getReferenceStyleAttribute() { return $this->attributes['reference_style'] ?? 'APA 7th'; }
}
