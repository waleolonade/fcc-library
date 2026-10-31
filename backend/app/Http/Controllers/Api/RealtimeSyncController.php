<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeSyncController extends Controller
{
    private static string $eventsFile = 'realtime_events.json';

    /**
     * Record a real-time event to the high-speed storage buffer
     */
    public static function recordEvent(array $event): array
    {
        $id = $event['eventId'] ?? $event['id'] ?? (string) uniqid('evt_', true);
        $timestamp = $event['timestamp'] ?? round(microtime(true) * 1000);

        $record = [
            'eventId' => $id,
            'action' => strtoupper($event['action'] ?? 'MODIFY'), // UPLOAD | DELETE | MODIFY | APPROVE | REJECT
            'entity' => strtolower($event['entity'] ?? 'book'),   // book | upload | journal
            'id' => (string) ($event['entityId'] ?? $event['id'] ?? ''),
            'ids' => array_values(array_filter(array_map('strval', $event['ids'] ?? (!empty($event['id']) ? [$event['id']] : [])))),
            'title' => (string) ($event['title'] ?? ''),
            'data' => $event['data'] ?? [],
            'timestamp' => $timestamp,
            'source' => $event['source'] ?? 'backend'
        ];

        try {
            $existing = [];
            if (Storage::disk('local')->exists(self::$eventsFile)) {
                $content = Storage::disk('local')->get(self::$eventsFile);
                $existing = json_decode($content, true) ?: [];
            }
            // Prepend new event and keep latest 200 events
            array_unshift($existing, $record);
            if (count($existing) > 200) {
                $existing = array_slice($existing, 0, 200);
            }
            Storage::disk('local')->put(self::$eventsFile, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
        } catch (\Throwable $e) {
            \Log::warning('RealtimeSyncController recordEvent warning: ' . $e->getMessage());
        }

        return $record;
    }

    /**
     * Poll recent events since a timestamp
     */
    public function getEvents(Request $request)
    {
        $since = (float) $request->query('since', 0);
        $events = [];

        try {
            if (Storage::disk('local')->exists(self::$eventsFile)) {
                $content = Storage::disk('local')->get(self::$eventsFile);
                $all = json_decode($content, true) ?: [];
                if ($since > 0) {
                    $events = array_values(array_filter($all, function ($e) use ($since) {
                        return ($e['timestamp'] ?? 0) > $since;
                    }));
                } else {
                    $events = array_slice($all, 0, 40);
                }
            }
        } catch (\Throwable $e) {
            \Log::warning('Realtime getEvents error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'serverTime' => round(microtime(true) * 1000),
            'count' => count($events),
            'events' => $events
        ]);
    }

    /**
     * Client endpoint to broadcast an event across all devices
     */
    public function broadcast(Request $request)
    {
        $payload = $request->all();
        $payload['source'] = 'client';
        $record = self::recordEvent($payload);

        return response()->json([
            'success' => true,
            'serverTime' => round(microtime(true) * 1000),
            'event' => $record
        ]);
    }

    /**
     * Server-Sent Events (SSE) live push stream
     */
    public function stream(Request $request)
    {
        $response = new StreamedResponse(function () use ($request) {
            $lastTimestamp = (float) $request->query('since', round(microtime(true) * 1000) - 1500);
            $startTime = time();

            // Run stream for up to 30 seconds per persistent HTTP connection
            while (time() - $startTime < 30) {
                if (connection_aborted()) break;

                $events = [];
                if (Storage::disk('local')->exists(self::$eventsFile)) {
                    $content = Storage::disk('local')->get(self::$eventsFile);
                    $all = json_decode($content, true) ?: [];
                    $events = array_values(array_filter($all, function ($e) use ($lastTimestamp) {
                        return ($e['timestamp'] ?? 0) > $lastTimestamp;
                    }));
                }

                if (!empty($events)) {
                    // Send oldest first to preserve chronological order
                    foreach (array_reverse($events) as $evt) {
                        echo "data: " . json_encode($evt) . "\n\n";
                        $lastTimestamp = max($lastTimestamp, $evt['timestamp'] ?? 0);
                    }
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                } else {
                    echo ": heartbeat\n\n";
                    if (ob_get_level() > 0) ob_flush();
                    flush();
                }

                usleep(800000); // 800ms polling cycle
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache, no-transform');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }
}

