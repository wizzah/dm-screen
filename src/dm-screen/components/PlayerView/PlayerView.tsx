import {
  Adventure,
  Handout,
  InitiativeItem
} from '@core/types';
import { 
  Container,
  Grid,
  GridRow,
  Item,
  Modal
} from '@designSystem/components';
import {
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

import { io } from 'socket.io-client';
import { Socket } from 'socket.io';
import { useQuery } from '@tanstack/react-query';

import { InitiativeOrder } from '../InitiativeOrder';
import { InitiativeOrderContext } from '../InitiativeOrderContext';

export const PlayerView = () => {
  const socketRef = useRef<Socket | null>(null);
  const [imageToDisplay, setImageToDisplay] = useState<Handout | null>(null);

  const {
    data,
    isFetching,
    isLoading,
    isPending
  } = useQuery({
    queryKey: ['adventureData'],
    queryFn: () => {
      return fetch('http://localhost:3000/adventure/1').then((response) => response.json())
    }  
  });

  const {
    initiativeOrder: {
      currentId,
      items
    },
    setCurrentId,
    setItems,
    setRound
  } = useContext(InitiativeOrderContext);

  useEffect(() => {
    if (!socketRef.current) {
      // @ts-expect-error socket.io type setup isn't the most well documented and needs to be solved later. 
      socketRef.current = io('http://localhost:3000');
    }

    const ws = socketRef.current;

    ws?.on('handout:receive-show', (data) => {
      setImageToDisplay(data);
    });

    ws?.on('initiative:receive', (data) => {
      const {
        currentId,
        items,
        round,
      } = data;

      setCurrentId(currentId);
      setItems(items);
      setRound(round);
    });
  }, [
    setCurrentId,
    setItems,
    setRound
  ]);

  if (
    isFetching ||
    isLoading ||
    isPending
  ) return null;

  if (!data) {
    return null;
  }

  const adventure = data as Adventure;

  const getCurrentPlayer = (): InitiativeItem | null => {
    return items.find((i) => i.id === currentId) ?? null;
  };

  const getNextPlayer = (): InitiativeItem => {
    const itemIndex = items.findIndex((i) => i.id === currentId);
    if (itemIndex === items.length - 1) {
      return items[0];
    }

    return items[itemIndex + 1];
  };

  const currentPlayer = getCurrentPlayer();
  const nextPlayer = getNextPlayer();

  return (
    <>
      <InitiativeOrder
        creatures={adventure.creatures}
        playerView/>
      <Container>
        <Grid>
          <GridRow>
            <Item columns={6}>
              <div style={{
                textAlign: 'center'
              }}>
                <h2>Playing</h2>
                <h4>{currentPlayer?.name}</h4>
                <img
                  alt={currentPlayer?.name}
                  src={currentPlayer?.imageSrc ?? '/d20.jpg'}
                  style={{
                    maxHeight: '250px',
                    maxWidth: '100%'
                  }}
                />
              </div>
            </Item>
            <Item columns={6}>
              <div style={{
                textAlign: 'center'
              }}>
                <h2>On Deck</h2>
                <h4>{nextPlayer?.name}</h4>
                <img
                  alt={nextPlayer?.name}
                  src={nextPlayer?.imageSrc ?? '/d20.jpg'}
                  style={{
                    maxHeight: '250px',
                    maxWidth: '100%'
                  }}
                />
              </div>
            </Item>
          </GridRow>
        </Grid>
        {
          !!imageToDisplay && (
            <Modal
              isOpen={!!imageToDisplay}
              onClose={() => {
                setImageToDisplay(null);
              }}
              portalElement={document.body}
              >
              <img
                alt={imageToDisplay.description}
                key={imageToDisplay.id}
                src={imageToDisplay.url}
                style={{
                  display: 'block',
                  margin: '0 auto',
                  maxWidth: '100%'
                }}/>
            </Modal>
          )
        }
      </Container>
    </>
  )
};
