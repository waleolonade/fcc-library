<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OpenAlexWork extends Model
{
    use HasFactory;

    protected $table = 'openalex_works';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'openalex_id',
        'doi',
        'title',
        'display_name',
        'publication_year',
        'publication_date',
        'type',
        'type_crossref',
        'authors',
        'primary_source',
        'host_venue',
        'publisher',
        'abstract',
        'is_oa',
        'oa_status',
        'oa_url',
        'pdf_url',
        'cited_by_count',
        'topics',
        'concepts',
        'language',
        'biblio',
        'openalex_url',
        'saved_by',
        'notes',
        'is_saved',
        'cached_raw',
    ];

    protected $casts = [
        'authors'         => 'array',
        'topics'          => 'array',
        'concepts'        => 'array',
        'biblio'          => 'array',
        'is_oa'           => 'boolean',
        'is_saved'        => 'boolean',
        'publication_year'=> 'integer',
        'cited_by_count'  => 'integer',
    ];

    /**
     * Helper to reconstruct full abstract paragraph from OpenAlex inverted index
     */
    public static function reconstructAbstract(?array $invertedIndex): ?string
    {
        if (empty($invertedIndex) || !is_array($invertedIndex)) {
            return null;
        }

        $wordPositions = [];
        foreach ($invertedIndex as $word => $positions) {
            if (is_array($positions)) {
                foreach ($positions as $pos) {
                    $wordPositions[(int) $pos] = $word;
                }
            }
        }

        if (empty($wordPositions)) {
            return null;
        }

        ksort($wordPositions);
        return implode(' ', $wordPositions);
    }
}
