<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\MediaResource;

class LiveBroadcastController extends Controller
{
    /**
     * Helper to read developer media governance
     */
    private function getGovernance(): array
    {
        $defaults = [
            'multimedia_master_enabled' => true,
            'live_broadcast_master_enabled' => true,
            'live_broadcast_social_simulcast' => true,
            'live_broadcast_student_access' => true,
            'live_broadcast_chat_enabled' => true,
            'live_broadcast_auto_archive' => true,
            'live_broadcast_dept_cem' => true,
            'live_broadcast_dept_cs' => true,
            'live_broadcast_dept_bfn' => true,
            'live_broadcast_dept_agr' => true,
            'live_broadcast_dept_acc' => true,
            'live_broadcast_dept_pad' => true,
        ];

        try {
            $row = DB::table('library_settings')->where('setting_key', 'fcc_multimedia_governance')->value('setting_value');
            if ($row) {
                $saved = json_decode($row, true);
                if (is_array($saved)) {
                    return array_merge($defaults, $saved);
                }
            }
        } catch (\Throwable $e) {}

        return $defaults;
    }

    /**
     * GET /api/live-broadcast/active
     * Fetch active live lecture streams for students and campus audience
     */
    public function getActiveStreams(Request $request)
    {
        $gov = $this->getGovernance();
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => true,
                'active' => false,
                'streams' => [],
                'governance_message' => 'Live Broadcasting is currently placed on scheduled maintenance by Library Systems Engineering.'
            ]);
        }

        $streams = DB::table('live_broadcasts')
            ->where('is_live', true)
            ->where('status', 'live')
            ->orderBy('started_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'active' => $streams->isNotEmpty(),
            'count' => $streams->count(),
            'streams' => $streams
        ]);
    }

    /**
     * POST /api/live-broadcast/start
     * Initiate live lecture broadcast from HOD Dashboard or Staff Workspace
     */
    public function start(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:500',
            'department_code' => 'required|string|max:30',
            'lecturer_name' => 'required|string|max:255',
        ]);

        $gov = $this->getGovernance();

        // 1. Master developer kill-switch check
        if (empty($gov['live_broadcast_master_enabled'])) {
            return response()->json([
                'success' => false,
                'code' => 'DEVELOPER_MASTER_LOCKED',
                'error' => 'Live broadcasting is currently disabled campus-wide in the Developer Governance Console.'
            ], 403);
        }

        // 2. Departmental permission check
        $deptCode = strtolower(trim((string)$request->input('department_code', 'cem')));
        $deptKey = 'live_broadcast_dept_' . $deptCode;
        if (isset($gov[$deptKey]) && empty($gov[$deptKey])) {
            return response()->json([
                'success' => false,
                'code' => 'DEPT_LIVE_LOCKED',
                'error' => "Live streaming for the Department of {$request->input('department_name')} is currently locked. Please contact the Library Developer through the Developer Authority Portal to activate live broadcasting."
            ], 403);
        }

        $broadcastId = 'LIVE-' . strtoupper($deptCode) . '-' . date('Ymd-His') . '-' . strtoupper(Str::random(4));

        $data = [
            'id' => $broadcastId,
            'title' => $request->input('title'),
            'department_code' => strtoupper($deptCode),
            'department_name' => $request->input('department_name', 'Co-operative Economics & Management'),
            'course_code' => $request->input('course_code'),
            'course_title' => $request->input('course_title'),
            'lecturer_name' => $request->input('lecturer_name'),
            'lecturer_role' => $request->input('lecturer_role', 'hod'),
            'status' => 'live',
            'is_live' => true,
            'stream_mode' => $request->input('stream_mode', 'system_camera'),
            'resolution' => $request->input('resolution', '1080p Full HD'),
            'viewers_count' => 1,
            'simulcast_destinations' => is_array($request->input('simulcast_destinations'))
                ? json_encode($request->input('simulcast_destinations'))
                : $request->input('simulcast_destinations'),
            'announcement' => $request->input('announcement'),
            'companion_pdf_url' => $request->input('companion_pdf_url'),
            'started_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('live_broadcasts')->insert($data);

        // Broadcast initial system welcome message
        DB::table('live_broadcast_chats')->insert([
            'broadcast_id' => $broadcastId,
            'user_name' => 'FCC Library Broadcast Core',
            'user_role' => 'system',
            'user_matric' => 'SYS-CORE',
            'message' => "🔴 Live Lecture Broadcast started by {$request->input('lecturer_name')} ({$data['department_name']}). All students connecting are verified.",
            'is_question' => false,
            'hand_raised' => false,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Live broadcast session created and initialized',
            'broadcast' => $data
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/end
     * Stop active broadcast and optionally archive recorded video to Central Library Catalogue
     */
    public function end(Request $request, $id)
    {
        $broadcast = DB::table('live_broadcasts')->where('id', $id)->first();
        if (!$broadcast) {
            return response()->json(['error' => 'Broadcast session not found'], 404);
        }

        DB::table('live_broadcasts')->where('id', $id)->update([
            'is_live' => false,
            'status' => 'ended',
            'ended_at' => now(),
            'updated_at' => now()
        ]);

        $archivedMediaId = null;

        // Auto-archive recorded lecture if file is submitted
        if ($request->hasFile('recording_file')) {
            $file = $request->file('recording_file');
            $ext = $file->getClientOriginalExtension() ?: 'mp4';
            $filename = 'FCC-LIVE-ARCHIVE-' . time() . '-' . uniqid() . '.' . $ext;
            $file->storeAs('public/media', $filename);

            $archivedMediaId = 'MED-VID-LIVE-' . strtoupper(Str::random(6));

            DB::table('media_resources')->insert([
                'id' => $archivedMediaId,
                'title' => $broadcast->title . ' (Recorded Live Lecture)',
                'subtitle' => 'Live Broadcast Session from ' . date('F j, Y'),
                'media_type' => 'video',
                'resource_type' => 'lecture_recording',
                'creator' => $broadcast->lecturer_name,
                'creator_title' => $broadcast->lecturer_role === 'hod' ? 'Head of Department' : 'Lecturer',
                'department_id' => $broadcast->department_code,
                'department_name' => $broadcast->department_name,
                'course_code' => $broadcast->course_code,
                'target_level' => 'ND I',
                'duration_seconds' => intval($request->input('duration_seconds', 1800)),
                'duration_formatted' => $request->input('duration_formatted', '30:00'),
                'description' => "Live interactive lecture recording broadcast from the FCC Institutional Multimedia Studio. Archived automatically for student review and examination revision.",
                'subject_keywords' => json_encode(['Live Lecture', $broadcast->department_name, $broadcast->course_code]),
                'media_url' => '/storage/media/' . $filename,
                'video_resolution' => $broadcast->resolution ?: '1080p Full HD',
                'access_level' => 'open_access',
                'status' => 'published',
                'uploaded_by' => $broadcast->lecturer_name,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            DB::table('live_broadcasts')->where('id', $id)->update([
                'recording_media_id' => $archivedMediaId
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Broadcast terminated successfully',
            'archived_media_id' => $archivedMediaId
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/chat
     * Live chat polling & messages
     */
    public function getChatMessages(Request $request, $id)
    {
        $messages = DB::table('live_broadcast_chats')
            ->where('broadcast_id', $id)
            ->orderBy('id', 'asc')
            ->take(200)
            ->get();

        $viewersCount = DB::table('live_broadcasts')->where('id', $id)->value('viewers_count') ?: 1;

        return response()->json([
            'success' => true,
            'messages' => $messages,
            'viewers_count' => $viewersCount
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/chat
     * Send student chat message or raised hand question
     */
    public function sendChatMessage(Request $request, $id)
    {
        $request->validate([
            'user_name' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
        ]);

        $chatId = DB::table('live_broadcast_chats')->insertGetId([
            'broadcast_id' => $id,
            'user_name' => $request->input('user_name'),
            'user_role' => $request->input('user_role', 'student'),
            'user_matric' => $request->input('user_matric', 'STUDENT'),
            'message' => trim($request->input('message')),
            'is_question' => $request->boolean('is_question'),
            'hand_raised' => $request->boolean('hand_raised'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'chat_id' => $chatId
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/heartbeat
     * Student viewer heartbeat to keep active viewer count accurate
     */
    public function heartbeat(Request $request, $id)
    {
        DB::table('live_broadcasts')->where('id', $id)->increment('viewers_count');
        $viewers = DB::table('live_broadcasts')->where('id', $id)->value('viewers_count');

        return response()->json([
            'success' => true,
            'viewers_count' => $viewers
        ]);
    }

    /**
     * GET /api/live-broadcast/social-destinations
     * Get configured social destinations (YouTube, Facebook, LinkedIn, X, Twitch)
     */
    public function getSocialDestinations(Request $request)
    {
        $dept = $request->input('department_code', 'GLOBAL');
        $destinations = DB::table('live_social_destinations')
            ->whereIn('department_code', ['GLOBAL', $dept])
            ->get();

        if ($destinations->isEmpty()) {
            // Seed initial supported social media platforms
            $defaultPlatforms = [
                ['platform' => 'youtube', 'platform_name' => 'YouTube Live (RTMP)', 'server_url' => 'rtmp://a.rtmp.youtube.com/live2', 'stream_key' => '', 'enabled' => true],
                ['platform' => 'facebook', 'platform_name' => 'Facebook Live Video', 'server_url' => 'rtmps://live-api-s.facebook.com:443/rtmp/', 'stream_key' => '', 'enabled' => true],
                ['platform' => 'linkedin', 'platform_name' => 'LinkedIn Live Stream', 'server_url' => 'rtmps://live-api.linkedin.com:443/rtmp/', 'stream_key' => '', 'enabled' => false],
                ['platform' => 'twitter', 'platform_name' => 'X / Twitter Live Producer', 'server_url' => 'rtmp://va.pscp.tv:80/x', 'stream_key' => '', 'enabled' => false],
                ['platform' => 'twitch', 'platform_name' => 'Twitch Academic Broadcast', 'server_url' => 'rtmp://live.twitch.tv/app/', 'stream_key' => '', 'enabled' => false],
                ['platform' => 'custom_rtmp', 'platform_name' => 'Custom Institutional RTMP / HLS', 'server_url' => 'rtmp://stream.fccibadanlibrary.com.ng/live', 'stream_key' => '', 'enabled' => true],
            ];

            foreach ($defaultPlatforms as $dp) {
                DB::table('live_social_destinations')->insert([
                    'department_code' => $dept,
                    'platform' => $dp['platform'],
                    'platform_name' => $dp['platform_name'],
                    'server_url' => $dp['server_url'],
                    'stream_key' => $dp['stream_key'],
                    'enabled' => $dp['enabled'],
                    'status' => 'configured',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }

            $destinations = DB::table('live_social_destinations')->where('department_code', $dept)->get();
        }

        return response()->json([
            'success' => true,
            'destinations' => $destinations
        ]);
    }

    /**
     * POST /api/live-broadcast/social-destinations
     * Update social media stream keys and URLs
     */
    public function saveSocialDestinations(Request $request)
    {
        $dests = $request->input('destinations', []);
        $dept = $request->input('department_code', 'GLOBAL');

        foreach ($dests as $d) {
            if (isset($d['platform'])) {
                DB::table('live_social_destinations')->updateOrInsert(
                    ['department_code' => $dept, 'platform' => $d['platform']],
                    [
                        'platform_name' => $d['platform_name'] ?? ucfirst($d['platform']),
                        'server_url' => $d['server_url'] ?? '',
                        'stream_key' => $d['stream_key'] ?? '',
                        'enabled' => !empty($d['enabled']),
                        'status' => !empty($d['stream_key']) ? 'ready' : 'configured',
                        'updated_at' => now()
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Social media simulcast destinations saved successfully'
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/signal
     * WebRTC signaling message exchange (offer, answer, ice_candidate, join)
     */
    public function sendSignal(Request $request, $id)
    {
        $request->validate([
            'sender_id' => 'required|string|max:120',
            'recipient_id' => 'required|string|max:120',
            'signal_type' => 'required|string|max:50',
            'payload' => 'required',
        ]);

        $payload = is_string($request->input('payload'))
            ? $request->input('payload')
            : json_encode($request->input('payload'));

        $signalId = DB::table('live_broadcast_signals')->insertGetId([
            'broadcast_id' => $id,
            'sender_id' => $request->input('sender_id'),
            'recipient_id' => $request->input('recipient_id'),
            'signal_type' => $request->input('signal_type'),
            'payload' => $payload,
            'consumed' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Purge expired signals (> 10 minutes)
        DB::table('live_broadcast_signals')
            ->where('created_at', '<', now()->subMinutes(10))
            ->delete();

        return response()->json([
            'success' => true,
            'signal_id' => $signalId,
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/signal
     * Fetch pending WebRTC signals for recipient
     */
    public function getSignals(Request $request, $id)
    {
        $recipientId = $request->input('recipient_id');
        $sinceId = intval($request->input('since_id', 0));

        if (!$recipientId) {
            return response()->json(['success' => false, 'error' => 'Missing recipient_id'], 400);
        }

        $query = DB::table('live_broadcast_signals')
            ->where('broadcast_id', $id)
            ->where('recipient_id', $recipientId);

        if ($sinceId > 0) {
            $query->where('id', '>', $sinceId);
        } else {
            $query->where('consumed', false);
        }

        $signals = $query->orderBy('id', 'asc')->take(50)->get();

        if ($signals->isNotEmpty() && $sinceId === 0) {
            $ids = $signals->pluck('id')->all();
            DB::table('live_broadcast_signals')->whereIn('id', $ids)->update(['consumed' => true]);
        }

        return response()->json([
            'success' => true,
            'signals' => $signals,
        ]);
    }

    /**
     * POST /api/live-broadcast/{id}/chunk
     * Append live recorded video segment for live HTTP playback
     */
    public function uploadChunk(Request $request, $id)
    {
        if (!$request->hasFile('chunk')) {
            return response()->json(['success' => false, 'error' => 'No video chunk file provided'], 400);
        }

        $chunk = $request->file('chunk');
        $dir = storage_path('app/public/live/' . $id);
        if (!file_exists($dir)) {
            mkdir($dir, 0777, true);
        }

        $filePath = $dir . '/stream.webm';
        $chunkIndex = intval($request->input('chunk_index', 0));

        // If first chunk, initialize; otherwise append
        if ($chunkIndex === 0 && !file_exists($filePath)) {
            file_put_contents($filePath, file_get_contents($chunk->getRealPath()));
        } else {
            file_put_contents($filePath, file_get_contents($chunk->getRealPath()), FILE_APPEND);
        }

        // Ensure live_broadcast record points to this live stream
        DB::table('live_broadcasts')->where('id', $id)->update([
            'stream_mode' => 'active_recording',
            'updated_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'chunk_index' => $chunkIndex,
            'bytes_written' => file_exists($filePath) ? filesize($filePath) : 0,
            'stream_url' => '/storage/live/' . $id . '/stream.webm',
        ]);
    }

    /**
     * GET /api/live-broadcast/{id}/stream
     * Stream live WebM audio/video with RFC 7233 partial content support
     */
    public function getLiveStream(Request $request, $id)
    {
        $filePath = storage_path('app/public/live/' . $id . '/stream.webm');
        if (!file_exists($filePath)) {
            return response()->json(['error' => 'Live stream buffer not ready yet'], 404);
        }

        $fileSize = filesize($filePath);
        $headers = [
            'Content-Type' => 'video/webm',
            'Accept-Ranges' => 'bytes',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
        ];

        $range = $request->header('Range');
        if ($range) {
            list($param, $range) = explode('=', $range);
            if (strtolower(trim($param)) === 'bytes') {
                list($from, $to) = explode('-', $range);
                $from = intval($from);
                $to = empty($to) ? ($fileSize - 1) : intval($to);
                $length = $to - $from + 1;

                $headers['Content-Range'] = sprintf('bytes %d-%d/%d', $from, $to, $fileSize);
                $headers['Content-Length'] = $length;

                return response()->stream(function () use ($filePath, $from, $length) {
                    $stream = fopen($filePath, 'rb');
                    fseek($stream, $from);
                    $bytesSent = 0;
                    $buffer = 64 * 1024;
                    while (!feof($stream) && $bytesSent < $length) {
                        $chunkSize = min($buffer, $length - $bytesSent);
                        echo fread($stream, $chunkSize);
                        flush();
                        $bytesSent += $chunkSize;
                    }
                    fclose($stream);
                }, 206, $headers);
            }
        }

        $headers['Content-Length'] = $fileSize;
        return response()->file($filePath, $headers);
    }
}

