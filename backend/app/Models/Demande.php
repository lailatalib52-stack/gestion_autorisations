<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property \Carbon\Carbon $date_debut
 * @property \Carbon\Carbon $date_fin
 * @property \Carbon\Carbon $date_traitement
 * @property int $duree
 */
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

    protected $appends = ['duree', 'type_libelle'];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_fin' => 'datetime',
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

    public function scopeValideeManager($query)
    {
        return $query->where('statut', 'validee_manager');
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
        if (!$this->date_debut || !$this->date_fin) return 0;
        return $this->date_debut->diffInDays($this->date_fin) + 1;
    }

    public function isModifiable(): bool
    {
        return $this->statut === 'en_attente';
    }
}
