import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '7.css/dist/7.scoped.css';
import AvatarLarge from '../components/AvatarLarge';
import Background from '../components/Background';
import Dropdown from '../components/Dropdown';
import UnableToConnectModal from '../components/UnableToConnectModal';
import statusFrames from '../imports/statusFrames';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import bg from '/assets/background/background.jpg';
import defaultScene from '/assets/scenes/default_background.jpg';

const DEFAULT_SCENE = defaultScene;

const LoginPage = () => {
  const navigate = useNavigate();
  const { session, online } = useAuth();
  const [mode, setMode] = useState('login');
  const [status, setStatus] = useState('Available');
  const [email, setEmail] = useState(localStorage.getItem('rememberme') === 'true' ? localStorage.getItem('email') || '' : '');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberme') === 'true');
  const [signInAutomatically, setSignInAutomatically] = useState(localStorage.getItem('signinautomatically') === 'true');
  const [busy, setBusy] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  const showError = (message) => setModalMessage(message);

  const prepareLocalPreferences = () => {
    localStorage.setItem('email', email.trim().toLowerCase());
    localStorage.setItem('status', status);
    localStorage.setItem('rememberme', String(rememberMe));
    localStorage.setItem('signinautomatically', String(signInAutomatically));
    if (!localStorage.getItem('scene')) localStorage.setItem('scene', DEFAULT_SCENE);
    if (!localStorage.getItem('colorScheme')) localStorage.setItem('colorScheme', '#d8edf8');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return showError('Entrez une adresse e-mail valide, par exemple exemple@hotmail.fr.');
    if (password.length < 6) return showError('Le mot de passe doit contenir au moins 6 caractères.');
    if (mode === 'register' && displayName.trim().length < 2) return showError('Choisissez un nom d’affichage d’au moins 2 caractères.');

    setBusy(true);
    prepareLocalPreferences();

    if (!online) {
      localStorage.setItem('loggedin', 'true');
      localStorage.setItem('name', displayName.trim());
      localStorage.setItem('message', '');
      setBusy(false);
      navigate('/');
      return;
    }

    const result = mode === 'register'
      ? await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { display_name: displayName.trim(), status } },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

    setBusy(false);
    if (result.error) {
      const translations = {
        'Invalid login credentials': 'Adresse e-mail ou mot de passe incorrect.',
        'User already registered': 'Un compte existe déjà avec cette adresse.',
        'Email not confirmed': 'Confirmez d’abord votre adresse e-mail à l’aide du message reçu.',
      };
      showError(translations[result.error.message] || result.error.message);
      return;
    }

    if (mode === 'login' && result.data.session) {
      await supabase.from('profiles').update({ status, last_seen: new Date().toISOString() }).eq('id', result.data.session.user.id);
    }

    if (mode === 'register' && !result.data.session) {
      showError('Votre compte a été créé. Consultez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
      setMode('login');
    }
  };

  const options = [
    { value: 'Available', label: 'Disponible', image: statusFrames.onlineDot },
    { value: 'Busy', label: 'Occupé', image: statusFrames.busyDot },
    { value: 'Away', label: 'Absent', image: statusFrames.awayDot },
    { value: 'Offline', label: 'Apparaître hors ligne', image: statusFrames.offlineDot },
  ];

  return (
    <Background>
      <div className="bg-no-repeat bg-[length:100%_100px] h-screen flex flex-col items-center w-full pt-4" style={{ backgroundImage: `url(${bg})` }}>
        <form onSubmit={handleSubmit} className="flex flex-col items-center win7 font-sans text-base">
          <AvatarLarge image={rememberMe ? localStorage.getItem('picture') : undefined} />
          <p className="mt-4 text-xl text-[#1D2F7F]">{mode === 'login' ? 'Se connecter' : 'Créer un compte'}</p>
          <p className="mb-4 text-center">{mode === 'login' ? 'Entrez vos identifiants pour commencer à discuter' : 'Retrouvez vos amis sur Messenger'}</p>

          <fieldset className="w-[310px]">
            {mode === 'register' && (
              <input className="w-full mb-2" type="text" placeholder="Nom d’affichage" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            )}
            <input className="w-full placeholder:italic" type="email" placeholder="Exemple555@hotmail.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full mt-2 placeholder:italic" type="password" placeholder="Entrez votre mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />

            <div className="flex my-4 items-center">
              <p>Se connecter en tant que :</p>
              <Dropdown options={options} value={status} onChange={setStatus} showStatusDots />
            </div>

            <div className="mt-2">
              <input type="checkbox" id="rememberme" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              <label htmlFor="rememberme">Mémoriser mon adresse</label>
            </div>
            <div className="mt-2">
              <input type="checkbox" id="signinautomatically" checked={signInAutomatically} onChange={(e) => setSignInAutomatically(e.target.checked)} />
              <label htmlFor="signinautomatically">Me connecter automatiquement</label>
            </div>
          </fieldset>

          {!online && <p className="mt-3 text-amber-700">Mode démo local — configurez Supabase pour le mode en ligne.</p>}
          <div className="flex items-center mt-4">
            <button type="submit" disabled={busy}>{busy ? 'Connexion...' : mode === 'login' ? 'Se connecter' : 'S’inscrire'}</button>
          </div>
          <button type="button" className="link mt-3" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Vous n’avez pas encore de compte ? Inscrivez-vous' : 'Vous avez déjà un compte ? Connectez-vous'}
          </button>
        </form>
      </div>
      {modalMessage && <UnableToConnectModal setShowUnableToConnectModal={() => setModalMessage('')} errorMessage={modalMessage} />}
    </Background>
  );
};

export default LoginPage;
