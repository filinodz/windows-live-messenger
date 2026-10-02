<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WlmFriendship extends Model
{
    protected $fillable = ['requester_id', 'addressee_id', 'status', 'is_favorite', 'accepted_at'];

    protected $casts = ['is_favorite' => 'boolean', 'accepted_at' => 'datetime'];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(WlmProfile::class, 'requester_id');
    }

    public function addressee(): BelongsTo
    {
        return $this->belongsTo(WlmProfile::class, 'addressee_id');
    }
}
