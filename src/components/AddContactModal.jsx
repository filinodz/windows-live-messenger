import React, { useState } from 'react';
import '7.css/dist/7.scoped.css';
import { inviteContact } from '../services/messenger';
import { useAuth } from '../contexts/AuthContext';
import WLMIcon from '/assets/general/wlm-icon.png';

const AddContactModal = ({ onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await inviteContact(email, user.id);
      setMessage('Invitation envoyée. Le contact apparaîtra après son acceptation.');
      setEmail('');
    } catch (error) {
      setMessage(error.message || "Impossible d’envoyer l’invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <form onSubmit={submit} className="add-contact-modal w-[450px] rounded-lg shadow-lg bg-gradient-to-t from-[#c3d4ec83] via-white to-[#c3d4ec83] win7">
          <div className="flex justify-between items-center rounded-t-lg bg-[#f3f3f3]">
            <div className="flex items-center ml-1"><img src={WLMIcon} alt="" /><p className="ml-1">Ajouter un contact</p></div>
            <button type="button" onClick={onClose} className="px-3 hover:bg-red-700 hover:text-white">╳</button>
          </div>
          <div className="p-5">
            <p className="text-xl text-[#1D2F7F]">Ajouter une personne</p>
            <p className="opacity-70 mb-4">Saisissez l’adresse utilisée lors de son inscription à Messenger.</p>
            <label htmlFor="contact-email">Adresse de messagerie :</label>
            <input id="contact-email" className="w-full mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ami@hotmail.fr" required />
            {message && <p className="mt-3 text-sm">{message}</p>}
          </div>
          <div className="flex justify-end gap-2 bg-white/60 p-3">
            <button type="submit" disabled={busy}>{busy ? 'Envoi...' : 'Ajouter un contact'}</button>
            <button type="button" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black" />
    </>
  );
};

export default AddContactModal;
