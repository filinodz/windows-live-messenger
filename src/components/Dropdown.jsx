import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import arrow from '/assets/general/arrow.png';
import ChangeDisplayPictureModal from './ChangeDisplayPictureModal';
import OptionsModal from './OptionsModal';
import { replaceEmoticons } from '../helpers/replaceEmoticons';
import ChangeSceneModal from '../components/ChangeSceneModal';
import { useAuth } from '../contexts/AuthContext';

const Dropdown = ({ options, value, onChange = () => {}, showStatusDots = false }) => {
  const { signOut, updateProfile } = useAuth();
  const [user, setUser] = useState({
    loggedin: localStorage.getItem('loggedin') || '',
    email: localStorage.getItem('email') || '',
    message: localStorage.getItem('message') || '',
    status: localStorage.getItem('status') || 'Available',
    name: localStorage.getItem('name') || '',
  });

  const [changePictureShowModal, setShowChangePictureModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showChangeSceneModal, setShowChangeSceneModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options.find((option) => option.value === (value || user.status)) || options[0]);
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleOptionClick = (option) => {
    switch (option.value) {
      case 'Available':
      case 'Busy':
      case 'Away':
      case 'Offline':
        setSelectedOption(option);
        localStorage.setItem('status', option.value);
        updateProfile({ status: option.value });
        onChange(option.value);
        break;
      case 'Sign out':
        signOut().finally(() => navigate('/login'));
        break;
      case 'ChangeDisplayPicture':
        setShowChangePictureModal(true);
        break;
      case 'ChangeScene':
        setShowChangeSceneModal(true);
        break;
      case 'ChangeDisplayName':
        setShowOptionsModal(true);
        break;
      default:
        break;
    }
    setIsOpen(false);
  };

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const next = options.find((option) => option.value === value);
    if (next) setSelectedOption(next);
  }, [value]);

  return (
    <div className="wlm-dropdown relative inline-block min-w-0" ref={dropdownRef}>
      <div onClick={handleToggleDropdown} className="wlm-dropdown-trigger flex aerobutton cursor-pointer items-center px-1 ml-1 white-light min-w-0">
        <div className="flex items-center min-w-0">
          {showStatusDots && selectedOption.image && (
            <img src={selectedOption.image} alt={selectedOption.label} className="inline-block mt-0.5 mr-1 w-2" />
          )}

          {user.loggedin && !showStatusDots &&
            (user.name !== '' ? (
              <span
                className="wlm-display-name flex gap-1 text-lg items-baseline truncate"
                dangerouslySetInnerHTML={{ __html: replaceEmoticons(user.name) }}
              />
            ) : (
              <span
                className="wlm-display-name flex gap-1 text-lg items-baseline truncate"
                dangerouslySetInnerHTML={{ __html: replaceEmoticons(user.email) }}
              />
            ))}

          <p className="ml-1">{showStatusDots ? selectedOption.label : `(${selectedOption.label})`}</p>
        </div>
        {/* )} */}
        <img src={arrow} className="inline-block mb-0.5 ml-2" alt="Ouvrir le menu" />
      </div>

      {isOpen && (
        <ul className="wlm-dropdown-menu absolute bg-white border border-gray-300 rounded shadow w-[300px] mt-1 z-10 py-1">
          {options.map((option, index) =>
            option.separator ? (
              <li key={`separator-${index}`} className="border-t my-1"></li>
            ) : (
              <li
                key={option.value}
                className="wlm-dropdown-item px-4 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleOptionClick(option)}
              >
                {option.image ? (
                  <img src={option.image} alt={option.label} className="inline-block mt-0.5 mr-2 w-2" />
                ) : (
                  <div className="w-4" />
                )}
                {option.label}
              </li>
            )
          )}
        </ul>
      )}

      {changePictureShowModal && <ChangeDisplayPictureModal setShowChangePictureModal={setShowChangePictureModal} />}
      {showOptionsModal && <OptionsModal setShowOptionsModal={setShowOptionsModal} />}
      {showChangeSceneModal && <ChangeSceneModal setShowChangeSceneModal={setShowChangeSceneModal} />}
    </div>
  );
};

export default Dropdown;
