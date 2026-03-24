import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { demandeService } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Edit2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import SignaturePad from '../components/shared/SignaturePad.jsx';

const TYPE_LABELS = {
  conge_annuel:'Congé Annuel', conge_maladie:'Congé Maladie',
  autorisation_absence:"Autorisation d'Absence", sortie:'Sortie',
  conge_sans_solde:'Congé Sans Solde', autre:'Autre',
};

export default function DetailDemande() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demande, setDemande] = useState(null);
  const [loading, setLoading] = useState(true);
  const [traitement, setTraitement] = useState({ statut:'', commentaire_manager:'' });
  const [saving, setSaving] = useState(false);
  const [signature, setSignature] = useState('');
  const [cachet, setCachet] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    demandeService.get(id)
      .then(res => setDemande(res.data.demande))
      .catch(() => { toast.error('Demande introuvable'); navigate('/demandes'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleTraiter = async (statut) => {
    setSaving(true);
    let finalCachet = cachet;
    if (cachet === 'GENERATE') {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1a3c5e'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(100, 100, 80, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(100, 100, 72, 0, Math.PI * 2); ctx.stroke();
      ctx.font = 'bold 16px Arial'; ctx.fillStyle = '#1a3c5e'; ctx.textAlign = 'center';
      ctx.fillText('APPROUVÉ', 100, 90);
      ctx.font = '12px Arial';
      ctx.fillText(new Date().toLocaleDateString(), 100, 115);
      ctx.fillText('DIRECTION GÉNÉRALE', 100, 135);
      finalCachet = canvas.toDataURL('image/png');
    }

    try {
      await demandeService.traiter(id, { 
        statut, 
        commentaire_manager: traitement.commentaire_manager,
        signature: signature,
        cachet: finalCachet
      });
      toast.success(`Demande ${statut === 'acceptee' ? 'acceptée' : 'refusée'} !`);
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Génération du PDF...', { id: 'pdf-loading' });
      const res = await demandeService.exportPdf(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `demande_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF téléchargé !', { id: 'pdf-loading' });
    } catch (err) {
      toast.error('Erreur lors du téléchargement du PDF', { id: 'pdf-loading' });
    }
  };

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',padding:80}}>
      <span className="spinner" style={{width:36,height:36,borderWidth:3,color:'var(--primary)'}} />
    </div>
  );
  if (!demande) return null;

  const canTraiter = (user.isManager || user.role === 'manager' || user.role === 'admin') && demande.statut === 'en_attente';

  const INFO = [
    { label:'Type de demande', value: TYPE_LABELS[demande.type] || demande.type },
    { label:'Date de début', value: demande.date_debut },
    { label:'Date de fin', value: demande.date_fin },
    { label:'Durée', value: `${demande.duree} jour(s)` },
    { label:'Motif', value: demande.motif },
    { label:'Créée le', value: new Date(demande.created_at).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) },
    demande.date_traitement && { label:'Traitée le', value: new Date(demande.date_traitement).toLocaleDateString('fr-FR', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) },
    { label:'Manager', value: demande.manager?.name || '—' },
  ].filter(Boolean);

  return (
    <div className="fade-in" style={{maxWidth:680}}>
      <div className="page-header">
        <div>
          <button className="btn btn-ghost btn-sm" style={{marginBottom:8}} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Retour
          </button>
          <h1 className="page-title">Demande #{String(demande.id).padStart(4,'0')}</h1>
          <p className="page-subtitle">Détail complet de la demande</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          {user.role === 'employe' && demande.statut === 'en_attente' && (
            <Link to={`/demandes/${id}/modifier`} className="btn btn-secondary">
              <Edit2 size={15} /> Modifier
            </Link>
          )}
          {demande.statut === 'acceptee' && (
            <button className="btn btn-secondary" onClick={handleDownloadPdf}>
              <Download size={15} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        padding:'14px 20px',borderRadius:12,marginBottom:20,
        background: demande.statut==='acceptee' ? 'var(--success-bg)' : demande.statut==='refusee' ? 'var(--danger-bg)' : 'var(--warning-bg)',
        color: demande.statut==='acceptee' ? 'var(--success)' : demande.statut==='refusee' ? 'var(--danger)' : 'var(--warning)',
        display:'flex',alignItems:'center',gap:10,fontWeight:600,fontSize:14,
      }}>
        {demande.statut==='acceptee' && <CheckCircle size={18} />}
        {demande.statut==='refusee' && <XCircle size={18} />}
        {demande.statut==='en_attente' && <span style={{fontSize:18}}>⏳</span>}
        {{en_attente:'En attente de traitement',acceptee:'Demande acceptée',refusee:'Demande refusée'}[demande.statut]}
      </div>

      {/* Info employé */}
      <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:700,color:'var(--gray-700)',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.5px',fontSize:12}}>
          Informations de l'employé
        </h3>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <div style={{
            width:48,height:48,borderRadius:12,
            background:'var(--info-bg)',display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:20,fontWeight:800,color:'var(--info)',
          }}>
            {demande.employe?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{fontWeight:700,fontSize:15}}>{demande.employe?.name}</div>
            <div style={{fontSize:13,color:'var(--gray-500)'}}>{demande.employe?.email}</div>
            {demande.employe?.departement && (
              <div style={{fontSize:12,color:'var(--gray-400)',marginTop:2}}>
                {demande.employe.departement} {demande.employe.poste ? `— ${demande.employe.poste}` : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
        <h3 style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.5px'}}>
          Détails de la demande
        </h3>
        <dl style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 24px'}}>
          {INFO.map((item, i) => (
            <div key={i} style={item.label==='Motif'?{gridColumn:'1/-1'}:{}}>
              <dt style={{fontSize:11,fontWeight:600,color:'var(--gray-400)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:2}}>
                {item.label}
              </dt>
              <dd style={{fontSize:14,color:'var(--gray-800)',fontWeight:500}}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Comments */}
      {(demande.commentaire_employe || demande.commentaire_manager) && (
        <div className="card" style={{padding:'20px 24px',marginBottom:16}}>
          <h3 style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.5px'}}>
            <MessageSquare size={14} style={{display:'inline',marginRight:6}} />
            Commentaires
          </h3>
          {demande.commentaire_employe && (
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--gray-400)',marginBottom:6}}>
                Commentaire de l'employé
              </div>
              <div style={{background:'var(--gray-50)',borderLeft:'3px solid var(--primary)',padding:'10px 14px',borderRadius:'0 8px 8px 0',fontSize:14,color:'var(--gray-700)',fontStyle:'italic'}}>
                {demande.commentaire_employe}
              </div>
            </div>
          )}
          {demande.commentaire_manager && (
            <div>
              <div style={{fontSize:12,fontWeight:600,color:'var(--gray-400)',marginBottom:6}}>
                Avis du manager ({demande.manager?.name})
              </div>
              <div style={{background:'var(--success-bg)',borderLeft:'3px solid var(--success)',padding:'10px 14px',borderRadius:'0 8px 8px 0',fontSize:14,color:'var(--gray-700)',fontStyle:'italic'}}>
                {demande.commentaire_manager}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Traitement form */}
      {(user.role === 'manager' || user.role === 'admin') && demande.statut === 'en_attente' && (
        <div className="card" style={{padding:'20px 24px'}}>
          <h3 style={{fontSize:12,fontWeight:700,color:'var(--gray-500)',marginBottom:16,textTransform:'uppercase',letterSpacing:'0.5px'}}>
            Traiter cette demande
          </h3>
          <div className="form-group" style={{marginBottom:16}}>
            <label className="form-label">Commentaire du manager (optionnel)</label>
            <textarea className="form-textarea" rows={2}
              placeholder="Ajoutez un commentaire ou un avis..."
              value={traitement.commentaire_manager}
              onChange={e => setTraitement(p => ({...p,commentaire_manager:e.target.value}))}
            />
          </div>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
              <label className="form-label" style={{fontSize:11}}>Signature du Manager</label>
              <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
              <button className="btn btn-success" disabled={saving || !signature || !cachet} onClick={() => handleTraiter('acceptee')} style={{width:'100%',justifyContent:'center',marginTop:8}}>
                {saving ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : <CheckCircle size={16} />}
                Accepter avec signature
              </button>
            </div>
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
              <label className="form-label" style={{fontSize:11}}>Cachet Société</label>
              <div style={{border:'2px dashed var(--gray-300)', borderRadius:8, height:150, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', flexDirection:'column', gap:10}}>
                 <button type="button" className="btn btn-secondary btn-sm" style={{fontSize:11}}
                   onClick={() => setCachet('GENERATE')}>
                   Générer le Cachet
                 </button>
                 {cachet && <div style={{fontSize:12, color:'var(--success)', fontWeight:600}}>Cachet prêt ✓</div>}
              </div>
              <button className="btn btn-danger" disabled={saving} onClick={() => handleTraiter('refusee')} style={{width:'100%',justifyContent:'center',marginTop:8}}>
                {saving ? <span className="spinner" style={{width:16,height:16,borderWidth:2}} /> : <XCircle size={16} />}
                Refuser la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
