import React, { useState } from 'react';
import GameBoardScene, { boardSpacePositions } from './components/GameBoard'; // Import boardSpacePositions
import './App.css'

const MAX_PLAYERS = 4; // Assuming 4 players
const MAX_BOARD_SPACES = boardSpacePositions.length;

function App() {
  const [diceRollResult, setDiceRollResult] = useState(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerSpaceIndices, setPlayerSpaceIndices] = useState(Array(MAX_PLAYERS).fill(0));

  const rollDice = () => {
    const currentRoll = Math.floor(Math.random() * 6) + 1;
    setDiceRollResult(currentRoll);
    console.log("Dice Roll Result:", currentRoll);

    setPlayerSpaceIndices(prevSpaceIndices => {
      const newSpaceIndices = [...prevSpaceIndices];
      let newSpaceIndex = newSpaceIndices[currentPlayerIndex] + currentRoll;

      // Cap at the last space
      if (newSpaceIndex >= MAX_BOARD_SPACES) {
        newSpaceIndex = MAX_BOARD_SPACES - 1;
      }

      newSpaceIndices[currentPlayerIndex] = newSpaceIndex;
      console.log(`Player ${currentPlayerIndex + 1} (index ${currentPlayerIndex}) moved to space index ${newSpaceIndex}`);
      return newSpaceIndices;
    });

    // For now, advance to the next player, or back to player 0.
    // More complex turn logic will be needed later.
    setCurrentPlayerIndex((prevPlayerIndex) => (prevPlayerIndex + 1) % MAX_PLAYERS);
  };

  return (
    <div id="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Babylon Mario Party</h1>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <p>Current Player: {currentPlayerIndex + 1}</p>
        <button onClick={rollDice}>Roll Dice</button>
        {diceRollResult && <p>Dice Roll: {diceRollResult}</p>}
        <div>
          {playerSpaceIndices.map((spaceIndex, playerIdx) => (
            <p key={playerIdx}>Player {playerIdx + 1} is at space {spaceIndex +1}</p>
          ))}
        </div>
      </div>
      <GameBoardScene playerSpaceIndices={playerSpaceIndices} />
    </div>
  )
}

export default App
