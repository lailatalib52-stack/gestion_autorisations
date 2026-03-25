<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DemandeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Gestion des Autorisations
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées (Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // Notifications (tous les rôles)
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/non-lues', [NotificationController::class, 'nonLues']);
        Route::put('/{id}/lue', [NotificationController::class, 'marquerLue']);
        Route::put('/toutes-lues', [NotificationController::class, 'marquerToutesLues']);
    });

    // Demandes
    Route::prefix('demandes')->group(function () {
        Route::get('/', [DemandeController::class, 'index']);
        Route::get('/statistiques', [DemandeController::class, 'statistiques']);
        Route::get('/{id}', [DemandeController::class, 'show']);
        Route::get('/{id}/pdf', [DemandeController::class, 'exportPdf']);

        // Employé: créer, modifier, annuler
        Route::post('/', [DemandeController::class, 'store']);
        Route::put('/{id}', [DemandeController::class, 'update']);
        Route::delete('/{id}', [DemandeController::class, 'cancel']);

        // Manager/Admin: traiter
        Route::put('/{id}/traiter', [DemandeController::class, 'traiter'])
            ->middleware('role:manager,admin');

        // Admin: archiver
        Route::post('/archiver', [DemandeController::class, 'archiver'])
            ->middleware('role:admin');
    });

    // Gestion Utilisateurs (Manager & Admin)
    Route::middleware('role:manager,admin')->prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/managers', [UserController::class, 'managers']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::put('/{id}', [UserController::class, 'update']);
        Route::delete('/{id}', [UserController::class, 'destroy']);
        Route::put('/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });

    // Managers list (accessible par employés pour sélection)
    Route::get('/managers', [UserController::class, 'managers']);
});
