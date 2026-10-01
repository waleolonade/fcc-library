<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class TroveController extends Controller
{
    /**
     * Proxy search requests to the Trove API
     */
    public function search(Request $request)
    {
        $q = $request->input('q', '');
        
        if (empty($q)) {
            return response()->json(['error' => 'Query parameter "q" is required'], 400);
        }

        // Trove API requires an API key, usually stored in .env as TROVE_API_KEY
        $apiKey = env('TROVE_API_KEY', '');
        
        if (empty($apiKey)) {
            // For demonstration purposes, if no API key is provided, we return mock data 
            // so the frontend UI can be tested without breaking.
            return response()->json($this->getMockData($q));
        }

        try {
            $response = Http::withHeaders([
                'X-API-KEY' => $apiKey,
                'Accept' => 'application/json',
            ])->get('https://api.trove.nla.gov.au/v3/result', [
                'q' => $q,
                'category' => 'all',
                'encoding' => 'json',
                'n' => 12,
                'include' => 'links'
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            return response()->json([
                'error' => 'Trove API responded with an error',
                'details' => $response->body()
            ], $response->status());
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to connect to Trove API',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Returns mock data mimicking the Trove API v3 response format
     * Used when TROVE_API_KEY is not set in .env
     */
    private function getMockData($query)
    {
        return [
            'query' => $query,
            'category' => [
                [
                    'code' => 'newspaper',
                    'records' => [
                        'total' => 1450,
                        'work' => [
                            [
                                'title' => "The Sydney Morning Herald: Special Edition on $query",
                                'contributor' => ['John Fairfax & Sons'],
                                'issued' => '1945-08-16',
                                'type' => ['Article', 'Newspaper'],
                                'language' => ['English'],
                                'abstract' => "A historical clipping discussing the profound impact of $query on the Australian economy and culture.",
                                'identifier' => [
                                    ['type' => 'url', 'value' => 'https://trove.nla.gov.au/newspaper/article/mock1', 'linktext' => 'View Newspaper Clipping']
                                ],
                                'troveUrl' => 'https://trove.nla.gov.au/newspaper/article/mock1'
                            ],
                            [
                                'title' => "The Courier-Mail: Weekly Review",
                                'contributor' => ['Brisbane Daily'],
                                'issued' => '1952-11-04',
                                'type' => ['Article'],
                                'language' => ['English'],
                                'abstract' => "Weekly column covering local events, including references to $query.",
                                'identifier' => [
                                    ['type' => 'url', 'value' => 'https://trove.nla.gov.au/newspaper/article/mock2', 'linktext' => 'View Archive']
                                ],
                                'troveUrl' => 'https://trove.nla.gov.au/newspaper/article/mock2'
                            ]
                        ]
                    ]
                ],
                [
                    'code' => 'book',
                    'records' => [
                        'total' => 320,
                        'work' => [
                            [
                                'title' => "A Comprehensive History of $query in Australia",
                                'contributor' => ['Dr. Alice Researcher', 'Prof. Bob Historian'],
                                'issued' => '1998',
                                'type' => ['Book', 'Monograph'],
                                'language' => ['English'],
                                'abstract' => "An extensive academic review of $query, detailing its origins and development throughout the 20th century.",
                                'identifier' => [
                                    ['type' => 'url', 'value' => 'https://trove.nla.gov.au/work/mock3', 'linktext' => 'National Library Catalog']
                                ],
                                'troveUrl' => 'https://trove.nla.gov.au/work/mock3'
                            ]
                        ]
                    ]
                ],
                [
                    'code' => 'picture',
                    'records' => [
                        'total' => 45,
                        'work' => [
                            [
                                'title' => "Vintage Photograph of $query (circa 1920)",
                                'contributor' => ['National Archives of Australia'],
                                'issued' => '1920',
                                'type' => ['Photograph', 'Image'],
                                'language' => ['N/A'],
                                'abstract' => "Black and white silver gelatin print showcasing early developments related to $query.",
                                'identifier' => [
                                    ['type' => 'url', 'value' => 'https://trove.nla.gov.au/work/mock4', 'linktext' => 'View High-Res Image']
                                ],
                                'troveUrl' => 'https://trove.nla.gov.au/work/mock4'
                            ]
                        ]
                    ]
                ]
            ]
        ];
    }
}
