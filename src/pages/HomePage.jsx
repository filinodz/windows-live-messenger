import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Background from '../components/Background';
import SearchBar from '../components/SearchBar';
import ContactCategory from '../components/ContactList';
import WhatsNew from '../components/WhatsNew';
import UserInformations from '../components/UserInformations';
import AddContactModal from '../components/AddContactModal';
import Invitations from '../components/Invitations';
import contactsData from '../data/contacts.json';
import { useAuth } from '../contexts/AuthContext';
import { getContacts, getPendingInvitations } from '../services/messenger';
import { supabase } from '../lib/supabase';
import { assetUrl } from '../utils/assets';
import arrow from '/assets/general/arrow.png';
import ad from '/assets/ad.png';
import addcontact from '/assets/contacts/add_contact.png';
import showmenu from '/assets/contacts/1489.png';
import contactlistlayout from '/assets/contacts/change_contact_list_layout.png';
import divider from '/assets/general/divider.png';
import hotmail from '/assets/general/hotmail.png';

const HomePage = () => {
  const { user, online } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [query, setQuery] = useState('');
  const [showAddContact, setShowAddContact] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      if (!online) {
        setContacts(contactsData);
        return;
      }
      const [nextContacts, nextInvitations] = await Promise.all([
        getContacts(user.id),
        getPendingInvitations(user.id),
      ]);
      setContacts(nextContacts);
      setInvitations(nextInvitations);
      setError('');
    } catch (refreshError) {
      setError('Impossible de synchroniser la liste de contacts.');
      console.error(refreshError);
    }
  }, [online, user?.id]);

  useEffect(() => {
    refresh();
    if (!online) return undefined;
    const channel = supabase.channel(`contacts:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friendships' }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, refresh)
      .subscribe();
    const timer = setInterval(refresh, 60000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [refresh, online, user?.id]);

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('fr');
    if (!search) return contacts;
    return contacts.filter((contact) => `${contact.name} ${contact.email} ${contact.message}`.toLocaleLowerCase('fr').includes(search));
  }, [contacts, query]);

  const favorites = filtered.filter((contact) => contact.isFavorite === 1);
  const available = filtered.filter((contact) => contact.status !== 'offline');
  const offline = filtered.filter((contact) => contact.status === 'offline');
  const background = assetUrl(localStorage.getItem('scene') || '/assets/scenes/default_background.jpg');

  return (
    <Background>
      <div
        className={`bg-no-repeat ${background.endsWith('/assets/scenes/default_background.jpg') ? 'h-screen' : 'h-[97px]'} bg-[length:100%_100px]`}
        style={{
          backgroundImage: `url(${background})`,
          backgroundSize: !background.endsWith('/assets/scenes/default_background.jpg') ? 'cover' : '',
          backgroundPosition: !background.endsWith('/assets/scenes/default_background.jpg') ? 'center' : '',
        }}
      >
        <div className="flex flex-col w-full font-sans text-base h-screen win7">
          <div className="flex justify-between px-4 pt-4">
            <UserInformations />
            <div className="w-9 mb-2 flex items-end"><img src={hotmail} alt="Courrier" /></div>
          </div>

          <div className="h-full">
            <img src={divider} alt="" className="mb-[-5px] pointer-events-none mix-blend-multiply" />
            <div className="flex items-center mt-2 px-4">
              <SearchBar initialValue="Rechercher dans vos contacts..." value={query} onChange={setQuery} />
              <div className="flex gap-1 items-center aerobutton p-1 ml-1 h-6 cursor-pointer disabled:opacity-40" title="Ajouter un contact" onClick={() => online && setShowAddContact(true)}>
                <div className="w-5"><img src={addcontact} alt="Ajouter un contact" /></div><img src={arrow} alt="" />
              </div>
              <div className="flex gap-1 items-center aerobutton p-1 h-6"><div className="w-5"><img src={contactlistlayout} alt="" /></div></div>
              <div className="flex gap-1 items-center aerobutton p-1 h-6"><div className="w-5"><img src={showmenu} alt="" /></div><img src={arrow} alt="" /></div>
            </div>
            {error && <p className="mx-4 mt-2 text-red-700">{error}</p>}
            <Invitations invitations={invitations} onAnswered={refresh} />
            <div className="overflow-y-auto has-scrollbar h-[58.8vh]">
              {favorites.length > 0 && <ContactCategory title="Favoris" contacts={favorites} count={favorites.length} favorite />}
              <ContactCategory title="Disponibles" contacts={available} count={available.length} />
              <ContactCategory title="Hors ligne" contacts={offline} count={offline.length} />
              {!filtered.length && <p className="opacity-60 text-center mt-8">Aucun contact à afficher.</p>}
            </div>
          </div>

          <WhatsNew />
          <div className="w-full mix-blend-luminosity bg-white h-[1px] shadow-sm shadow-[#6b8fa3]" />
          <footer className="w-full flex justify-center pb-4"><div className="mt-4"><img src={ad} alt="" /></div></footer>
        </div>
      </div>
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} />}
    </Background>
  );
};

export default HomePage;
