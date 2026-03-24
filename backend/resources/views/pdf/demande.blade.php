<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <title>Demande #{{ $demande->id }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px;
            color: #222;
            background: #fff;
            padding: 20px;
        }

        .header {
            background: #1a3c5e;
            color: #fff;
            padding: 15px 25px;
            margin-bottom: 10px;
            width: 100%;
        }

        .header table {
            width: 100%;
            border: none;
        }

        .header h1 {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #fff;
            margin: 0;
        }

        .header .ref {
            font-size: 10px;
            opacity: 0.9;
            margin-top: 2px;
            color: #fff;
        }

        .logo {
            font-size: 24px;
            font-weight: 900;
            color: #f0c040;
            letter-spacing: 2px;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 15px;
            font-weight: 700;
            font-size: 11px;
        }

        .badge-en_attente {
            background: #fff3cd;
            color: #856404;
        }

        .badge-acceptee {
            background: #d1e7dd;
            color: #0a5c36;
        }

        .badge-refusee {
            background: #f8d7da;
            color: #842029;
        }

        .section {
            margin: 15px 10px 0;
        }

        .section-title {
            font-size: 12px;
            font-weight: 700;
            color: #1a3c5e;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 2px solid #1a3c5e;
            padding-bottom: 3px;
            margin-bottom: 10px;
        }

        .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .value {
            font-size: 12px;
            color: #222;
            font-weight: 500;
        }

        .comment-box {
            background: #f8f9fa;
            border-left: 3px solid #1a3c5e;
            padding: 8px 12px;
            border-radius: 0 4px 4px 0;
            margin-top: 5px;
            font-style: italic;
            color: #444;
            font-size: 11px;
        }

        .comment-box.manager {
            border-left-color: #0a5c36;
        }

        .footer-table {
            margin-top: 30px;
            width: 100%;
            border-collapse: collapse;
        }

        .footer-table td {
            width: 33.33%;
            vertical-align: top;
            padding: 0 10px;
        }

        .signature-box {
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            text-align: center;
            height: 100px;
        }

        .signature-box .sig-label {
            font-size: 10px;
            font-weight: 700;
            color: #1a3c5e;
            text-transform: uppercase;
            margin-bottom: 45px;
            border-bottom: 1px solid #eee;
            padding-bottom: 3px;
        }

        .watermark {
            text-align: center;
            color: #999;
            font-size: 9px;
            margin-top: 15px;
        }

        table.info {
            width: 100%;
            border-collapse: collapse;
        }

        table.info td {
            padding: 5px 8px;
            border: 1px solid #e0e0e0;
            font-size: 11px;
        }

        table.info tr:nth-child(even) td {
            background: #f9fafb;
        }

        table.info td:first-child {
            font-weight: 600;
            color: #1a3c5e;
            width: 35%;
        }
    </style>
</head>

<body>

    <div class="header">
        <table cellpadding="0" cellspacing="0">
            <tr>
                <td style="vertical-align: middle;">
                    <div class="logo">GA</div>
                    <div style="font-size:10px; opacity:0.8; margin-top:2px;">Gestion des Autorisations</div>
                </td>
                <td style="text-align:right; vertical-align: middle;">
                    <h1>DEMANDE D'AUTORISATION</h1>
                    <div class="ref">Réf : DA-{{ str_pad($demande->id, 5, '0', STR_PAD_LEFT) }} &nbsp;|&nbsp; Créée le
                        {{ $demande->created_at->format('d/m/Y à H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Statut -->
    <div class="section" style="margin-top:10px;">
        <table style="width:100%;">
            <tr>
                <td style="width:50%;">
                    <span style="font-size:11px; color:#666;">Statut :</span> &nbsp;
                    @php
                        $labels = ['en_attente' => 'En attente', 'acceptee' => 'Acceptée', 'refusee' => 'Refusée'];
                    @endphp
                    <span class="badge badge-{{ $demande->statut }}">{{ $labels[$demande->statut] }}</span>
                </td>
                @if($demande->date_traitement)
                    <td style="text-align:right;">
                        <span style="font-size:10px; color:#666;">Traité le :</span>
                        <strong>{{ $demande->date_traitement->format('d/m/Y à H:i') }}</strong>
                    </td>
                @endif
            </tr>
        </table>
    </div>

    <!-- Informations Employé -->
    <div class="section">
        <div class="section-title">Informations de l'Employé</div>
        <table class="info">
            <tr>
                <td>Nom complet</td>
                <td>{{ $demande->employe->name }}</td>
            </tr>
            <tr>
                <td>Email</td>
                <td>{{ $demande->employe->email }}</td>
            </tr>
            <tr>
                <td>Département / Poste</td>
                <td>{{ $demande->employe->departement ?? '-' }} / {{ $demande->employe->poste ?? '-' }}</td>
            </tr>
            <tr>
                <td>Téléphone</td>
                <td>{{ $demande->employe->telephone ?? '-' }}</td>
            </tr>
        </table>
    </div>

    <!-- Détails de la Demande -->
    <div class="section">
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
            <tr>
                <td>Type de demande</td>
                <td><strong>{{ $types[$demande->type] ?? $demande->type }}</strong></td>
            </tr>
            <tr>
                <td>Période</td>
                <td>Du {{ $demande->date_debut->format('d/m/Y') }} au {{ $demande->date_fin->format('d/m/Y') }}
                    ({{ $demande->duree }} jour(s))</td>
            </tr>
            <tr>
                <td>Motif</td>
                <td>{{ $demande->motif }}</td>
            </tr>
        </table>
    </div>

    <!-- Commentaires -->
    @if($demande->commentaire_employe || $demande->commentaire_manager)
        <div class="section">
            <div class="section-title">Commentaires</div>
            @if($demande->commentaire_employe)
                <div style="margin-bottom:8px;">
                    <div class="label">Employé :</div>
                    <div class="comment-box">{{ $demande->commentaire_employe }}</div>
                </div>
            @endif
            @if($demande->commentaire_manager)
                <div>
                    <div class="label">Manager ({{ $demande->manager->name ?? 'Manager' }}) :</div>
                    <div class="comment-box manager">{{ $demande->commentaire_manager }}</div>
                </div>
            @endif
        </div>
    @endif

    <!-- Signatures & Cachet -->
    <table class="footer-table">
        <tr>
            <td>
                <div class="signature-box">
                    <div class="sig-label">Signature de l'Employé</div>
                    <div style="font-size:10px; color:#444;">{{ $demande->employe->name }}</div>
                </div>
            </td>
            <td>
                <div class="signature-box">
                    <div class="sig-label">Cachet de la Société</div>
                    <div style="font-size:10px; color:#ccc;">&nbsp;</div>
                </div>
            </td>
            <td>
                <div class="signature-box">
                    <div class="sig-label">Visa du Manager</div>
                    <div style="font-size:10px; color:#444;">{{ $demande->manager->name ?? '........................' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="watermark">
        Document généré le {{ now()->format('d/m/Y à H:i') }} — Gestion des Autorisations
    </div>

</body>

</html>