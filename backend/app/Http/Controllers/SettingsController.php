<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SettingsController extends Controller
{
    /**
     * GET /api/settings
     * Configurable Library Settings per Prompt 49.
     */
    public function index(Request $request)
    {
        $all = DB::table('library_settings')->get();
        $map = [];
        foreach ($all as $s) {
            $val = $s->setting_value;
            if ($s->value_type === 'integer') $val = (int)$val;
            elseif ($s->value_type === 'boolean') $val = filter_var($val, FILTER_VALIDATE_BOOLEAN);
            elseif ($s->value_type === 'decimal') $val = (float)$val;
            $map[$s->setting_key] = $val;
        }

        return response()->json([
            'settings' => $map,
            'raw' => $all
        ]);
    }

    /**
     * POST /api/settings
     * Update institutional settings dynamically.
     */
    public function update(Request $request)
    {
        $data = $request->all();
        $actor = $request->input('_actor', 'Chief Librarian');
        unset($data['_actor']);

        foreach ($data as $key => $value) {
            if ($key === 'settings' && is_array($value)) {
                foreach ($value as $k => $v) {
                    DB::table('library_settings')->updateOrInsert(
                        ['setting_key' => $k],
                        ['setting_value' => (string)$v, 'updated_at' => now()]
                    );
                }
            } else {
                DB::table('library_settings')->updateOrInsert(
                    ['setting_key' => $key],
                    ['setting_value' => (string)$value, 'updated_at' => now()]
                );
            }
        }

        // Record Audit Log
        DB::table('audit_logs')->insert([
            'id' => 'LOG-' . Str::upper(Str::random(8)),
            'timestamp' => now(),
            'actor' => $actor,
            'role' => 'Administrator',
            'action' => 'Settings Updated',
            'resource_type' => 'SystemSettings',
            'resource_id' => 'GLOBAL_CONFIG',
            'details' => "Updated " . count($data) . " institutional library setting parameters.",
            'ip_address' => $request->ip() ?? '127.0.0.1'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Library settings successfully updated and persisted across system.'
        ]);
    }

    /**
     * GET /api/branches
     * Multi-library branches endpoint (Prompt 48).
     */
    public function getBranches()
    {
        $branches = DB::table('branches')->get();
        return response()->json($branches);
    }
}
