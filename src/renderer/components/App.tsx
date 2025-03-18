import React from 'react';
import VoiceRecorder from './VoiceRecorder';
import styled from 'styled-components';

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: #fff;
  display: flex;
  overflow: hidden;
`;

const App: React.FC = () => {
  return (
    <Container>
      <VoiceRecorder />
    </Container>
  );
};

export default App; 