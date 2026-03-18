<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Demande #{{ $demande->id }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 13px; color: #222; background: #fff; }
        .header { background: #1a3c5e; color: #fff; padding: 24px 32px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { font-size: 20px; font-weight: 700; letter-spacing: 1px; }
        .header .ref { font-size: 12px; opacity: 0.8; margin-top: 4px; }
        .logo { font-size: 28px; font-weight: 900; color: #f0c040; letter-spacing: 2px; }
        .badge { display: inline-block; padding: 5px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; }
        .badge-en_attente { background: #fff3cd; color: #856404; }
        .badge-acceptee { background: #d1e7dd; color: #0a5c36; }
        .badge-refusee { background: #f8d7da; color: #842029; }
        .section { margin: 24px 32px 0 32px; }
        .section-title { font-size: 13px; font-weight: 700; color: #1a3c5e; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #1a3c5e; padding-bottom: 4px; margin-bottom: 12px; }
        .grid { display: table; width: 100%; }
        .row { display: table-row; }
        .col { display: table-cell; width: 50%; padding: 5px 8px; vertical-align: top; }
        .label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 2px; }
        .value { font-size: 13px; color: #222; font-weight: 500; }
        .comment-box { background: #f8f9fa; border-left: 4px solid #1a3c5e; padding: 10px 14px; border-radius: 0 6px 6px 0; margin-top: 6px; font-style: italic; color: #444; }
        .comment-box.manager { border-left-color: #0a5c36; }
        .footer { margin-top: 40px; padding: 16px 32px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature-box { border: 1px solid #bbb; border-radius: 4px; padding: 10px 24px; text-align: center; min-width: 180px; }
        .signature-box .sig-label { font-size: 11px; color: #666; margin-bottom: 32px; }
        .watermark { text-align: center; color: #ccc; font-size: 11px; margin-top: 8px; }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 7px 10px; border: 1px solid #e0e0e0; }
        table.info tr:nth-child(even) td { background: #f5f7fa; }
        table.info td:first-child { font-weight: 600; color: #1a3c5e; width: 38%; }
    </style>
</head>
<body>

<div class="header">
    <div>
        <div class="logo">GA</div>
        <div style="font-size:11px; opacity:0.7; margin-top:2px;">Gestion des Autorisations</div>
    </div>
    <div style="text-align:right;">
        <h1>DEMANDE D'AUTORISATION</h1>
        <div class="ref">Réf : DA-{{ str_pad($demande->id, 5, '0', STR_PAD_LEFT) }} &nbsp;|&nbsp; Créée le {{ $demande->created_at->format('d/m/Y à H:i') }}</div>
    </div>
</div>

<!-- Statut -->
<div class="section" style="margin-top:20px;">
    <table style="width:100%;">
        <tr>
            <td style="width:60%;">
                <span style="font-size:12px; color:#666;">Statut de la demande :</span><br>
                @php
                    $labels = ['en_attente'=>'En attente','acceptee'=>'Acceptée','refusee'=>'Refusée'];
                @endphp
                <span class="badge badge-{{ $demande->statut }}">{{ $labels[$demande->statut] }}</span>
            </td>
            @if($demande->date_traitement)
            <td style="text-align:right;">
                <span style="font-size:11px; color:#666;">Date de traitement :</span><br>
                <strong>{{ $demande->date_traitement->format('d/m/Y à H:i') }}</strong>
            </td>
            @endif
        </tr>
    </table>
</div>

<!-- Informations Employé -->
<div class="section" style="margin-top:20px;">
    <div class="section-title">Informations de l'Employé</div>
    <table class="info">
        <tr><td>Nom complet</td><td>{{ $demande->employe->name }}</td></tr>
        <tr><td>Email</td><td>{{ $demande->employe->email }}</td></tr>
        <tr><td>Département</td><td>{{ $demande->employe->departement ?? '-' }}</td></tr>
        <tr><td>Poste</td><td>{{ $demande->employe->poste ?? '-' }}</td></tr>
        <tr><td>Téléphone</td><td>{{ $demande->employe->telephone ?? '-' }}</td></tr>
    </table>
</div>

<!-- Détails de la Demande -->
<div class="section" style="margin-top:20px;">
    <div class="section-title">Détails de la Demande</div>
    <table class="info">
        @php
            $types = [
                'conge_annuel' => 'Congé Annuel',
                'conge_maladie' => 'Congé Maladie',
                'autorisation_absence' => "Autorisation d'Absence",
                'sortie' => 'Autorisation de Sortie',
                'conge_sans_solde' => 'Congé Sans Solde',
                'autre' => 'Autre',
            ];
        @endphp
        <tr><td>Type de demande</td><td><strong>{{ $types[$demande->type] ?? $demande->type }}</strong></td></tr>
        <tr><td>Date de début</td><td>{{ $demande->date_debut->format('d/m/Y') }}</td></tr>
        <tr><td>Date de fin</td><td>{{ $demande->date_fin->format('d/m/Y') }}</td></tr>
        <tr><td>Durée</td><td>{{ $demande->duree }} jour(s)</td></tr>
        <tr><td>Motif</td><td>{{ $demande->motif }}</td></tr>
    </table>
</div>

<!-- Commentaires -->
@if($demande->commentaire_employe || $demande->commentaire_manager)
<div class="section" style="margin-top:20px;">
    <div class="section-title">Commentaires</div>
    @if($demande->commentaire_employe)
        <div style="margin-bottom:10px;">
            <div class="label">Commentaire de l'employé :</div>
            <div class="comment-box">{{ $demande->commentaire_employe }}</div>
        </div>
    @endif
    @if($demande->commentaire_manager)
        <div>
            <div class="label">Avis du manager ({{ $demande->manager->name ?? 'Manager' }}) :</div>
            <div class="comment-box manager">{{ $demande->commentaire_manager }}</div>
        </div>
    @endif
</div>
@endif

<!-- Signatures -->
<div class="footer">
    <div class="signature-box">
        <div class="sig-label">Signature de l'Employé</div>
        <div style="font-size:11px; color:#444;">{{ $demande->employe->name }}</div>
    </div>
    @if($demande->manager)
    <div class="signature-box">
        <div class="sig-label">Visa du Manager</div>
        <div style="font-size:11px; color:#444;">{{ $demande->manager->name }}</div>
    </div>
    @endif
    <div class="signature-box">
        <div class="sig-label">Cachet de la Société</div>
        <div style="font-size:11px; color:#ccc;">&nbsp;</div>
    </div>
</div>

<div class="watermark" style="margin: 16px 32px 0;">
    Document généré automatiquement le {{ now()->format('d/m/Y à H:i') }} — Gestion des Autorisations
</div>

</body>
</html>
