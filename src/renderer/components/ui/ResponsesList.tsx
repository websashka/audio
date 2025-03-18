import React, { RefObject, useEffect } from 'react';
import { ResponseLogItem } from '../../types';
import {
  ResponsesContainer,
  ResponseHeader,
  ResponseFilterContainer,
  FilterButton,
  ResponseItem,
  ResponseItemHeader,
  ResponseItemContent,
  NoButton
} from './Styles';

interface ResponsesListProps {
  responses: ResponseLogItem[];
  filter: 'all' | 'message' | 'error' | 'other';
  setFilter: (filter: 'all' | 'message' | 'error' | 'other') => void;
  onClear: () => void;
  onSave: () => void;
  containerRef: RefObject<HTMLDivElement>;
}

const ResponsesList: React.FC<ResponsesListProps> = ({
  responses,
  filter,
  setFilter,
  onClear,
  onSave,
  containerRef
}) => {
  // Скроллим к последнему сообщению при обновлении списка
  useEffect(() => {
    if (containerRef.current && responses.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [responses, containerRef]);

  if (responses.length === 0) {
    return null;
  }
  
  return (
    <ResponsesContainer ref={containerRef}>
      <ResponseHeader>
        <div style={{ fontWeight: 'bold' }}>Ответы от OpenAI:</div>
        <div>
          <NoButton 
            onClick={onSave}
            style={{ marginRight: '10px' }}
            disabled={responses.length === 0}
          >
            Сохранить
          </NoButton>
          <NoButton onClick={onClear}>
            Очистить
          </NoButton>
        </div>
      </ResponseHeader>
      
      <ResponseFilterContainer>
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          Все
        </FilterButton>
        <FilterButton
          active={filter === 'message'}
          onClick={() => setFilter('message')}
        >
          Сообщения
        </FilterButton>
        <FilterButton
          active={filter === 'error'}
          onClick={() => setFilter('error')}
        >
          Ошибки
        </FilterButton>
        <FilterButton
          active={filter === 'other'}
          onClick={() => setFilter('other')}
        >
          События
        </FilterButton>
      </ResponseFilterContainer>
      
      {responses
        .filter(response => filter === 'all' || response.type === filter)
        .map((response, index) => (
          <ResponseItem key={index} type={response.type}>
            <ResponseItemHeader>
              <div>
                <span>{
                  response.type === 'error' ? 'Ошибка' : 
                  response.type === 'other' ? 'Событие' : 'Сообщение'
                }</span>
                {response.eventType && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888' }}>
                    {response.eventType}
                  </span>
                )}
              </div>
              <span>{response.timestamp}</span>
            </ResponseItemHeader>
            <ResponseItemContent>{response.content}</ResponseItemContent>
          </ResponseItem>
        ))}
    </ResponsesContainer>
  );
};

export default ResponsesList; 