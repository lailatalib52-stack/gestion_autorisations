import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demandeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye, CheckCircle, XCircle, Filter, Download } from 'lucide-react';

const TYPE_LABELS = {
  conge_annuel: 'Congé Annuel', conge_maladie: 'Congé Maladie',
  autorisation_absence: "Autorisation d'Absence", sortie: 'Sortie',
  conge_sans_solde: 'Congé Sans Solde', autre: 'Autre',
};
const STATUT_LABEL = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' };

export default function DemandesManager() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ statut: 'en_attente', type: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [quickModal, setQuickModal] = useState(null); // { demande, action }
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    demandeService.list({ page: p, ...filters })
      .then(res => { setDemandes(res.data.data); setMeta(res.data); setPage(p); })
      .catch(err => toast.error(err.friendlyMessage || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filters]);

  const handleQuick = async () => {
    if (!quickModal) return;
    setSaving(true);
    try {
      await demandeService.traiter(quickModal.demande.id, {
        statut: quickModal.action,
        commentaire_manager: comment,
      });
      toast.success(`Demande ${quickModal.action === 'acceptee' ? 'acceptée' : 'refusée'} !`);
      setQuickModal(null);
      setComment('');
      load(page);
    } catch (err) {
      toast.error(err.friendlyMessage || 'Erreur');
    } finally { setActionLoading(null); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Demandes</h1>
          <p className="page-subtitle">
            {meta?.total || 0} demande(s) — {user.role === 'admin' ? 'Vue Administrateur' : 'Vue Manager'}
          </p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-secondary" onClick={() => demandeService.archiver().then(r => toast.success(r.data.message))}>
            Archiver anciennes
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={16} color="var(--gray-400)" />
        <select className="form-select" style={{ width: 'auto', minWidth: 155 }}
          value={filters.statut} onChange={e => setFilters(p => ({ ...p, statut: e.target.value }))}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="acceptee">Acceptée</option>
          <option value="refusee">Refusée</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 190 }}
          value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--primary)' }} />
          </div>
        ) : demandes.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={44} />
            <p>Aucune demande{filters.statut === 'en_attente' ? ' en attente' : ''}</p>
            <span>Toutes les demandes ont été traitées</span>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employé</th>
                    <th>Département</th>
                    <th>Type</th>
                    <th>Période</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Date Soumission</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gray-400)' }}>
                        #{String(d.id).padStart(4, '0')}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{d.employe?.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{d.employe?.email}</div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray-500)' }}>{d.employe?.departement || '—'}</td>
                      <td>
                        <span style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          {TYPE_LABELS[d.type]}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gray-600)' }}>
                        {d.date_debut ? format(parseISO(d.date_debut), 'd MMM', { locale: fr }) : ''} - {d.date_fin ? format(parseISO(d.date_fin), 'd MMM yyyy', { locale: fr }) : ''}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{d.duree} j</td>
                      <td><span className={`badge badge-${d.statut}`}>{STATUT_LABEL[d.statut]}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {d.created_at ? format(parseISO(d.created_at), 'd MMM yyyy', { locale: fr }) : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/demandes/${d.id}`} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                            <Eye size={15} />
                          </Link>
                          {d.statut === 'en_attente' && (
                            <>
                              <button className="btn btn-icon btn-sm" title="Accepter"
                                style={{ background: 'var(--success-bg)', color: 'var(--success)', border: 'none' }}
                                onClick={() => { setQuickModal({ demande: d, action: 'acceptee' }); setComment(''); }}>
                                <CheckCircle size={15} />
                              </button>
                              <button className="btn btn-icon btn-sm" title="Refuser"
                                style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }}
                                onClick={() => { setQuickModal({ demande: d, action: 'refusee' }); setComment(''); }}>
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && meta.last_page > 1 && (
              <div className="pagination" style={{ padding: '12px 0 4px' }}>
                <button disabled={page <= 1} onClick={() => load(page - 1)}>←</button>
                {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => load(p)}>{p}</button>
                ))}
                <button disabled={page >= meta.last_page} onClick={() => load(page + 1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick action modal */}
      {quickModal && (
        <div className="modal-overlay" onClick={() => setQuickModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {quickModal.action === 'acceptee' ? '✅ Accepter' : '❌ Refuser'} la demande
              </h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setQuickModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--gray-600)', marginBottom: 16, fontSize: 14 }}>
                Demande de <strong>{quickModal.demande.employe?.name}</strong> — {TYPE_LABELS[quickModal.demande.type]}
                <br />{quickModal.demande.date_debut} → {quickModal.demande.date_fin}
              </p>
              <div className="form-group">
                <label className="form-label">Commentaire (optionnel)</label>
                <textarea className="form-textarea" rows={2}
                  placeholder="Ajoutez un commentaire ou un avis..."
                  value={comment} onChange={e => setComment(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setQuickModal(null)}>Annuler</button>
              <button
                className={`btn ${quickModal.action === 'acceptee' ? 'btn-success' : 'btn-danger'}`}
                disabled={saving}
                onClick={handleQuick}
              >
                {saving ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
