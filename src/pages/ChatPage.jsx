import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AvatarLarge from '../components/AvatarLarge';
import EmoticonSelector from '../components/EmoticonSelector';
import WinkSelector from '../components/WinkSelector';
import EmoticonContext from '../contexts/EmoticonContext';
import contactsData from '../data/contacts.json';
import sounds from '../imports/sounds';
import { replaceEmoticons } from '../helpers/replaceEmoticons';
import { getOpenAIResponse } from '../utils/openai';
import { useAuth } from '../contexts/AuthContext';
import { createTypingChannel, getContact, getMessages, sendMessage, subscribeToMessages } from '../services/messenger';
import { supabase } from '../lib/supabase';
import navbarBackground from '/assets/background/chat_navbar_background.png';
import contactChatIcon from '/assets/chat/contact_chat_icon.png';
import showmenu from '/assets/contacts/1489.png';
import arrowWhite from '/assets/general/arrow_white.png';
import arrow from '/assets/general/arrow.png';
import divider from '/assets/general/divider.png';
import bg from '/assets/background/background.jpg';
import sendNudge from '/assets/chat/send_nudge.png';
import changeFont from '/assets/chat/change_font.png';
import changeBackground from '/assets/chat/select_background.png';
import messageDot from '/assets/chat/message_dot.png';
import chatIconsBackground from '/assets/background/chat_icons_background.png';
import chatPointBackground from '/assets/background/chat_background_point.png';
import chatIconsSeparator from '/assets/background/chat_icons_separator.png';
import infoIcon from '/assets/general/info.png';

const NUDGE_TEXT = 'Vous venez d’envoyer un wizz.';
const statusLabels = { online: 'disponible', available: 'disponible', busy: 'occupé', away: 'absent', offline: 'hors ligne' };

const ChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: authUser, online } = useAuth();
  const [contact, setContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [contactTyping, setContactTyping] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWindowed, setIsWindowed] = useState(false);
  const { selectedEmoticon, setSelectedEmoticon } = useContext(EmoticonContext);
  const messageContainerRef = useRef(null);
  const typingChannelRef = useRef(null);
  const typingTimerRef = useRef(null);
  const userName = localStorage.getItem('name') || localStorage.getItem('email');

  const appendUnique = (message) => setMessages((current) => {
    if (message.id && current.some((item) => item.id === message.id)) return current;
    return [...current, message];
  });

  useEffect(() => {
    if (selectedEmoticon) {
      setInput((current) => current + selectedEmoticon);
      setSelectedEmoticon(null);
    }
  }, [selectedEmoticon, setSelectedEmoticon]);

  useEffect(() => {
    let messageChannel;
    let typingChannel;
    const load = async () => {
      setLoading(true);
      setError('');
      setContact(null);
      setMessages([]);
      setContactTyping(false);
      try {
        if (online) {
          const [nextContact, nextMessages] = await Promise.all([getContact(id), getMessages(authUser.id, id)]);
          setContact(nextContact);
          setMessages(nextMessages);
          messageChannel = subscribeToMessages(authUser.id, id, (message) => {
            appendUnique(message);
            if (message.role === 'assistant' && message.kind === 'nudge') {
              new Audio(sounds.nudge).play().catch(() => {});
              setShaking(true);
              setTimeout(() => setShaking(false), 500);
            }
          });
          typingChannel = createTypingChannel(authUser.id, id, setContactTyping);
          typingChannelRef.current = typingChannel;
        } else {
          const demoContact = contactsData.find((item) => item.id === Number(id));
          setContact(demoContact);
          const saved = localStorage.getItem(`chatMessages_${id}`);
          setMessages(saved ? JSON.parse(saved) : []);
        }
      } catch (loadError) {
        console.error('Erreur de chargement de la conversation :', loadError);
        setError(
          loadError?.code === 'PGRST116'
            ? 'Ce contact n’existe plus ou n’est plus accessible.'
            : 'Cette conversation est momentanément indisponible. Réessayez dans quelques instants.',
        );
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
      clearTimeout(typingTimerRef.current);
    };
  }, [id, online, authUser?.id]);

  useEffect(() => {
    if (!online && !loading) localStorage.setItem(`chatMessages_${id}`, JSON.stringify(messages));
    requestAnimationFrame(() => {
      if (messageContainerRef.current) messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    });
  }, [messages, id, online, loading]);

  const broadcastTyping = (typing) => {
    if (!online || !typingChannelRef.current) return;
    typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: authUser.id, typing } });
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
    broadcastTyping(true);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => broadcastTyping(false), 1200);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    broadcastTyping(false);
    try {
      if (online) {
        const sent = await sendMessage({ senderId: authUser.id, recipientId: id, content });
        appendUnique({ ...sent, role: 'user' });
      } else {
        const next = [...messages, { id: crypto.randomUUID(), role: 'user', content, created_at: new Date().toISOString() }];
        setMessages(next);
        setContactTyping(true);
        setTimeout(async () => {
          const reply = await getOpenAIResponse(next, import.meta.env.VITE_OPENAI_API_KEY);
          setContactTyping(false);
          appendUnique({ id: crypto.randomUUID(), role: 'assistant', content: reply, created_at: new Date().toISOString() });
        }, 1000);
      }
    } catch (sendError) {
      console.error(sendError);
      setError('Le message n’a pas pu être envoyé.');
      setInput(content);
    }
  };

  const handleNudge = async () => {
    new Audio(sounds.nudge).play().catch(() => {});
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    try {
      if (online) {
        const sent = await sendMessage({ senderId: authUser.id, recipientId: id, content: NUDGE_TEXT, kind: 'nudge' });
        appendUnique({ ...sent, role: 'user' });
      } else {
        appendUnique({ id: crypto.randomUUID(), role: 'user', content: NUDGE_TEXT, kind: 'nudge', created_at: new Date().toISOString() });
      }
    } catch {
      setError('Le wizz n’a pas pu être envoyé.');
    }
  };

  const handleMinimize = () => {
    navigate('/');
  };

  const handleClose = () => {
    sessionStorage.removeItem('wlm-minimized-chat');
    navigate('/');
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Ouverture de la conversation...</div>;
  if (!contact) return (
    <div className="h-screen flex flex-col gap-3 items-center justify-center win7">
      <p>{error || 'Contact introuvable.'}</p>
      <button type="button" onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  );
  const lastReceived = [...messages].reverse().find((message) => message.role === 'assistant');

  const toolbarActions = ['Photos', 'Fichiers', 'Vidéo', 'Appeler', 'Jeux', 'Activités', 'Inviter', 'Bloquer'];

  return (
    <div className="wlm-chat-desktop">
    <div className={`wlm-chat-frame bg-no-repeat bg-[length:100%_100px] h-screen ${isWindowed ? 'wlm-chat-windowed' : ''} ${shaking ? 'nudge' : ''}`} style={{ backgroundImage: `url(${bg})` }}>
      <div className="flex flex-col w-full font-sans text-base h-full">
        <div className="wlm-chat-titlebar flex items-center justify-between w-full h-[25px] pl-2 gap-2">
          <div className="flex items-center min-w-0 gap-2">
            <img src={contactChatIcon} alt="" />
            <p className="flex gap-1 truncate" dangerouslySetInnerHTML={{ __html: replaceEmoticons(contact.name) }} />
            <p className="truncate">&lt;{contact.email}&gt;</p>
          </div>
          <div className="wlm-caption-controls">
            <button type="button" title="Réduire" aria-label="Réduire la discussion" onClick={handleMinimize}>−</button>
            <button type="button" title={isWindowed ? 'Agrandir' : 'Restaurer'} aria-label={isWindowed ? 'Agrandir la discussion' : 'Restaurer la taille de la discussion'} onClick={() => setIsWindowed((value) => !value)}>{isWindowed ? '□' : '❐'}</button>
            <button type="button" className="wlm-close-button" title="Fermer" aria-label="Fermer la discussion" onClick={handleClose}>×</button>
          </div>
        </div>
        <div className="flex items-center justify-between h-[31.4px] bg-no-repeat shadow-lg" style={{ backgroundImage: `url(${navbarBackground})` }}>
          <div className="wlm-chat-actions flex items-center text-white">
            {toolbarActions.map((action) => (
              <div key={action} className="wlm-chat-action aerobutton cursor-pointer" title={action}>
                <span>{action}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1 items-center aerobutton p-2 h-6"><div className="w-5"><img src={showmenu} alt="" /></div><img src={arrowWhite} alt="" /></div>
        </div>

        <div className="relative h-full bg-no-repeat bg-bottom bg-[length:100%_400px] bg-gradient-to-t via-white" style={{ backgroundImage: 'linear-gradient(to top, #d8edf8, white, transparent)' }}>
          <div className="px-4 pt-4 grid grid-cols-[170px__1fr] h-full">
            <div className="h-full flex flex-col items-center justify-between">
              <AvatarLarge image={contact.image} status={contact.status} />
              <div><AvatarLarge image={localStorage.getItem('picture')} /><div className="h-10" /></div>
            </div>
            <div className="win7 h-[calc(100vh-70px)]">
              <div className="white-light mb-6 min-h-[54px]">
                <div className="flex items-center">
                  <p className="flex gap-1 text-lg" dangerouslySetInnerHTML={{ __html: replaceEmoticons(contact.name) }} />
                  <p className="ml-1 capitalize">({statusLabels[contact.status] || contact.status})</p>
                </div>
                {contact.message && <p className="text-sm text-[#8a5c12]" dangerouslySetInnerHTML={{ __html: replaceEmoticons(contact.message) }} />}
              </div>
              <img src={divider} alt="" className="mb-[-5px] pointer-events-none" />

              <div className="flex flex-col justify-between h-full w-full my-4 text-sm pr-2">
                <div ref={messageContainerRef} id="message-container" className="overflow-y-auto break-all has-scrollbar">
                  <div className="wlm-safety-notice">
                    <img src={infoIcon} alt="Information" />
                    <span>N’incluez jamais d’informations sensibles, comme un mot de passe ou un numéro de carte bancaire, dans un message instantané.</span>
                  </div>
                  {messages.map((message, index) => message.kind === 'nudge' || message.content === NUDGE_TEXT ? (
                    <div key={message.id || index}><p>━━━━</p><p className="ml-1">{message.role === 'user' ? NUDGE_TEXT : `${contact.name} vous a envoyé un wizz.`}</p><p>━━━━</p></div>
                  ) : (
                    <div key={message.id || index} className={`message ${message.role}`}>
                      <div className="flex text-black text-opacity-70"><p className="flex gap-1" dangerouslySetInnerHTML={{ __html: replaceEmoticons(message.role === 'user' ? userName : contact.name) }} /><p className="ml-1">dit :</p></div>
                      <div className="flex gap-2 items-start ml-1"><div className="flex-shrink-0 mt-2.5"><img src={messageDot} alt="" /></div><p className="flex gap-1" dangerouslySetInnerHTML={{ __html: replaceEmoticons(message.content) }} /></div>
                    </div>
                  ))}
                </div>
                <div className="w-full">
                  {contactTyping && <div className="flex gap-1"><p className="flex" dangerouslySetInnerHTML={{ __html: replaceEmoticons(contact.name) }} /><p>est en train d’écrire...</p></div>}
                  {!contactTyping && lastReceived && <p className="opacity-50 my-1">Dernier message reçu le {new Date(lastReceived.created_at || Date.now()).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>}
                  {error && <p className="text-red-700">{error}</p>}
                  <img src={divider} alt="" className="pointer-events-none" />
                  <form onSubmit={handleSubmit}><input aria-label="Votre message" autoFocus type="text" value={input} onChange={handleInputChange} className="w-full border rounded-t-[4px] outline-none p-1 border-[#bdd5df]" /></form>
                  <img className="absolute bottom-[68px] left-[173.6px]" src={chatPointBackground} alt="" />
                  <div className="flex border-x border-b rounded-b-[4px] border-[#bdd5df]" style={{ backgroundImage: `url(${chatIconsBackground})` }}>
                    <EmoticonSelector /><WinkSelector />
                    <div className="flex items-center aerobutton p-1 h-6 cursor-pointer" onClick={handleNudge}><img src={sendNudge} alt="Wizz" /></div>
                    <div className="px-2"><img src={chatIconsSeparator} alt="" /></div>
                    <div className="flex items-center aerobutton p-1 h-6"><img src={changeFont} alt="Police" /></div>
                    <div className="flex items-center aerobutton p-1 h-6"><div className="w-5"><img src={changeBackground} alt="Arrière-plan" /></div><img src={arrow} alt="" /></div>
                  </div>
                  <div className="h-[121px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ChatPage;
