import React from 'react';
import { InfoMessage } from './Styles';

interface AudioDriverInfoProps {
  audioDriverMessage: string | null;
  isMacOS: boolean;
}

const AudioDriverInfo: React.FC<AudioDriverInfoProps> = ({
  audioDriverMessage,
  isMacOS
}) => {
  if (!audioDriverMessage) {
    return null;
  }
  
  return (
    <InfoMessage>
      {audioDriverMessage}
      {isMacOS && (
        <div style={{ marginTop: '5px' }}>
          Recommended drivers:
          <ul style={{ margin: '5px 0' }}>
            <li>
              <a
                href="#"
                style={{ color: '#4285f4' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://github.com/kyleneideck/BackgroundMusic', '_blank');
                }}
              >
                Background Music
              </a>
            </li>
            <li>
              <a 
                href="#" 
                style={{ color: '#4285f4' }}
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://github.com/ExistentialAudio/BlackHole', '_blank');
                }}
              >
                BlackHole
              </a>
            </li>
          </ul>
        </div>
      )}
    </InfoMessage>
  );
};

export default AudioDriverInfo; 