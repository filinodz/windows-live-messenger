<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WlmProfile extends Model
{
    protected $fillable = [
        'email', 'password', 'display_name', 'personal_message', 'avatar_url', 'status', 'last_seen', 'api_token',
    ];

    protected $hidden = ['password', 'api_token'];

    protected $casts = ['last_seen' => 'datetime'];

    /** Forme publique consommée par le front (équivalente à l'ancien profil Supabase). */
    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'display_name' => $this->display_name,
            'personal_message' => $this->personal_message ?? '',
            'avatar_url' => $this->avatar_url,
            'status' => $this->status ?? 'Available',
            'last_seen' => optional($this->last_seen)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }
}
