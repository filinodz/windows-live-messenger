import React from 'react';
import { answerInvitation } from '../services/messenger';

const Invitations = ({ invitations, onAnswered }) => {
  if (!invitations.length) return null;
  return (
    <div className="invitations-panel mx-4 mt-2 border border-[#8db8d0] rounded bg-white/80 p-2">
      <p className="font-bold text-[#1D2F7F]">Invitations ({invitations.length})</p>
      {invitations.map((invitation) => (
        <div key={invitation.id} className="invitation-row flex items-center justify-between mt-1 gap-2">
          <span>{invitation.requester.display_name || invitation.requester.email}</span>
          <span className="flex gap-1 win7">
            <button onClick={() => answerInvitation(invitation.id, true).then(onAnswered)}>Accepter</button>
            <button onClick={() => answerInvitation(invitation.id, false).then(onAnswered)}>Refuser</button>
          </span>
        </div>
      ))}
    </div>
  );
};

export default Invitations;
