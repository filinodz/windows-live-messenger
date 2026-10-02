<?php

// Windows Live Messenger — backend MySQL. Auth par token bearer.
// À coller dans routes/api.php de votre projet Laravel (préfixe final : /api/wlm).

use Illuminate\Support\Facades\Route;

Route::prefix('wlm')->group(function () {
    $c = \App\Http\Controllers\Api\WlmController::class;
    Route::post('/register', [$c, 'register']);
    Route::post('/login', [$c, 'login']);
    Route::post('/logout', [$c, 'logout']);
    Route::get('/me', [$c, 'me']);
    Route::put('/profile', [$c, 'updateProfile']);
    Route::get('/contacts', [$c, 'contacts']);
    Route::get('/pending', [$c, 'pending']);
    Route::post('/invite', [$c, 'invite']);
    Route::post('/friendship/{friendship}/answer', [$c, 'answer']);
    Route::get('/profile/{profile}', [$c, 'contact']);
    Route::get('/messages/{profile}', [$c, 'messages']);
    Route::post('/messages', [$c, 'send']);
});
