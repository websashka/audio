import styled from 'styled-components';

export const RecorderContainer = styled.div`
  background: white;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  -webkit-app-region: drag;
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  -webkit-app-region: no-drag;
`;

export const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin: 0 16px 20px;
`;

export const Tab = styled.button<{ active: boolean }>`
  padding: 8px 16px;
  border: none;
  background: ${(props: { active: boolean }) => props.active ? '#fff' : '#f5f5f5'};
  border-radius: 20px;
  cursor: pointer;
  font-weight: ${(props: { active: boolean }) => props.active ? '600' : '400'};
`;

export const DeviceInfo = styled.div`
  background: #f5f7ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const SourceSelector = styled.select`
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 16px 20px;
  width: calc(100% - 32px);
`;

export const Timer = styled.div`
  text-align: center;
  font-size: 48px;
  font-weight: 500;
  margin: 40px 0;
  color: #333;
`;

export const RecordButton = styled.button`
  background: #4285f4;
  color: white;
  border: none;
  width: calc(100% - 32px);
  margin: 0 16px;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.2s;

  &:hover {
    background: #3b78e7;
  }
`;

export const StopButton = styled(RecordButton)`
  background: #ff4b4b;

  &:hover {
    background: #e03c3c;
  }
`;

export const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  margin-top: auto;
`;

export const ActionButton = styled.button`
  flex: 1;
  padding: 12px;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: background 0.2s;

  &:hover {
    background: #e9e9e9;
  }
`;

export const SaveConfirmation = styled.div`
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: #4caf50;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s, fadeOut 0.3s 3s forwards;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;

export const ErrorMessage = styled.div`
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: #f44336;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  animation: fadeIn 0.3s, fadeOut 0.3s 3s forwards;
`;

export const SubtitlesContainer = styled.div`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  position: absolute;
  bottom: 50px;
  padding: 10px 16px;
  border-radius: 8px;
  margin: 0 16px 15px;
  font-size: 16px;
  text-align: center;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  transition: opacity 0.3s;
`;

export const ResponsesContainer = styled.div`
  margin: 0 16px 20px;
  padding: 12px;
  background-color: #f0f8ff;
  border-radius: 8px;
  max-height: 180px;
  overflow-y: auto;
`;

export const ResponseHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 8px;
`;

export const ResponseFilterContainer = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
`;

export const FilterButton = styled.button<{ active: boolean }>`
  background: ${(props) => props.active ? '#4285f4' : '#f1f1f1'};
  color: ${(props) => props.active ? 'white' : '#333'};
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
`;

export const ResponseItem = styled.div<{ type: 'message' | 'error' | 'other' }>`
  padding: 8px; 
  margin-bottom: 8px; 
  background-color: ${(props) => 
    props.type === 'error' ? '#fff0f0' : 
    props.type === 'other' ? '#f0f0ff' : 'white'
  }; 
  border-radius: 4px;
  border-left: 3px solid ${(props) =>
    props.type === 'error' ? '#ff4b4b' : 
    props.type === 'other' ? '#9370db' : '#4285f4'
  };
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
`;

export const ResponseItemHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  font-size: 12px; 
  color: #666;
  margin-bottom: 4px;
`;

export const ResponseItemContent = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
`;

export const InfoMessage = styled.div`
  background: #fef8e0;
  margin: 0 16px 15px;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #856404;
`;

export const DiagnosticContainer = styled.div`
  background: #e3f2fd;
  margin: 0 16px 15px;
  padding: 10px;
  border-radius: 8px;
  font-size: 13px;
  color: #0d47a1;
`;

export const VadSettingsContainer = styled.div`
  margin-top: 10px;
  margin-bottom: 10px;
`;

export const VadSettingsTitle = styled.div`
  font-size: 14px;
  margin-bottom: 5px;
  font-weight: 500;
`;

export const VadSettingsSlider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const VadSettingsHelp = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
`;

export const ApplySettingsButton = styled.button`
  background: #4caf50;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
`;

export const AudioTroubleshootingLink = styled.div`
  text-align: center;
  margin: 10px 16px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
`;

export const DiagnosticLink = styled.span`
  color: #4285f4;
  text-decoration: underline;
`;

export const DiagnosticCloseButton = styled.div`
  text-align: center; 
  margin-top: 5px; 
  color: #4285f4;
  cursor: pointer;
`;

export const NoButton = styled.button`
  border: none;
  background: none;
  color: #4285f4;
  cursor: pointer;
  font-size: 13px;
`;

export const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0 16px;
`; 