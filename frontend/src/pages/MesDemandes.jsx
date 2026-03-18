import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demandeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit2, Trash2, Search, Filter, Download } from 'lucide-react';

const TYPE_LABELS = {
  conge_annuel:'Congé Annuel', conge_maladie:'Congé Maladie',
  autorisation_absence:"Autorisation d'Absence", sortie:'Sortie',
  conge_sans_solde:'Congé Sans Solde', autre:'Autre',
};
const STATUT_LABEL = { en_attente:'En attente', acceptee:'Acceptée', refusee:'Refusée' };

export default function MesDemandes() {
  const { user } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ statut:'', type:'' });
  const [cancelId, setCancelId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

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

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      await demandeService.cancel(id);
      toast.success('Demande annulée.');
      setCancelId(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setCancelling(false); }
  };

  const handlePdf = (id) => {
    const token = localStorage.getItem('token');
    window.open(`/api/demandes/${id}/pdf?token=${token}`, '_blank');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mes Demandes</h1>
          <p className="page-subtitle">{meta?.total || 0} demande(s) au total</p>
        </div>
        {user?.role === 'employe' && (
          <Link to="/demandes/nouvelle" className="btn btn-primary">
            <Plus size={16} /> Nouvelle Demande
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{padding:'16px 20px',marginBottom:20,display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
        <Filter size={16} color="var(--gray-400)" />
        <select className="form-select" style={{width:'auto',minWidth:150}}
          value={filters.statut} onChange={e => setFilters(p=>({...p,statut:e.target.value}))}>
          <option value="">Tous les statuts</option>
          <option value="en_attente">En attente</option>
          <option value="acceptee">Acceptée</option>
          <option value="refusee">Refusée</option>
        </select>
        <select className="form-select" style={{width:'auto',minWidth:190}}
          value={filters.type} onChange={e => setFilters(p=>({...p,type:e.target.value}))}>
          <option value="">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {(filters.statut || filters.type) && (
          <button className="btn btn-secondary btn-sm" onClick={() => setFilters({statut:'',type:''})}>
            Effacer filtres
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:60}}>
            <span className="spinner" style={{width:32,height:32,borderWidth:3,color:'var(--primary)'}} />
          </div>
        ) : demandes.length === 0 ? (
          <div className="empty-state">
            <Search size={44} />
            <p>Aucune demande trouvée</p>
            {user?.role === 'employe' && (
              <Link to="/demandes/nouvelle" className="btn btn-primary" style={{marginTop:8}}>
                <Plus size={16} /> Créer une demande
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    {user?.role !== 'employe' && <th>Employé</th>}
                    <th>Type</th>
                    <th>Date Début</th>
                    <th>Date Fin</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Créée le</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map(d => (
                    <tr key={d.id}>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--gray-400)'}}>
                        #{String(d.id).padStart(4,'0')}
                      </td>
                      {user?.role !== 'employe' && (
                        <td style={{fontWeight:600}}>{d.employe?.name}</td>
                      )}
                      <td>
                        <span style={{
                          background:'var(--info-bg)',color:'var(--info)',
                          padding:'2px 8px',borderRadius:6,fontSize:12,fontWeight:600,
                        }}>
                          {TYPE_LABELS[d.type] || d.type}
                        </span>
                      </td>
                      <td style={{fontSize:13,fontFamily:'var(--font-mono)'}}>{d.date_debut}</td>
                      <td style={{fontSize:13,fontFamily:'var(--font-mono)'}}>{d.date_fin}</td>
                      <td style={{fontSize:13}}>{d.duree}j</td>
                      <td><span className={`badge badge-${d.statut}`}>{STATUT_LABEL[d.statut]}</span></td>
                      <td style={{fontSize:12,color:'var(--gray-400)'}}>
                        {new Date(d.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <Link to={`/demandes/${d.id}`} className="btn btn-ghost btn-icon btn-sm" title="Voir">
                            <Eye size={15} />
                          </Link>
                          {user?.role === 'employe' && d.statut === 'en_attente' && (
                            <Link to={`/demandes/${d.id}/modifier`} className="btn btn-ghost btn-icon btn-sm" title="Modifier">
                              <Edit2 size={15} />
                            </Link>
                          )}
                          <button className="btn btn-ghost btn-icon btn-sm" title="PDF" onClick={() => handlePdf(d.id)}>
                            <Download size={15} />
                          </button>
                          {user?.role === 'employe' && d.statut === 'en_attente' && (
                            <button className="btn btn-ghost btn-icon btn-sm" title="Annuler"
                              style={{color:'var(--danger)'}}
                              onClick={() => setCancelId(d.id)}>
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="pagination" style={{padding:'12px 0 4px'}}>
                <button disabled={page <= 1} onClick={() => load(page-1)}>←</button>
                {Array.from({length: meta.last_page}, (_,i) => i+1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => load(p)}>{p}</button>
                ))}
                <button disabled={page >= meta.last_page} onClick={() => load(page+1)}>→</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel confirm modal */}
      {cancelId && (
        <div className="modal-overlay" onClick={() => setCancelId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:420}}>
            <div className="modal-header">
              <h3 className="modal-title">Confirmer l'annulation</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCancelId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{color:'var(--gray-600)'}}>Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setCancelId(null)}>Non, garder</button>
              <button className="btn btn-danger" disabled={cancelling} onClick={() => handleCancel(cancelId)}>
                {cancelling ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : null}
                Oui, annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
