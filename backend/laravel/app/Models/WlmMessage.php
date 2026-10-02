<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WlmMessage extends Model
{
    protected $fillable = ['sender_id', 'recipient_id', 'content', 'kind', 'read_at'];

    protected $casts = ['read_at' => 'datetime'];

    public function toPublic(): array
    {
        return [
            'id' => $this->id,
            'sender_id' => $this->sender_id,
            'recipient_id' => $this->recipient_id,
            'content' => $this->content,
            'kind' => $this->kind,
            'read_at' => optional($this->read_at)->toIso8601String(),
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
