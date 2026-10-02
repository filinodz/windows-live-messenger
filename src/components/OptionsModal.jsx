import React, { useState } from 'react';
import '7.css/dist/7.scoped.css';
import line from '/assets/general/subtitles_line_options.png';
import defaultAvatar from '/assets/usertiles/default.png';
import { replaceEmoticons } from '../helpers/replaceEmoticons';
import { useAuth } from '../contexts/AuthContext';

const ChangeDisplayPictureModal = ({ setShowOptionsModal }) => {
  const { updateProfile } = useAuth();
  const [user, setUser] = useState({
    message: localStorage.getItem('message'),
    email: localStorage.getItem('email'),
    name: localStorage.getItem('name'),
  });

  const [initialState, setInitialState] = useState({
    message: user.message,
    name: user.name,
  });

  const [message, setMessage] = useState(user.message || '');
  const [name, setName] = useState(user.name || '');
  const [isModified, setIsModified] = useState(false);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setIsModified(true);
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    setIsModified(true);
  };

  const handleApplyChanges = () => {
    if (isModified) {
      // Update localStorage with new values
      localStorage.setItem('message', message);
      localStorage.setItem('name', name);
      updateProfile({ display_name: name || '', personal_message: message || '' });
      setIsModified(false);
    }
  };

  const handleOk = () => {
    handleApplyChanges(); // Save changes before closing modal
    setShowOptionsModal(false); // Close modal
    window.location.reload();
  };

  const handleCloseModal = () => {
    setShowOptionsModal(false);
  };

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="options-dialog relative w-[520px] my-6 mx-auto max-w-3xl">
          {/*content*/}
          <div className="options-card rounded-lg shadow-lg relative flex flex-col w-full bg-[#f0f0f0] outline-none focus:outline-none h-[605px] border border-black border-opacity-35">
            {/*header*/}
            <div className="flex items-start justify-between rounded-t-lg bg-[#f3f3f3]">
              <div className="flex items-center ml-1">
                <p className="ml-1 pt-1">Options</p>
              </div>
              <button className="pb-2 pt-1 px-3 rounded-tr-lg hover:bg-red-700 hover:text-white" onClick={handleCloseModal}>
                <p className="text-[10px]">╳</p>
              </button>
            </div>

            <div className="options-layout flex pl-2 h-full w-full">
              <div className="options-sidebar border border-black bg-white w-[110px] mr-2 h-full">
                <div className="py-[5px] pl-1 bg-[#0078d7] text-white cursor-pointer m-[1px]">Personnel</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Disposition</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Connexion</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Messages</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Alertes</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Sons</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Transfert de fichiers</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Confidentialité</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Sécurité</div>
                <div className="py-[5px] pl-1 hover:bg-[#0078d7] hover:text-white cursor-pointer m-[1px]">Réseau</div>
              </div>
              <div className="options-content w-full pr-1">
                <fieldset className="border border-black border-opacity-10 h-full">
                  <legend className="font-bold ml-2">Personnel</legend>
                  <div className="flex gap-1 mt-2">
                    <p className="ml-6">Nom d’affichage</p>
                    <div className="mt-[10px]">
                      <img src={line} />
                    </div>
                  </div>
                  <div className="ml-12 mt-1">
                    <div>
                      <p>Entrez le nom que verront vos contacts :</p>
                      <input
                        type="text"
                        className="options-input w-[145px] border border-black border-opacity-25 h-6 mt-1 outline-none"
                        value={name}
                        onChange={handleNameChange}
                      />
                    </div>
                    <div className="mt-1">
                      <p>Entrez un message personnel visible par vos contacts :</p>
                      <input
                        type="text"
                        className="options-input w-[290px] border border-black border-opacity-25 h-6 mt-1 outline-none"
                        value={message}
                        onChange={handleMessageChange}
                      />
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>

            {/*footer*/}
            <div className="flex items-center justify-end rounded-b win7 p-3 gap-1.5">
              <button type="button" onClick={handleOk}>
                OK
              </button>
              <button type="button" onClick={handleCloseModal}>
                Annuler
              </button>
              <button type="button" onClick={handleApplyChanges} disabled={!isModified}>
                Appliquer
              </button>
              <button type="button">Aide</button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default ChangeDisplayPictureModal;
