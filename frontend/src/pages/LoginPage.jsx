import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Connexion réussie !');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a6e 50%, #1e4080 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background shapes */}
      <div style={{position:'absolute',top:'-80px',right:'-80px',width:'400px',height:'400px',borderRadius:'50%',background:'rgba(245,158,11,0.08)',pointerEvents:'none'}} />
      <div style={{position:'absolute',bottom:'-100px',left:'-60px',width:'350px',height:'350px',borderRadius:'50%',background:'rgba(30,64,128,0.3)',pointerEvents:'none'}} />

      <div style={{width:'100%',maxWidth:'420px',position:'relative',zIndex:1}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'36px'}}>
          <div style={{
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            width:64,height:64,borderRadius:18,
            background:'linear-gradient(135deg, #f59e0b, #f97316)',
            fontSize:28,fontWeight:900,color:'#fff',marginBottom:16,
            boxShadow:'0 8px 24px rgba(245,158,11,0.35)',
          }}>GA</div>
          <h1 style={{color:'#fff',fontSize:24,fontWeight:800,letterSpacing:'-0.5px'}}>
            Gestion des Autorisations
          </h1>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:14,marginTop:6}}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Card */}
        <div style={{background:'rgba(255,255,255,0.97)',borderRadius:20,padding:'32px 32px 28px',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:18}}>
            <div className="form-group">
              <label className="form-label">Adresse Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e => setForm(p => ({...p,email:e.target.value}))}
                required autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({...p,password:e.target.value}))}
                required
              />
            </div>

            {error && (
              <div style={{background:'var(--danger-bg)',color:'var(--danger)',padding:'10px 14px',borderRadius:'var(--radius)',fontSize:13,fontWeight:500}}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{marginTop:4,justifyContent:'center',width:'100%',fontSize:15}}
            >
              {loading ? <><span className="spinner" style={{borderColor:'rgba(255,255,255,0.4)',borderTopColor:'transparent'}} /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
