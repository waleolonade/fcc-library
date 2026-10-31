<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CommunicationController extends Controller
{
    /**
     * List all communications with flexible role, user, and department filtering
     */
    public function index(Request $request)
    {
        $role = $request->query('role'); // student, hod, admin
        $userId = $request->query('user_id'); // matric or staff id
        $dept = $request->query('dept');
        $threadId = $request->query('thread_id');
        $category = $request->query('category');
        $status = $request->query('status');

        $query = DB::table('institutional_communications');

        if ($threadId) {
            $query->where('thread_id', $threadId);
        } else {
            // Role & User scoped visibility
            if ($role === 'student' && $userId) {
                $query->where(function ($q) use ($userId, $dept) {
                    $q->where('sender_id', $userId)
                      ->orWhere('recipient_id', $userId)
                      ->orWhere('recipient_role', 'student')
                      ->orWhere('recipient_role', 'all');
                    if ($dept) {
                        $q->orWhere('recipient_dept', $dept);
                    }
                });
            } elseif ($role === 'hod') {
                $query->where(function ($q) use ($userId, $dept) {
                    $q->where('sender_role', 'hod')
                      ->orWhere('recipient_role', 'hod')
                      ->orWhere('recipient_role', 'all');
                    if ($dept) {
                        $q->orWhere('sender_dept', $dept)
                          ->orWhere('recipient_dept', $dept);
                    }
                    if ($userId) {
                        $q->orWhere('recipient_id', $userId);
                    }
                });
            } elseif ($role === 'admin') {
                // Admin sees admin messages, requests addressed to library, or all
                if ($request->query('scope') !== 'all') {
                    $query->where(function ($q) {
                        $q->where('recipient_role', 'admin')
                          ->orWhere('sender_role', 'admin')
                          ->orWhere('recipient_id', 'all')
                          ->orWhere('category', 'acquisition_request')
                          ->orWhere('category', 'clearance_request');
                    });
                }
            }
        }

        if ($category) {
            $query->where('category', $category);
        }
        if ($status) {
            $query->where('status', $status);
        }

        $messages = $query->orderBy('created_at', 'desc')->get();

        // Calculate role-specific stats
        $stats = [
            'total' => DB::table('institutional_communications')->count(),
            'unread_for_admin' => DB::table('institutional_communications')
                ->where('recipient_role', 'admin')
                ->where('status', 'unread')
                ->count(),
            'pending_acquisitions' => DB::table('institutional_communications')
                ->where('category', 'acquisition_request')
                ->whereIn('status', ['unread', 'in_progress'])
                ->count(),
            'pending_clearances' => DB::table('institutional_communications')
                ->where('category', 'clearance_request')
                ->whereIn('status', ['unread', 'in_progress'])
                ->count(),
            'unread_for_hod' => DB::table('institutional_communications')
                ->where('recipient_role', 'hod')
                ->where('status', 'unread')
                ->count(),
            'unread_for_student' => DB::table('institutional_communications')
                ->where(function ($q) use ($userId) {
                    if ($userId) $q->where('recipient_id', $userId);
                    $q->orWhere('recipient_role', 'all');
                })
                ->where('status', 'unread')
                ->count()
        ];

        return response()->json([
            'messages' => $messages,
            'stats' => $stats
        ]);
    }

    /**
     * Store new communication / dispatch
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sender_id' => 'required|string',
            'sender_name' => 'required|string',
            'sender_role' => 'required|in:student,hod,admin',
            'sender_dept' => 'nullable|string',
            'recipient_id' => 'required|string',
            'recipient_name' => 'required|string',
            'recipient_role' => 'required|in:student,hod,admin,all',
            'recipient_dept' => 'nullable|string',
            'category' => 'required|string',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'priority' => 'nullable|string|in:normal,high,urgent',
            'action_type' => 'nullable|string',
            'action_data' => 'nullable',
            'thread_id' => 'nullable|string'
        ]);

        $msgId = 'MSG-' . date('Ymd') . '-' . strtoupper(Str::random(4));
        $threadId = $validated['thread_id'] ?? ('TH-' . strtoupper(Str::random(8)));

        $record = [
            'msg_id' => $msgId,
            'thread_id' => $threadId,
            'sender_id' => $validated['sender_id'],
            'sender_name' => $validated['sender_name'],
            'sender_role' => $validated['sender_role'],
            'sender_dept' => $validated['sender_dept'] ?? null,
            'recipient_id' => $validated['recipient_id'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_role' => $validated['recipient_role'],
            'recipient_dept' => $validated['recipient_dept'] ?? null,
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'priority' => $validated['priority'] ?? 'normal',
            'status' => 'unread',
            'action_type' => $validated['action_type'] ?? null,
            'action_data' => isset($validated['action_data']) ? json_encode($validated['action_data']) : null,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('institutional_communications')->insert($record);
        $this->syncToMysql($record);

        return response()->json([
            'success' => true,
            'message' => 'Institutional dispatch transmitted successfully.',
            'data' => $record
        ], 201);
    }

    /**
     * Mark message as read or update status
     */
    public function updateStatus(Request $request, $id)
    {
        $status = $request->input('status', 'read');
        
        DB::table('institutional_communications')
            ->where('id', $id)
            ->orWhere('msg_id', $id)
            ->update([
                'status' => $status,
                'updated_at' => now()
            ]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE institutional_communications SET status = :status, updated_at = NOW() WHERE id = :id OR msg_id = :mid");
                $st->execute([':status' => $status, ':id' => $id, ':mid' => $id]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'status' => $status
        ]);
    }

    /**
     * Reply to a thread
     */
    public function reply(Request $request, $threadId)
    {
        $validated = $request->validate([
            'sender_id' => 'required|string',
            'sender_name' => 'required|string',
            'sender_role' => 'required|in:student,hod,admin',
            'sender_dept' => 'nullable|string',
            'recipient_id' => 'required|string',
            'recipient_name' => 'required|string',
            'recipient_role' => 'required|in:student,hod,admin,all',
            'subject' => 'required|string',
            'message' => 'required|string'
        ]);

        $msgId = 'MSG-' . date('Ymd') . '-' . strtoupper(Str::random(4));

        $record = [
            'msg_id' => $msgId,
            'thread_id' => $threadId,
            'sender_id' => $validated['sender_id'],
            'sender_name' => $validated['sender_name'],
            'sender_role' => $validated['sender_role'],
            'sender_dept' => $validated['sender_dept'] ?? null,
            'recipient_id' => $validated['recipient_id'],
            'recipient_name' => $validated['recipient_name'],
            'recipient_role' => $validated['recipient_role'],
            'category' => 'reply',
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'priority' => 'normal',
            'status' => 'unread',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::table('institutional_communications')->insert($record);
        $this->syncToMysql($record);

        // Mark original thread items as in_progress or resolved
        DB::table('institutional_communications')
            ->where('thread_id', $threadId)
            ->where('msg_id', '!=', $msgId)
            ->update(['status' => 'in_progress', 'updated_at' => now()]);

        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if ($pdo) {
                $st = $pdo->prepare("UPDATE institutional_communications SET status = 'in_progress', updated_at = NOW() WHERE thread_id = :tid AND msg_id != :mid");
                $st->execute([':tid' => $threadId, ':mid' => $msgId]);
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Reply dispatched to thread.',
            'data' => $record
        ], 201);
    }

    private function syncToMysql(array $record): void
    {
        try {
            $pdo = \App\Services\DatabaseService::getPdo();
            if (!$pdo) return;

            $st = $pdo->prepare("
                INSERT INTO institutional_communications 
                (msg_id, thread_id, sender_id, sender_name, sender_role, sender_dept, recipient_id, recipient_name, recipient_role, recipient_dept, category, subject, message, priority, status, action_type, action_data, created_at, updated_at)
                VALUES 
                (:msg_id, :thread_id, :sender_id, :sender_name, :sender_role, :sender_dept, :recipient_id, :recipient_name, :recipient_role, :recipient_dept, :category, :subject, :message, :priority, :status, :action_type, :action_data, NOW(), NOW())
                ON DUPLICATE KEY UPDATE status = VALUES(status), updated_at = NOW()
            ");
            $st->execute([
                ':msg_id' => $record['msg_id'],
                ':thread_id' => $record['thread_id'],
                ':sender_id' => $record['sender_id'],
                ':sender_name' => $record['sender_name'],
                ':sender_role' => $record['sender_role'],
                ':sender_dept' => $record['sender_dept'] ?? null,
                ':recipient_id' => $record['recipient_id'],
                ':recipient_name' => $record['recipient_name'],
                ':recipient_role' => $record['recipient_role'],
                ':recipient_dept' => $record['recipient_dept'] ?? null,
                ':category' => $record['category'],
                ':subject' => $record['subject'],
                ':message' => $record['message'],
                ':priority' => $record['priority'] ?? 'normal',
                ':status' => $record['status'] ?? 'unread',
                ':action_type' => $record['action_type'] ?? null,
                ':action_data' => $record['action_data'] ?? null
            ]);
        } catch (\Throwable $e) {}
    }
}
