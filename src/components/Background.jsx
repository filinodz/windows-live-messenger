import React from 'react';
import bg from '/assets/background/background.jpg';

const schemeColors = {
  sky: '#8bcde8', twilight: '#7882b7', sea: '#57b6ae', lime: '#a6ce39', sun: '#f3c74f',
  pumpkin: '#ed8b2c', ruby: '#c44955', fuchsia: '#d65ca9', blush: '#e99aaa', violet: '#9b72c2',
  slate: '#78909c', smoke: '#9aa0a6', match_my_scene_color: '#d8edf8',
};

const Background = ({ children }) => {
  const storedScheme = localStorage.getItem('colorScheme');
  const schemeName = Object.keys(schemeColors).find((name) => storedScheme?.includes(name));
  const colorScheme = storedScheme?.startsWith('#') ? storedScheme : schemeColors[schemeName] || '#d8edf8';

  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const colorSchemeRgba = colorScheme ? hexToRgba(colorScheme, 0.25) : 'rgba(255, 255, 255, 0.5)'; // Default to white with 50% opacity

  return (
    <div
      className="relative h-screen bg-no-repeat bg-bottom bg-[length:100%_400px] bg-gradient-to-t via-white"
      style={{
        backgroundImage: `linear-gradient(to top, ${colorSchemeRgba}, white), url(${bg})`,
        backgroundSize: '100% 400px',
      }}
    >
      <div className="h-full bg-no-repeat bg-[length:100%_100px]" style={{ backgroundImage: `url(${bg})` }}>
        {children}
      </div>
    </div>
  );
};

export default Background;
