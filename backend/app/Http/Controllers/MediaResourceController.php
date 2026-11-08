<?php

namespace App\Http\Controllers;

use App\Models\MediaResource;
use App\Models\MediaChapter;
use App\Models\MediaTranscript;
use App\Models\MediaProgress;
use App\Models\MediaCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MediaResourceController extends Controller
{
    /**
     * Search & Filter Media Catalogue Records
     * Audiobooks, Lectures, Practical Demos, Documentaries
     */
    public function index(Request $request)
    {
        $query = MediaResource::with(['chapters', 'transcripts']);

        // Only published unless preview requested by admin/hod
        if (!$request->boolean('include_drafts')) {
            $query->where('status', 'published');
        }

        // Media Type Filter: 'all', 'audio', 'video'
        $mediaType = strtolower(trim((string) $request->input('media_type', 'all')));
        if ($mediaType !== 'all' && in_array($mediaType, ['audio', 'video', 'multimedia_package'])) {
            $query->where('media_type', $mediaType);
        }

        // Resource Type Filter: audiobook, lecture_recording, practical_demo, documentary, podcast, etc.
        if ($request->filled('resource_type')) {
            $query->where('resource_type', $request->input('resource_type'));
        }

        // Department Filter
        if ($request->filled('department')) {
            $dept = $request->input('department');
            $query->where(function ($q) use ($dept) {
                $q->where('department_name', 'like', "%{$dept}%")
                  ->orWhere('department_id', $dept);
            });
        }

        // Target Level Filter: ND I, ND II, HND I, HND II
        if ($request->filled('target_level')) {
            $query->where('target_level', $request->input('target_level'));
        }

        // Course Code Filter
        if ($request->filled('course_code')) {
            $query->where('course_code', 'like', "%" . $request->input('course_code') . "%");
        }

        // Access Level Filter
        if ($request->filled('access_level')) {
            $query->where('access_level', $request->input('access_level'));
        }

        // Keyword Search (Dublin Core terms: title, creator, description, subject)
        if ($request->filled('search')) {
            $s = trim((string) $request->input('search'));
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('subtitle', 'like', "%{$s}%")
                  ->orWhere('creator', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%")
                  ->orWhere('course_code', 'like', "%{$s}%")
                  ->orWhere('department_name', 'like', "%{$s}%")
                  ->orWhere('subject_keywords', 'like', "%{$s}%");
            });
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'newest');
        switch ($sortBy) {
            case 'popular':
            case 'views':
                $query->orderBy('view_count', 'desc');
                break;
            case 'plays':
                $query->orderBy('play_count', 'desc');
                break;
            case 'rating':
                $query->orderBy('rating', 'desc');
                break;
            case 'title':
                $query->orderBy('title', 'asc');
                break;
            case 'duration':
                $query->orderBy('duration_seconds', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = max(4, min((int) $request->input('per_page', 24), 100));
        $resources = $query->paginate($perPage);

        return response()->json($resources);
    }

    /**
     * Get Single Media Dossier with Chapters, Transcripts and Companion PDF
     */
    public function show($id, Request $request)
    {
        $resource = MediaResource::with([
            'chapters' => function ($q) { $q->orderBy('chapter_index', 'asc'); },
            'transcripts',
            'companionBook',
            'collections'
        ])->find($id);

        if (!$resource) {
            return response()->json(['error' => 'Media resource not found'], 404);
        }

        // Increment view count
        $resource->increment('view_count');

        // Check if current user has saved playback progress
        $progress = null;
        $userIdentifier = $request->input('user_id', $request->input('matric', $request->header('X-User-Matric')));
        if ($userIdentifier) {
            $progress = MediaProgress::where('media_resource_id', $id)
                ->where('user_identifier', $userIdentifier)
                ->first();
        }

        return response()->json([
            'resource' => $resource,
            'progress' => $progress,
            'iiif_manifest_url' => url("/api/media/{$id}/iiif-manifest"),
            'stream_endpoint' => url("/api/media/{$id}/stream"),
        ]);
    }

    /**
     * RFC 7233 HTTP Partial Content (206) Media Streaming Engine
     * Supports high-performance byte-range seeking for MP4 and MP3 files
     * Works seamlessly on shared cPanel hosting without RAM exhaustion.
     */
    public function stream($id, Request $request)
    {
        $resource = MediaResource::find($id);
        if (!$resource) {
            abort(404, 'Media resource not found');
        }

        $mediaUrl = $resource->media_url;

        // If media URL is an external web stream (e.g. YouTube, Vimeo, or remote CDN), redirect or forward
        if (str_starts_with($mediaUrl, 'http://') || str_starts_with($mediaUrl, 'https://')) {
            return redirect()->away($mediaUrl);
        }

        // Local storage resolution
        $filePath = null;
        if (file_exists($mediaUrl)) {
            $filePath = $mediaUrl;
        } elseif (file_exists(public_path($mediaUrl))) {
            $filePath = public_path($mediaUrl);
        } elseif (Storage::disk('public')->exists($mediaUrl)) {
            $filePath = Storage::disk('public')->path($mediaUrl);
        } elseif (file_exists(storage_path("app/public/{$mediaUrl}"))) {
            $filePath = storage_path("app/public/{$mediaUrl}");
        }

        // Fallback demo sample streams if local file not yet uploaded
        if (!$filePath || !file_exists($filePath)) {
            if ($resource->media_type === 'audio') {
                return redirect()->away('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3');
            } else {
                return redirect()->away('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
            }
        }

        $fileSize = filesize($filePath);
        $mimeType = $resource->mime_type ?: mime_content_type($filePath);

        $start = 0;
        $end = $fileSize - 1;
        $length = $fileSize;
        $statusCode = 200;

        // Range Header Inspection
        $rangeHeader = $request->header('Range');
        if ($rangeHeader && preg_match('/bytes=\h*(\d+)-(\d*)[\D.*]?/i', $rangeHeader, $matches)) {
            $start = intval($matches[1]);
            if (!empty($matches[2])) {
                $end = intval($matches[2]);
            }
            if ($start > $end || $start >= $fileSize) {
                return response('', 416, [
                    'Content-Range' => "bytes */{$fileSize}"
                ]);
            }
            $length = $end - $start + 1;
            $statusCode = 206; // Partial Content
        }

        // Increment play count on initial start request
        if ($start === 0) {
            $resource->increment('play_count');
        }

        $headers = [
            'Content-Type' => $mimeType,
            'Content-Length' => $length,
            'Accept-Ranges' => 'bytes',
            'Content-Range' => "bytes {$start}-{$end}/{$fileSize}",
            'Cache-Control' => 'no-cache, private',
            'X-Playback-Session' => "fcc-media-{$id}",
        ];

        return new StreamedResponse(function () use ($filePath, $start, $length) {
            $fp = fopen($filePath, 'rb');
            if ($fp === false) return;
            fseek($fp, $start);
            $bytesRemaining = $length;
            $chunkSize = 1024 * 128; // 128 KB buffer

            while (!feof($fp) && $bytesRemaining > 0 && connection_status() === 0) {
                $readLength = min($chunkSize, $bytesRemaining);
                $buffer = fread($fp, $readLength);
                echo $buffer;
                flush();
                $bytesRemaining -= strlen($buffer);
            }
            fclose($fp);
        }, $statusCode, $headers);
    }

    /**
     * IIIF Presentation API 3.0 Manifest Generator for AV Interoperability
     * Allows integration with universal IIIF viewers like Mirador & Universal Viewer
     */
    public function iiifManifest($id)
    {
        $resource = MediaResource::with('chapters')->find($id);
        if (!$resource) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $manifest = [
            '@context' => 'http://iiif.io/api/presentation/3/context.json',
            'id' => url("/api/media/{$id}/iiif-manifest"),
            'type' => 'Manifest',
            'label' => ['en' => [$resource->title]],
            'metadata' => [
                ['label' => ['en' => ['Creator']], 'value' => ['en' => [$resource->creator]]],
                ['label' => ['en' => ['Department']], 'value' => ['en' => [$resource->department_name ?: 'General Studies']]],
                ['label' => ['en' => ['Course Code']], 'value' => ['en' => [$resource->course_code ?: 'N/A']]],
                ['label' => ['en' => ['Access Level']], 'value' => ['en' => [$resource->access_level]]],
            ],
            'items' => [
                [
                    'id' => url("/api/media/{$id}/canvas/1"),
                    'type' => 'Canvas',
                    'duration' => $resource->duration_seconds,
                    'items' => [
                        [
                            'id' => url("/api/media/{$id}/page/1"),
                            'type' => 'AnnotationPage',
                            'items' => [
                                [
                                    'id' => url("/api/media/{$id}/annotation/1"),
                                    'type' => 'Annotation',
                                    'motivation' => 'painting',
                                    'body' => [
                                        'id' => $resource->media_url,
                                        'type' => $resource->media_type === 'video' ? 'Video' : 'Sound',
                                        'format' => $resource->mime_type ?: ($resource->media_type === 'video' ? 'video/mp4' : 'audio/mpeg'),
                                        'duration' => $resource->duration_seconds,
                                    ],
                                    'target' => url("/api/media/{$id}/canvas/1")
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        return response()->json($manifest);
    }

    /**
     * Save Student Playback Progress (Resume Point)
     */
    public function saveProgress(Request $request, $id)
    {
        $request->validate([
            'user_identifier' => 'required|string',
            'position_seconds' => 'required|numeric|min:0',
            'total_seconds' => 'required|numeric|min:1',
        ]);

        $userId = trim((string) $request->input('user_identifier'));
        $pos = intval($request->input('position_seconds'));
        $total = intval($request->input('total_seconds'));
        $pct = min(100, max(0, intval(($pos / $total) * 100)));
        $completed = $pct >= 90 || $request->boolean('completed');

        $progress = MediaProgress::updateOrCreate(
            ['user_identifier' => $userId, 'media_resource_id' => $id],
            [
                'last_position_seconds' => $pos,
                'total_duration_seconds' => $total,
                'completion_percentage' => $pct,
                'completed' => $completed,
                'last_accessed_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'progress' => $progress
        ]);
    }

    /**
     * Get Student Playback Progress
     */
    public function getProgress(Request $request, $id)
    {
        $userId = $request->input('user_identifier', $request->input('matric'));
        if (!$userId) {
            return response()->json(['progress' => null]);
        }

        $progress = MediaProgress::where('media_resource_id', $id)
            ->where('user_identifier', $userId)
            ->first();

        return response()->json(['progress' => $progress]);
    }

    /**
     * Curated Multimedia Collections
     */
    public function collections()
    {
        $collections = MediaCollection::with(['items' => function ($q) {
            $q->where('status', 'published')->take(10);
        }])->orderBy('sort_order', 'asc')->get();

        return response()->json([
            'success' => true,
            'collections' => $collections
        ]);
    }

    /**
     * Ingest New Media Resource (Librarian & HOD Upload API)
     */
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:500',
            'creator' => 'required|string|max:255',
            'media_type' => 'required|in:audio,video,multimedia_package',
            'resource_type' => 'required|string|max:60',
        ]);

        $id = 'MED-' . strtoupper(substr($request->input('media_type'), 0, 3)) . '-' . strtoupper(substr(uniqid(), -6));

        $data = $request->only([
            'title', 'subtitle', 'media_type', 'resource_type', 'creator', 'creator_title',
            'department_id', 'department_name', 'course_code', 'target_level', 'semester',
            'duration_seconds', 'duration_formatted', 'description', 'subject_keywords',
            'language', 'publication_date', 'publisher', 'call_number', 'shelf_location',
            'access_level', 'license_type', 'copyright_owner', 'cover_image', 'media_url',
            'hls_manifest_url', 'download_allowed', 'download_url', 'mime_type',
            'video_resolution', 'audio_bitrate', 'companion_book_id', 'companion_pdf_url',
            'companion_pdf_title', 'status', 'uploaded_by'
        ]);

        $data['id'] = $id;

        // Auto-compute duration formatted if seconds provided
        if (!empty($data['duration_seconds']) && empty($data['duration_formatted'])) {
            $secs = intval($data['duration_seconds']);
            $hrs = floor($secs / 3600);
            $mins = floor(($secs % 3600) / 60);
            $rem = $secs % 60;
            $data['duration_formatted'] = $hrs > 0
                ? sprintf('%02d:%02d:%02d', $hrs, $mins, $rem)
                : sprintf('%02d:%02d', $mins, $rem);
        }

        $resource = MediaResource::create($data);

        // Store Chapters if provided
        if ($request->has('chapters') && is_array($request->input('chapters'))) {
            foreach ($request->input('chapters') as $idx => $chap) {
                if (!empty($chap['title'])) {
                    MediaChapter::create([
                        'media_resource_id' => $id,
                        'chapter_index' => $idx + 1,
                        'title' => $chap['title'],
                        'start_seconds' => $chap['start_seconds'] ?? 0,
                        'end_seconds' => $chap['end_seconds'] ?? null,
                        'timestamp_formatted' => $chap['timestamp_formatted'] ?? '00:00',
                        'description' => $chap['description'] ?? null,
                    ]);
                }
            }
        }

        // Store Transcript if provided
        if ($request->filled('transcript_text') || $request->has('timed_cues')) {
            MediaTranscript::create([
                'media_resource_id' => $id,
                'language' => $request->input('transcript_language', 'en'),
                'format' => $request->input('transcript_format', 'cues_json'),
                'content' => $request->input('transcript_text', ''),
                'timed_cues' => $request->input('timed_cues', []),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Media resource catalogued successfully',
            'resource' => $resource->load(['chapters', 'transcripts'])
        ], 201);
    }

    /**
     * Update Media Resource
     */
    public function update($id, Request $request)
    {
        $resource = MediaResource::find($id);
        if (!$resource) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $data = $request->except(['id', 'created_at', 'updated_at']);
        $resource->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Media resource updated',
            'resource' => $resource->fresh(['chapters', 'transcripts'])
        ]);
    }

    /**
     * Delete Media Resource
     */
    public function destroy($id)
    {
        $resource = MediaResource::find($id);
        if (!$resource) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $resource->delete();

        return response()->json([
            'success' => true,
            'message' => 'Media resource removed from catalogue'
        ]);
    }
}

