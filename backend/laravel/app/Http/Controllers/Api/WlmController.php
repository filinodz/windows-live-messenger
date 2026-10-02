<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WlmFriendship;
use App\Models\WlmMessage;
use App\Models\WlmProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class WlmController extends Controller
{
    /* ============================ Authentification ============================ */

    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'display_name' => ['required', 'string', 'min:2', 'max:50'],
            'status' => ['nullable', 'in:Available,Busy,Away,Offline'],
        ]);
        $email = strtolower(trim($data['email']));
        if (WlmProfile::where('email', $email)->exists()) {
            return response()->json(['error' => 'Un compte existe déjà avec cette adresse.'], 422);
        }
        $profile = WlmProfile::create([
            'email' => $email,
            'password' => Hash::make($data['password']),
            'display_name' => trim($data['display_name']),
            'status' => $data['status'] ?? 'Available',
            'last_seen' => now(),
            'api_token' => Str::random(60),
        ]);

        return response()->json(['token' => $profile->api_token, 'profile' => $profile->toPublic()]);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'status' => ['nullable', 'in:Available,Busy,Away,Offline'],
        ]);
        $profile = WlmProfile::where('email', strtolower(trim($data['email'])))->first();
        if (! $profile || ! Hash::check($data['password'], $profile->password)) {
            return response()->json(['error' => 'Adresse e-mail ou mot de passe incorrect.'], 401);
        }
        $profile->update([
            'api_token' => Str::random(60),
            'status' => $data['status'] ?? 'Available',
            'last_seen' => now(),
        ]);

        return response()->json(['token' => $profile->api_token, 'profile' => $profile->toPublic()]);
    }

    public function logout(Request $request)
    {
        $me = $this->auth($request);
        $me->update(['status' => 'Offline', 'last_seen' => now(), 'api_token' => null]);

        return response()->json(['ok' => true]);
    }

    public function me(Request $request)
    {
        $me = $this->auth($request);
        $me->update(['last_seen' => now()]); // heartbeat implicite
        return response()->json(['profile' => $me->toPublic()]);
    }

    public function updateProfile(Request $request)
    {
        $me = $this->auth($request);
        $data = $request->validate([
            'display_name' => ['nullable', 'string', 'min:2', 'max:50'],
            'personal_message' => ['nullable', 'string', 'max:160'],
            'avatar_url' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'in:Available,Busy,Away,Offline'],
        ]);
        $me->fill(array_filter($data, fn ($v) => $v !== null));
        $me->last_seen = now();
        $me->save();

        return response()->json(['profile' => $me->toPublic()]);
    }

    /* ============================== Contacts ================================= */

    public function contacts(Request $request)
    {
        $me = $this->auth($request);
        $rows = WlmFriendship::with(['requester', 'addressee'])
            ->where('status', 'accepted')
            ->where(fn ($q) => $q->where('requester_id', $me->id)->orWhere('addressee_id', $me->id))
            ->get();

        $contacts = $rows->map(function ($f) use ($me) {
            $other = $f->requester_id === $me->id ? $f->addressee : $f->requester;
            return ['id' => $f->id, 'is_favorite' => $f->is_favorite, 'contact' => $other->toPublic()];
        })->values();

        return response()->json(['contacts' => $contacts]);
    }

    public function pending(Request $request)
    {
        $me = $this->auth($request);
        $rows = WlmFriendship::with('requester')
            ->where('addressee_id', $me->id)->where('status', 'pending')->get();

        return response()->json(['invitations' => $rows->map(fn ($f) => [
            'id' => $f->id, 'requester' => $f->requester->toPublic(),
        ])->values()]);
    }

    public function invite(Request $request)
    {
        $me = $this->auth($request);
        $email = strtolower(trim($request->input('email', '')));
        $target = WlmProfile::where('email', $email)->first();
        if (! $target) {
            return response()->json(['error' => 'Aucun compte ne correspond à cette adresse.'], 404);
        }
        if ($target->id === $me->id) {
            return response()->json(['error' => 'Vous ne pouvez pas vous ajouter vous-même.'], 422);
        }
        $exists = WlmFriendship::where(function ($q) use ($me, $target) {
            $q->where('requester_id', $me->id)->where('addressee_id', $target->id);
        })->orWhere(function ($q) use ($me, $target) {
            $q->where('requester_id', $target->id)->where('addressee_id', $me->id);
        })->exists();
        if ($exists) {
            return response()->json(['error' => 'Une invitation ou un contact existe déjà.'], 422);
        }
        WlmFriendship::create(['requester_id' => $me->id, 'addressee_id' => $target->id, 'status' => 'pending']);

        return response()->json(['target' => ['id' => $target->id, 'display_name' => $target->display_name]]);
    }

    public function answer(Request $request, WlmFriendship $friendship)
    {
        $me = $this->auth($request);
        abort_unless($friendship->addressee_id === $me->id, 403);
        if ($request->boolean('accept')) {
            $friendship->update(['status' => 'accepted', 'accepted_at' => now()]);
        } else {
            $friendship->delete();
        }

        return response()->json(['ok' => true]);
    }

    public function contact(Request $request, WlmProfile $profile)
    {
        $this->auth($request);
        return response()->json(['contact' => $profile->toPublic()]);
    }

    /* ============================== Messages ================================= */

    public function messages(Request $request, WlmProfile $profile)
    {
        $me = $this->auth($request);
        $me->update(['last_seen' => now()]);
        $since = (int) $request->query('since', 0);
        $rows = WlmMessage::whereIn('sender_id', [$me->id, $profile->id])
            ->whereIn('recipient_id', [$me->id, $profile->id])
            ->when($since > 0, fn ($q) => $q->where('id', '>', $since))
            ->orderBy('created_at')->orderBy('id')
            ->limit(500)->get();

        return response()->json(['messages' => $rows->map->toPublic()->values()]);
    }

    public function send(Request $request)
    {
        $me = $this->auth($request);
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:wlm_profiles,id'],
            'content' => ['required', 'string', 'min:1', 'max:4000'],
            'kind' => ['nullable', 'in:text,nudge'],
        ]);
        $msg = WlmMessage::create([
            'sender_id' => $me->id,
            'recipient_id' => $data['recipient_id'],
            'content' => $data['content'],
            'kind' => $data['kind'] ?? 'text',
        ]);

        return response()->json(['message' => $msg->toPublic()]);
    }

    /* ============================== Helpers ================================== */

    private function auth(Request $request): WlmProfile
    {
        $token = $request->bearerToken() ?: $request->query('token');
        $profile = $token ? WlmProfile::where('api_token', $token)->first() : null;
        abort_unless($profile, 401, 'Session expirée, reconnectez-vous.');

        return $profile;
    }
}
