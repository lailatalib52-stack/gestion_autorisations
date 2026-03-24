import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { notifService } from '../services/api.js';
import toast from 'react-hot-toast';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

const TYPE_STYLES = {
  success: { bg:'var(--success-bg)', color:'var(--success)', icon:'✅' },
  error: { bg:'var(--danger-bg)', color:'var(--danger)', icon:'❌' },
  warning: { bg:'var(--warning-bg)', color:'var(--warning)', icon:'⚠️' },
  info: { bg:'var(--info-bg)', color:'var(--info)', icon:'ℹ️' },
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const load = (p = 1) => {
    setLoading(true);
    notifService.list({ page: p })
      .then(res => { setNotifs(res.data.data); setMeta(res.data); setPage(p); })
      .catch(() => toast.error('Erreur'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1); }, []);

  const marquerLue = async (id) => {
    await notifService.marquerLue(id);
    setNotifs(prev => prev.filter(n => n.id !== id));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  };

  const marquerToutes = async () => {
    await notifService.marquerToutesLues();
    setNotifs([]);
    toast.success('Toutes les notifications ont été supprimées.');
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  };

  const unread = notifs.filter(n => !n.lu).length;

  return (
    <div className="fade-in" style={{maxWidth:680}}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} non lue(s)` : 'Tout est lu'}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-secondary" onClick={marquerToutes}>
            <CheckCheck size={16} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {loading ? (
        <div style={{display:'flex',justifyContent:'center',padding:80}}>
          <span className="spinner" style={{width:36,height:36,borderWidth:3,color:'var(--primary)'}} />
        </div>
      ) : notifs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Bell size={48} />
            <p>Aucune notification</p>
            <span>Vous recevrez des notifications ici</span>
          </div>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {notifs.map(n => {
            const style = TYPE_STYLES[n.type] || TYPE_STYLES.info;
            return (
              <div key={n.id}
                className="card"
                style={{
                  padding:'16px 20px',
                  borderLeft:`4px solid ${style.color}`,
                  opacity: n.lu ? 0.7 : 1,
                  cursor: !n.lu ? 'pointer' : 'default',
                  transition:'opacity 0.2s',
                }}
                onClick={() => !n.lu && marquerLue(n.id)}
              >
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <span style={{fontSize:20,lineHeight:1}}>{style.icon}</span>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                        <span style={{fontWeight:700,fontSize:14,color:'var(--gray-900)'}}>{n.titre}</span>
                        {!n.lu && (
                          <span style={{width:7,height:7,borderRadius:'50%',background:'var(--primary)',display:'inline-block'}} />
                        )}
                      </div>
                      <p style={{fontSize:13,color:'var(--gray-600)',lineHeight:1.5}}>{n.message}</p>
                      <span style={{fontSize:11,color:'var(--gray-400)',marginTop:4,display:'block'}}>
                        {new Date(n.created_at).toLocaleDateString('fr-FR',{
                          day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                  {n.demande_id && (
                    <Link to={`/demandes/${n.demande_id}`}
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{flexShrink:0}}
                      title="Voir la demande"
                      onClick={e => e.stopPropagation()}>
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
          {meta && meta.last_page > 1 && (
            <div className="pagination" style={{marginTop:8}}>
              <button disabled={page<=1} onClick={()=>load(page-1)}>←</button>
              {Array.from({length:meta.last_page},(_,i)=>i+1).map(p=>(
                <button key={p} className={p===page?'active':''} onClick={()=>load(p)}>{p}</button>
              ))}
              <button disabled={page>=meta.last_page} onClick={()=>load(page+1)}>→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
