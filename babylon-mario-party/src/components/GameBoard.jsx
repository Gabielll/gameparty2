import React, { useEffect } from 'react'; // Import useEffect
import { Engine, Scene, useScene } from 'react-babylonjs';
import { Vector3, Color3, Color4 } from '@babylonjs/core/Maths/math';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent'; // For hemispheric light
import '@babylonjs/core/Meshes/Builders/groundBuilder'; // For CreateGround
import '@babylonjs/core/Meshes/Builders/boxBuilder'; // For CreateBox
import '@babylonjs/core/Meshes/Builders/sphereBuilder'; // For CreateSphere

// boardSpacePositions is defined globally in the file, so GameBoard can access it.
// It's also exported for App.jsx
const GameBoard = (props) => { // Accept props
  const scene = useScene();
  const { playerSpaceIndices } = props; // Destructure from props

  // Setup ground
  const ground = MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
  ground.receiveShadows = true;

  // Setup boxes from boardSpacePositions (using module-level constant)
  boardSpacePositions.forEach((position, index) => {
    const box = MeshBuilder.CreateBox(`box-${index}`, { size: 1 }, scene);
    box.position = position;
    // You can add material or color to the boxes here if needed
  });

  // Player sphere properties
  const sphereDiameter = 0.4;
  const sphereYOffset = 0.5 + sphereDiameter / 2; // Y offset from the center of the box

  // Player metadata for creation and positioning
  const playersMeta = [
    { name: "player1", diffuseColor: new Color3(1, 0, 0), initialOffset: new Vector3(-sphereDiameter / 2, 0, -sphereDiameter / 2) },
    { name: "player2", diffuseColor: new Color3(0, 0, 1), initialOffset: new Vector3(sphereDiameter / 2, 0, -sphereDiameter / 2) },
    { name: "player3", diffuseColor: new Color3(0, 1, 0), initialOffset: new Vector3(-sphereDiameter / 2, 0, sphereDiameter / 2) },
    { name: "player4", diffuseColor: new Color3(1, 1, 0), initialOffset: new Vector3(sphereDiameter / 2, 0, sphereDiameter / 2) },
  ];

  // Effect for initial creation of player spheres
  useEffect(() => {
    if (scene) {
      const initialBoardSpacePos = boardSpacePositions[0]; // All players start at space 0
      playersMeta.forEach(playerMeta => {
        if (!scene.getMeshByName(playerMeta.name)) {
          const sphere = MeshBuilder.CreateSphere(playerMeta.name, { diameter: sphereDiameter, segments: 32 }, scene);
          sphere.position = new Vector3(
            initialBoardSpacePos.x + playerMeta.initialOffset.x,
            initialBoardSpacePos.y + sphereYOffset,
            initialBoardSpacePos.z + playerMeta.initialOffset.z
          );
          const material = new StandardMaterial(`${playerMeta.name}-material`, scene);
          material.diffuseColor = playerMeta.diffuseColor;
          sphere.material = material;
        }
      });
    }
  }, [scene]); // Runs once when scene is available

  // Effect for updating player sphere positions based on playerSpaceIndices prop
  useEffect(() => {
    if (scene && playerSpaceIndices) {
      playerSpaceIndices.forEach((spaceIdx, playerIdx) => {
        const playerMeta = playersMeta[playerIdx];
        if (!playerMeta) return;

        const playerMesh = scene.getMeshByName(playerMeta.name);
        const targetBoardSpacePosition = boardSpacePositions[spaceIdx];

        if (playerMesh && targetBoardSpacePosition) {
          playerMesh.position = new Vector3(
            targetBoardSpacePosition.x + playerMeta.initialOffset.x, // Maintain same offset
            targetBoardSpacePosition.y + sphereYOffset,
            targetBoardSpacePosition.z + playerMeta.initialOffset.z  // Maintain same offset
          );
        }
      });
    }
  }, [playerSpaceIndices, scene]); // Runs when playerSpaceIndices or scene changes

  // Setup Dice
  const die = MeshBuilder.CreateBox("dice", { size: 0.5 }, scene);
  die.position = new Vector3(0, 1.25, -2); // Position it next to the board

  return (
    <>
      <hemisphericLight name="light1" intensity={0.7} direction={Vector3.Up()} />
      <arcRotateCamera
        name="camera1"
        target={Vector3.Zero()}
        alpha={Math.PI / 2}
        beta={Math.PI / 4}
        radius={15}
        attachControl={true}
      />
    </>
  );
};

const GameBoardScene = (props) => ( // Accept props here
  <div style={{ flex: 1, display: 'flex' }}>
    <Engine antialias adaptToDeviceRatio canvasId="babylonJS">
      <Scene>
        {/* Pass playerSpaceIndices down to GameBoard */}
        <GameBoard playerSpaceIndices={props.playerSpaceIndices} />
      </Scene>
    </Engine>
  </div>
);

// boardSpacePositions is defined here, outside components, making it a module-level constant.
const boardSpacePositions = [
  new Vector3(-4, 0.5, 0), // Space 0
  new Vector3(-2, 0.5, 0), // Space 1
  new Vector3(0, 0.5, 0),  // Space 2
  new Vector3(2, 0.5, 0),  // Space 3
  new Vector3(4, 0.5, 0),  // Space 4
];

export { boardSpacePositions };
export default GameBoardScene;
