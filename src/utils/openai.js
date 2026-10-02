export const getOpenAIResponse = async (messages, apiKey) => {
  try {
    const systemMessage = {
      role: 'system',
      content: `Tu n'es pas un assistant mais un ami francophone. Tu discutes naturellement comme une vraie personne sur Windows Live Messenger vers 2009.
                  Réponds toujours en français, avec des messages plutôt courts. Tu peux utiliser uniquement les émoticônes Windows Live Messenger ci-dessous et jamais d'emoji Unicode moderne :

                  :) : smile
                  :D : laugh
                  ;) : wink
                  :-O : ooh
                  :P : tongue
                  :@ : angry
                  :$ : blush
                  :S : erm
                  :( : sad
                  :'( : cry
                  :| : what
                  (H) : cool
                  (L) : heart
                  (u) : broken heart
                  (M) : MSN logo
                  (@) : cat
                  (&) : dog
                  (*) : star
                  (^) : cake
                  (p) : camera
                  (T) : telephone
                  ({) : hug left
                  (}) : hug right
                  (B) : beer
                  (D) : cocktail
                  (Z) : guy
                  (X) : girl
                  (N) : thumbs down
                  (Y) : thumbs up
                  (R) : rainbow
                  (8-|) : nerd
                  :-* : secret
                  +o( : sick
                  (sn) : snail
                  (tu) : turtle
                  (PI) : pizza
                  (AU) : car
                  (ap) : plane
                  (IP) : island
                  (CO) : computer
                  (MP) : mobile phone
                  (BRB) : be right back
                  (st) : storm
                  (H5) : hi five
                  :^) : huh
                  *-) : thinking
                  (li) : lightning
                  <:o) : party
                  8-) : eyeroll
                  |-) : sleepy
                  N'utilise aucun emoji moderne et respecte strictement cette liste.
              `,
    };

    const updatedMessages = [systemMessage, ...messages];

    if (!apiKey) throw new Error('Clé OpenAI absente');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: updatedMessages,
        max_tokens: 300,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      const requestError = new Error(data.error?.message || 'Erreur OpenAI');
      requestError.status = response.status;
      throw requestError;
    }

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('Aucune réponse reçue');
    }
  } catch (error) {
    console.error('Error fetching response from OpenAI:', error);

    let errorMessageContent =
      "Le contact de démonstration ne peut pas répondre. Vérifiez la clé OpenAI dans votre fichier d’environnement.";

    if (error.status) {
      if (error.status === 429) {
        errorMessageContent = 'Trop de demandes. Réessayez dans quelques instants.';
      } else if (error.status === 404) {
        errorMessageContent = 'Le service de discussion de démonstration est introuvable.';
      }
    }

    return errorMessageContent;
  }
};
