import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demandeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Eye, Filter, Download, Clock, Search } from 'lucide-react';

const TYPE_LABELS = {
  conge_annuel: 'Congé Annuel', 
  conge_maladie: 'Congé Maladie',
  autorisation_absence: "Autorisation d'Absence", 
  sortie: 'Sortie',
  conge_sans_solde: 'Congé Sans Solde', 
  autre: 'Autre',
};
const STATUT_LABEL = { en_attente: 'En attente', acceptee: 'Acceptée', refusee: 'Refusée' };

export default function HistoriqueManager() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ statut: '', type: '' });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const load = (p = 1) => {
    setLoading(true);
    demandeService.list({ page: p, ...filters })
      .then(res => { 
        setDemandes(res.data.data); 
        setMeta(res.data); 
        setPage(p); 
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, [filters]);

  const handlePdf = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/demandes/${id}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Historique des Demandes</h1>
          <p className="page-subtitle">
            {meta?.total || 0} demande(s) enregistrée(s)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={16} color="var(--gray-400)" />
        <select className="form-select" style={{ width: 'auto', minWidth: 155 }}
          value={filters.statut} onChange={e => setFilters(p => ({ ...p, statut: e.target.value }))}>
          <option value="">Tous les statuts</option>
          <option value="acceptee">Acceptée</option>
          <option value="refusee">Refusée</option>
          <option value="en_attente">En attente</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 190 }}
          value={filters.type} onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(filters.statut || filters.type) && (
            <button className="btn btn-ghost btn-sm" onClick={() => setFilters({statut:'', type:''})}>
                Effacer
            </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, color: 'var(--primary)' }} />
          </div>
        ) : demandes.length === 0 ? (
          <div className="empty-state">
            <Search size={44} />
            <p>Aucun historique trouvé</p>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employé</th>
                    <th>Type</th>
                    <th>Période</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Date Traitement</th>
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
                      <td>
                        <span style={{ background: 'var(--info-bg)', color: 'var(--info)', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          {TYPE_LABELS[d.type] || d.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--gray-600)' }}>
                        {d.date_debut} → {d.date_fin}
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>{d.duree}j</td>
                      <td><span className={`badge badge-${d.statut}`}>{STATUT_LABEL[d.statut]}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                        {d.date_traitement ? new Date(d.date_traitement).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Link to={`/demandes/${d.id}`} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                            <Eye size={15} />
                          </Link>
                          {d.statut === 'acceptee' && (
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handlePdf(d.id)} title="Télécharger PDF">
                                <Download size={15} />
                            </button>
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
    </div>
  );
}
