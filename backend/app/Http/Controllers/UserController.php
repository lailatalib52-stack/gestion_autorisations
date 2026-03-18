<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Liste des utilisateurs (Admin)
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $users = $query->orderBy('name')->paginate(10);

        return response()->json($users);
    }

    /**
     * Créer un utilisateur
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:employe,manager,admin',
            'departement' => 'nullable|string|max:100',
            'poste' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|max:20',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'departement' => $request->departement,
            'poste' => $request->poste,
            'telephone' => $request->telephone,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Utilisateur créé avec succès.',
            'user' => $user,
        ], 201);
    }

    /**
     * Détail utilisateur
     */
    public function show($id)
    {
        $user = User::withCount([
            'demandes',
            'demandes as demandes_en_attente_count' => fn($q) => $q->where('statut', 'en_attente'),
            'demandes as demandes_acceptees_count' => fn($q) => $q->where('statut', 'acceptee'),
            'demandes as demandes_refusees_count' => fn($q) => $q->where('statut', 'refusee'),
        ])->findOrFail($id);

        return response()->json(['user' => $user]);
    }

    /**
     * Modifier un utilisateur
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'role' => 'sometimes|in:employe,manager,admin',
            'departement' => 'nullable|string|max:100',
            'poste' => 'nullable|string|max:100',
            'telephone' => 'nullable|string|max:20',
            'is_active' => 'sometimes|boolean',
            'password' => 'nullable|string|min:6',
        ]);

        $data = $request->except('password');
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return response()->json([
            'message' => 'Utilisateur mis à jour.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->demandes()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer : cet utilisateur a des demandes.',
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }

    /**
     * Activer/Désactiver
     */
    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        $user->is_active = !$user->is_active;
        $user->save();

        $status = $user->is_active ? 'activé' : 'désactivé';

        return response()->json([
            'message' => "Compte {$status} avec succès.",
            'user' => $user,
        ]);
    }

    /**
     * Liste des managers (pour assignation)
     */
    public function managers()
    {
        $managers = User::where('role', 'manager')
            ->where('is_active', true)
            ->select('id', 'name', 'email', 'departement')
            ->get();

        return response()->json(['managers' => $managers]);
    }
}
