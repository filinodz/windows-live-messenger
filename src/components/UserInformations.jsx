// UserInformation.jsx
import React, { useState, useEffect, useRef } from 'react';
import AvatarSmall from '../components/AvatarSmall';
import arrow from '/assets/general/arrow.png';
import Dropdown from './Dropdown';
import statusFrames from '../imports/statusFrames';
import { replaceEmoticons } from '../helpers/replaceEmoticons';
import { useAuth } from '../contexts/AuthContext';

const UserInformation = () => {
  const { profile, updateProfile } = useAuth();
  const [user, setUser] = useState({
    message: localStorage.getItem('message'),
    status: localStorage.getItem('status') || 'Available',
    name: localStorage.getItem('name') || '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(user.message || '');
  const inputRef = useRef(null);

  const options = [
    { value: 'Available', label: 'Disponible', image: statusFrames.onlineDot },
    { value: 'Busy', label: 'Occupé', image: statusFrames.busyDot },
    { value: 'Away', label: 'Absent', image: statusFrames.awayDot },
    {
      value: 'Offline',
      label: 'Apparaître hors ligne',
      image: statusFrames.offlineDot,
    },
    { separator: true },
    { value: 'Sign out', label: 'Se déconnecter' },
    { separator: true },
    { value: 'ChangeDisplayPicture', label: "Modifier l’image perso..." },
    { value: 'ChangeScene', label: 'Modifier la scène...' },
    { value: 'ChangeDisplayName', label: "Modifier le nom d’affichage..." },
  ];

  const handleMessageClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    adjustInputWidth();
  };

  const handleInputBlur = () => {
    setUser({ ...user, message });
    localStorage.setItem('message', message);
    updateProfile({ personal_message: message || '' });
    setIsEditing(false);
  };

  const handleInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const adjustInputWidth = () => {
    if (inputRef.current) {
      inputRef.current.style.width = `${inputRef.current.value.length}ch`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustInputWidth();
    }
  }, [isEditing]);

  const handleStatusChange = (status) => {
    setUser({ ...user, status });
    localStorage.setItem('status', status);
    updateProfile({ status });
  };
  return (
    <div className="messenger-user-info flex min-w-0">
      <AvatarSmall />
      <div className="messenger-user-copy ml-[-12px] min-w-0">
        <div className="flex items-center">
          <Dropdown options={options} value={user.status} onChange={handleStatusChange} />
        </div>
        <div className="messenger-personal-message flex aerobutton pl-1 ml-1 items-center white-light" onClick={handleMessageClick}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyPress={handleInputKeyPress}
              autoFocus
              className="border border-gray-300 rounded outline-none"
              style={{ width: `${message.length}ch` }}
            />
          ) : (
            <p className="cursor-pointer flex gap-1">
              {!message ? (
                'Partager un message perso...'
              ) : (
                <span
                  className="flex gap-1"
                  dangerouslySetInnerHTML={{
                    __html: replaceEmoticons(message),
                  }}
                ></span>
              )}
            </p>
          )}
          <div className="ml-1">
            <img src={arrow} alt="arrow icon" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInformation;
