<?php

namespace App\Http\Controllers;

use App\Services\Overlay\ResourceOverlay;
use App\Services\Overlay\SourceRegistry;
use App\Services\Overlay\TaskPlanner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * OverlayController
 *
 * Exposes the federated API overlay to the student portal and public OPAC.
 * Resources are retrieved live from external APIs (and the local catalog)
 * on demand, without persisting external bibliographic records locally.
 */
class OverlayController extends Controller
{
    public function __construct(
        private ResourceOverlay $overlay,
        private SourceRegistry $registry,
        private TaskPlanner $planner
    ) {
    }

    /**
     * GET /api/overlay/sources
     * Returns all supported external APIs & local catalog with their live availability.
     */
    public function sources(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'sources' => $this->registry->all(),
            'defaultSources' => ResourceOverlay::DEFAULT_SOURCES,
        ]);
    }

    /**
     * POST /api/overlay/ask
     * Smart Student Task Assistant: plans the query, selects the optimal APIs,
     * fetches resources in parallel, merges duplicates, and synthesizes a briefing.
     */
    public function ask(Request $request): JsonResponse
    {
        $prompt = trim($request->input('prompt', $request->input('task', $request->input('q', ''))));
        if ($prompt === '') {
            return response()->json([
                'success' => false,
                'message' => 'Please provide a task or question (e.g. "I need papers on cooperative banking in Nigeria").',
            ], 422);
        }

        try {
            // 1. Analyze student intent and formulate execution plan
            $plan = $this->planner->plan($prompt);

            // 2. Allow user overrides for sources or filters if supplied
            $requestedSources = $request->input('sources');
            $activeSources = is_array($requestedSources) && !empty($requestedSources)
                ? $requestedSources
                : $plan['sources'];

            $opts = array_merge($plan['filters'], [
                'topic' => $plan['topic'],
                'types' => $plan['types'],
                'limit' => min(max((int) $request->input('limit', 12), 4), 30),
                'max'   => (int) $request->input('max', 60),
                'isbn'  => $plan['identifiers']['isbn'],
            ]);

            // Optional explicit filters from UI
            if ($request->has('freeOnly')) {
                $opts['freeOnly'] = filter_var($request->input('freeOnly'), FILTER_VALIDATE_BOOLEAN);
            }
            if ($request->filled('type') && $request->input('type') !== 'all') {
                $opts['types'] = [$request->input('type')];
                $opts['strictTypes'] = true;
            }

            // 3. Federated parallel fetch across chosen APIs
            $search = $this->overlay->search($plan['query'], $opts, $activeSources);

            // 4. Synthesize intelligent briefing for student
            $brief = $this->planner->brief($plan, $search['results'], $search['sources']);

            return response()->json([
                'success' => true,
                'task'    => $prompt,
                'plan'    => $plan,
                'brief'   => $brief,
                'total'   => $search['total'],
                'results' => $search['results'],
                'sources' => $search['sources'],
                'facets'  => $search['facets'],
                'tookMs'  => $search['tookMs'],
            ]);
        } catch (\Throwable $e) {
            Log::error('OverlayController@ask error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Unable to complete federated search: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/overlay/search
     * Fast federated search endpoint with direct query parameters.
     */
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->input('q', $request->input('query', '')));
        if ($q === '') {
            return response()->json([
                'success' => false,
                'message' => 'Query parameter "q" is required.',
            ], 422);
        }

        $sourcesParam = $request->input('sources');
        $sources = null;
        if (is_string($sourcesParam)) {
            $sources = array_filter(array_map('trim', explode(',', $sourcesParam)));
        } elseif (is_array($sourcesParam)) {
            $sources = $sourcesParam;
        }

        $opts = [
            'limit'     => min(max((int) $request->input('limit', 12), 4), 30),
            'max'       => (int) $request->input('max', 60),
            'yearFrom'  => $request->input('yearFrom'),
            'yearTo'    => $request->input('yearTo'),
            'freeOnly'  => filter_var($request->input('freeOnly', false), FILTER_VALIDATE_BOOLEAN),
            'isbn'      => $request->input('isbn'),
        ];

        if ($request->filled('type') && $request->input('type') !== 'all') {
            $opts['types'] = [$request->input('type')];
            $opts['strictTypes'] = true;
        }

        try {
            $search = $this->overlay->search($q, $opts, $sources);
            return response()->json(array_merge(['success' => true], $search));
        } catch (\Throwable $e) {
            Log::error('OverlayController@search error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Search error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/overlay/detail
     * Deep bibliographic detail & live download/reader links for one resource.
     */
    public function detail(Request $request): JsonResponse
    {
        $source = trim($request->input('source', ''));
        $id = trim($request->input('id', ''));

        if (!$source || !$id) {
            return response()->json([
                'success' => false,
                'message' => 'Parameters "source" and "id" are required.',
            ], 422);
        }

        try {
            $item = $this->overlay->detail($source, $id);
            if (!$item) {
                return response()->json([
                    'success' => false,
                    'message' => "Resource not found in {$source}.",
                ], 404);
            }

            return response()->json([
                'success' => true,
                'resource' => $item,
            ]);
        } catch (\Throwable $e) {
            Log::error("OverlayController@detail error for {$source}/{$id}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Could not fetch resource details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/overlay/test-source
     * Live latency and health check for any external source.
     */
    public function testSource(Request $request): JsonResponse
    {
        $source = trim($request->input('source', 'google_books'));
        $query = trim($request->input('query', 'cooperative'));

        $started = microtime(true);
        $res = $this->overlay->search($query, ['limit' => 3, 'max' => 3], [$source]);
        $took = (int) round((microtime(true) - $started) * 1000);

        $status = $res['sources'][0] ?? null;

        return response()->json([
            'success' => ($status['status'] ?? '') === 'ok' || ($status['status'] ?? '') === 'cached',
            'source' => $source,
            'status' => $status,
            'sampleCount' => count($res['results']),
            'latencyMs' => $took,
        ]);
    }
}
