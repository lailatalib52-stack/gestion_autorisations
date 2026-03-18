<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Demande extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'manager_id',
        'type',
        'date_debut',
        'date_fin',
        'motif',
        'statut',
        'commentaire_employe',
        'commentaire_manager',
        'date_traitement',
        'is_archived',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_traitement' => 'datetime',
        'is_archived' => 'boolean',
    ];

    public static $types = [
        'conge_annuel' => 'Congé Annuel',
        'conge_maladie' => 'Congé Maladie',
        'autorisation_absence' => 'Autorisation d\'Absence',
        'sortie' => 'Autorisation de Sortie',
        'conge_sans_solde' => 'Congé Sans Solde',
        'autre' => 'Autre',
    ];

    // Relations
    public function employe()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    // Scopes
    public function scopeEnAttente($query)
    {
        return $query->where('statut', 'en_attente');
    }

    public function scopeAcceptees($query)
    {
        return $query->where('statut', 'acceptee');
    }

    public function scopeRefusees($query)
    {
        return $query->where('statut', 'refusee');
    }

    public function scopeNonArchivees($query)
    {
        return $query->where('is_archived', false);
    }

    // Helpers
    public function getTypeLibelleAttribute(): string
    {
        return self::$types[$this->type] ?? $this->type;
    }

    public function getDureeAttribute(): int
    {
        return $this->date_debut->diffInDays($this->date_fin) + 1;
    }

    public function isModifiable(): bool
    {
        return $this->statut === 'en_attente';
    }
}
