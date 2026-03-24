<?php

namespace App\Http\Controllers;

use App\Models\Demande;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class DemandeController extends Controller
{
    /**
     * Liste des demandes (filtrée par rôle)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Demande::with(['employe:id,name,email,departement,poste', 'manager:id,name,email'])
            ->nonArchivees();

        if ($user->isEmploye()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isManager()) {
            $query->where('manager_id', $user->id);
        }
        // Admin voit tout

        // Filtres
        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('date_debut')) {
            $query->whereDate('date_debut', '>=', $request->date_debut);
        }
        if ($request->filled('date_fin')) {
            $query->whereDate('date_fin', '<=', $request->date_fin);
        }
        if ($request->filled('user_id') && $user->isAdmin()) {
            $query->where('user_id', $request->user_id);
        }

        $demandes = $query->orderBy('created_at', 'desc')->paginate(10);

        return response()->json($demandes);
    }

    /**
     * Créer une demande
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'type' => 'required|in:conge_annuel,conge_maladie,autorisation_absence,sortie,conge_sans_solde,autre',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after_or_equal:date_debut',
            'motif' => 'required|string|max:1000',
            'commentaire_employe' => 'nullable|string|max:500',
            'manager_id' => 'nullable|exists:users,id',
        ]);

        // Trouver un manager si non spécifié
        $managerId = $request->manager_id;
        if (!$managerId) {
            $manager = User::where('role', 'manager')->where('is_active', true)->first();
            $managerId = $manager ? $manager->id : null;
        }

        $demande = Demande::create([
            'user_id' => $user->id,
            'manager_id' => $managerId,
            'type' => $request->type,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'motif' => $request->motif,
            'commentaire_employe' => $request->commentaire_employe,
            'statut' => 'en_attente',
        ]);

        // Notification au manager
        if ($managerId) {
            Notification::create([
                'user_id' => $managerId,
                'titre' => 'Nouvelle demande reçue',
                'message' => "{$user->name} a soumis une demande de type " . Demande::$types[$request->type],
                'type' => 'info',
                'demande_id' => $demande->id,
            ]);
        }

        // Notification aux administrateurs
        $admins = User::where('role', 'admin')->where('is_active', true)->get();
        foreach ($admins as $admin) {
            if ($admin->id !== $managerId) { // Éviter les doublons si l'admin est le manager
                Notification::create([
                    'user_id' => $admin->id,
                    'titre' => 'Nouvelle demande (Admin)',
                    'message' => "Une nouvelle demande de {$user->name} a été créée.",
                    'type' => 'info',
                    'demande_id' => $demande->id,
                ]);
            }
        }

        return response()->json([
            'message' => 'Demande créée avec succès.',
            'demande' => $demande->load(['employe', 'manager']),
        ], 201);
    }

    /**
     * Détail d'une demande
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $demande = Demande::with(['employe', 'manager'])->findOrFail($id);

        // Vérification des accès
        if ($user->isEmploye() && $demande->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($user->isManager() && $demande->manager_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json(['demande' => $demande]);
    }

    /**
     * Modifier une demande (employé, avant validation)
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $demande = Demande::findOrFail($id);

        if ($demande->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (!$demande->isModifiable()) {
            return response()->json(['message' => 'Cette demande ne peut plus être modifiée.'], 422);
        }

        $request->validate([
            'type' => 'sometimes|in:conge_annuel,conge_maladie,autorisation_absence,sortie,conge_sans_solde,autre',
            'date_debut' => 'sometimes|date|after_or_equal:today',
            'date_fin' => 'sometimes|date|after_or_equal:date_debut',
            'motif' => 'sometimes|string|max:1000',
            'commentaire_employe' => 'nullable|string|max:500',
        ]);

        $demande->update($request->only([
            'type',
            'date_debut',
            'date_fin',
            'motif',
            'commentaire_employe'
        ]));

        return response()->json([
            'message' => 'Demande mise à jour.',
            'demande' => $demande->fresh(['employe', 'manager']),
        ]);
    }

    /**
     * Annuler une demande (employé)
     */
    public function cancel(Request $request, $id)
    {
        $user = $request->user();
        $demande = Demande::findOrFail($id);

        if ($demande->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (!$demande->isModifiable()) {
            return response()->json(['message' => 'Cette demande ne peut plus être annulée.'], 422);
        }

        $demande->delete();

        return response()->json(['message' => 'Demande annulée avec succès.']);
    }

    /**
     * Traiter une demande (manager)
     */
    public function traiter(Request $request, $id)
    {
        $user = $request->user();
        $demande = Demande::with('employe')->findOrFail($id);

        if (!$user->isManager() && !$user->isAdmin()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($user->isManager() && $demande->manager_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $request->validate([
            'statut' => 'required|in:acceptee,refusee',
            'commentaire_manager' => 'nullable|string|max:500',
        ]);

        $demande->update([
            'statut' => $request->statut,
            'commentaire_manager' => $request->commentaire_manager,
            'date_traitement' => now(),
        ]);

        // Notification à l'employé
        $statutLabel = $request->statut === 'acceptee' ? '✅ Acceptée' : '❌ Refusée';
        Notification::create([
            'user_id' => $demande->user_id,
            'titre' => "Demande {$statutLabel}",
            'message' => "Votre demande de " . Demande::$types[$demande->type] . " a été {$request->statut}.",
            'type' => $request->statut === 'acceptee' ? 'success' : 'error',
            'demande_id' => $demande->id,
        ]);

        return response()->json([
            'message' => "Demande {$request->statut} avec succès.",
            'demande' => $demande->fresh(['employe', 'manager']),
        ]);
    }

    /**
     * Statistiques dashboard
     */
    public function statistiques(Request $request)
    {
        $user = $request->user();

        if ($user->isEmploye()) {
            $base = Demande::where('user_id', $user->id);
        } elseif ($user->isManager()) {
            $base = Demande::where('manager_id', $user->id);
        } else {
            $base = Demande::query();
        }

        $stats = [
            'total' => (clone $base)->count(),
            'en_attente' => (clone $base)->where('statut', 'en_attente')->count(),
            'acceptees' => (clone $base)->where('statut', 'acceptee')->count(),
            'refusees' => (clone $base)->where('statut', 'refusee')->count(),
        ];

        // Répartition par type
        $parType = (clone $base)
            ->selectRaw('type, count(*) as total')
            ->groupBy('type')
            ->get()
            ->map(fn($item) => [
                'type' => $item->type,
                'libelle' => Demande::$types[$item->type] ?? $item->type,
                'total' => $item->total,
            ]);

        // Demandes récentes
        $recentes = (clone $base)
            ->with(['employe:id,name', 'manager:id,name'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        return response()->json([
            'stats' => $stats,
            'par_type' => $parType,
            'recentes' => $recentes,
        ]);
    }

    /**
     * Exporter en PDF
     */
    public function exportPdf(Request $request, $id)
    {
        $user = $request->user();
        $demande = Demande::with(['employe', 'manager'])->findOrFail($id);

        if ($user->isEmploye() && $demande->user_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $pdf = Pdf::loadView('pdf.demande', ['demande' => $demande]);
        $filename = "demande_{$demande->id}_{$demande->employe->name}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Archiver les anciennes demandes (Admin)
     */
    public function archiver(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $count = Demande::where('statut', '!=', 'en_attente')
            ->where('date_fin', '<', now()->subMonths(6))
            ->where('is_archived', false)
            ->update(['is_archived' => true]);

        return response()->json([
            'message' => "{$count} demandes archivées avec succès.",
        ]);
    }
}
