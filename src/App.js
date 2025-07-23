import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Estado para la suma actual y su resultado
  const [problem, setProblem] = useState({ num1: 0, num2: 0, result: 0 });
  
  // Estado para la posición y dirección del robot
  const [robot, setRobot] = useState({
    x: 0,
    y: 0,
    direction: 'right', // 'up', 'right', 'down', 'left'
    isMoving: false
  });
  
  // Estado para la cola de comandos
  const [commands, setCommands] = useState([]);
  
  // Estado para la cuadrícula y ubicación de números
  const [grid, setGrid] = useState([]);
  
  // Estado para mensajes modales
  const [modal, setModal] = useState({
    show: false,
    message: '',
    success: false,
    showPath: false
  });
  
  // Estado para el camino solución (para visualizarlo cuando se complete el juego)
  const [solutionPath, setSolutionPath] = useState([]);

  // Generar un nuevo problema de suma al cargar la app
  useEffect(() => {
    generateNewProblem();
  }, []);

  // Generar un nuevo problema de suma y colocar números en la cuadrícula
  const generateNewProblem = () => {
    // Generar números aleatorios entre 1 y 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const result = num1 + num2;
    
    setProblem({ num1, num2, result });
    
    // Crear la cuadrícula con celdas vacías
    const newGrid = Array(5).fill().map(() => Array(5).fill(null));
    
    // Elegir posición para la respuesta correcta (no puede ser la posición inicial)
    let correctX, correctY;
    do {
      correctX = Math.floor(Math.random() * 5);
      correctY = Math.floor(Math.random() * 5);
    } while (correctX === 0 && correctY === 0);
    
    newGrid[correctY][correctX] = result;
    
    // Elegir posición para una respuesta incorrecta (no puede ser la posición inicial ni la respuesta correcta)
    let incorrectX, incorrectY;
    let incorrectValue;
    
    do {
      incorrectX = Math.floor(Math.random() * 5);
      incorrectY = Math.floor(Math.random() * 5);
      
      // Generar un valor incorrecto (diferente al resultado)
      do {
        incorrectValue = Math.floor(Math.random() * 50) + 1;
      } while (incorrectValue === result);
      
    } while (
      (incorrectX === 0 && incorrectY === 0) || 
      (incorrectX === correctX && incorrectY === correctY)
    );
    
    newGrid[incorrectY][incorrectX] = incorrectValue;
    
    // Crear una matriz de visitados para el algoritmo de búsqueda de camino
    const visited = Array(5).fill().map(() => Array(5).fill(false));
    
    // Función para verificar si una celda es válida para moverse
    const isSafe = (x, y) => {
      return (
        x >= 0 && x < 5 && y >= 0 && y < 5 && 
        !visited[y][x] && 
        newGrid[y][x] !== 'wall'
      );
    };
    
    // Búsqueda en profundidad para encontrar un camino
    const findPath = (x, y, targetX, targetY, path = []) => {
      // Marcamos la celda actual como visitada
      visited[y][x] = true;
      
      // Si hemos llegado al destino, devolvemos true
      if (x === targetX && y === targetY) {
        return true;
      }
      
      // Movimientos posibles (arriba, derecha, abajo, izquierda)
      const moves = [
        { dx: 0, dy: -1 }, // arriba
        { dx: 1, dy: 0 },  // derecha
        { dx: 0, dy: 1 },  // abajo
        { dx: -1, dy: 0 }  // izquierda
      ];
      
      // Probar cada dirección
      for (const move of moves) {
        const newX = x + move.dx;
        const newY = y + move.dy;
        
        if (isSafe(newX, newY)) {
          path.push({ x: newX, y: newY });
          if (findPath(newX, newY, targetX, targetY, path)) {
            return true;
          }
          path.pop(); // Retroceder si el camino no lleva al destino
        }
      }
      
      return false;
    };
    
    // Añadir muros aleatorios (entre 5 y 8 muros), pero garantizando un camino
    const numWalls = Math.floor(Math.random() * 4) + 5; // 5-8 muros
    let wallsPlaced = 0;
    let maxAttempts = 100; // Para evitar bucles infinitos
    
    while (wallsPlaced < numWalls && maxAttempts > 0) {
      const wallX = Math.floor(Math.random() * 5);
      const wallY = Math.floor(Math.random() * 5);
      
      // No poner muros en la casilla inicial, respuesta correcta o respuesta incorrecta
      if ((wallX === 0 && wallY === 0) || 
          (wallX === correctX && wallY === correctY) || 
          (wallX === incorrectX && wallY === incorrectY)) {
        maxAttempts--;
        continue;
      }
      
      // Si la casilla está vacía, intentamos colocar un muro
      if (newGrid[wallY][wallX] === null) {
        // Colocar el muro temporalmente
        newGrid[wallY][wallX] = 'wall';
        
        // Reiniciar la matriz de visitados
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            visited[y][x] = false;
          }
        }
        
        // Comprobar si aún hay un camino a la respuesta correcta
        const path = [];
        const pathExists = findPath(0, 0, correctX, correctY, path);
        
        if (pathExists) {
          // Si hay un camino, mantenemos el muro
          wallsPlaced++;
        } else {
          // Si no hay camino, quitamos el muro
          newGrid[wallY][wallX] = null;
        }
      }
      
      maxAttempts--;
    }
    
    // Calcular el camino solución final
    // Reiniciar la matriz de visitados una última vez
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        visited[y][x] = false;
      }
    }
    
    // Encontrar el camino final
    const finalPath = [{ x: 0, y: 0 }]; // Incluimos la posición inicial
    findPath(0, 0, correctX, correctY, finalPath);
    
    // Guardar el camino solución
    setSolutionPath(finalPath);
    
    setGrid(newGrid);
    
    // Reiniciar el robot y los comandos
    setRobot({ x: 0, y: 0, direction: 'right', isMoving: false });
    setCommands([]);
    setModal({ show: false, message: '', success: false });
  };

  // Añadir comandos a la cola
  const addCommand = (command) => {
    if (!robot.isMoving) {
      setCommands([...commands, command]);
    }
  };

  // Ejecutar la secuencia de comandos
  const executeCommands = () => {
    if (commands.length === 0 || robot.isMoving) return;
    
    setRobot(prev => ({ ...prev, isMoving: true }));
    
    // Ejecutar comandos secuencialmente con un retraso entre cada uno
    let currentRobot = { ...robot };
    let index = 0;
    
    const executeNextCommand = () => {
      if (index >= commands.length) {
        // Verificar si el robot está en la casilla con la respuesta correcta
        const currentCell = grid[currentRobot.y]?.[currentRobot.x];
        
        setTimeout(() => {
          if (currentCell === problem.result) {
            setModal({
              show: true,
              message: '¡Felicidades! ¡Has encontrado la respuesta correcta!',
              success: true,
              showPath: true // Añadir flag para mostrar el camino
            });
          } else if (currentCell !== null && currentCell !== 'wall') {
            setModal({
              show: true,
              message: '¡Inténtalo de nuevo! No has encontrado la respuesta correcta.',
              success: false
            });
          } else {
            // Si no está en ninguna casilla con número
            setModal({
              show: true,
              message: '¡Inténtalo de nuevo! Debes llegar a la casilla con la respuesta correcta.',
              success: false
            });
          }
          setRobot(prev => ({ ...prev, isMoving: false }));
        }, 500);
        
        return;
      }
      
      const command = commands[index];
      
      setTimeout(() => {
        // Actualizar la posición o dirección del robot según el comando
        if (command === 'forward') {
          let nextX = currentRobot.x;
          let nextY = currentRobot.y;
          
          switch (currentRobot.direction) {
            case 'up':
              if (currentRobot.y > 0) nextY--;
              break;
            case 'right':
              if (currentRobot.x < 4) nextX++;
              break;
            case 'down':
              if (currentRobot.y < 4) nextY++;
              break;
            case 'left':
              if (currentRobot.x > 0) nextX--;
              break;
            default:
              break;
          }
          
          // Verificar si la casilla siguiente es un muro
          if (grid[nextY]?.[nextX] !== 'wall') {
            currentRobot.x = nextX;
            currentRobot.y = nextY;
          }
          // Si es un muro, no se mueve
          
        } else if (command === 'turnLeft') {
          switch (currentRobot.direction) {
            case 'up': currentRobot.direction = 'left'; break;
            case 'right': currentRobot.direction = 'up'; break;
            case 'down': currentRobot.direction = 'right'; break;
            case 'left': currentRobot.direction = 'down'; break;
            default: break;
          }
        } else if (command === 'turnRight') {
          switch (currentRobot.direction) {
            case 'up': currentRobot.direction = 'right'; break;
            case 'right': currentRobot.direction = 'down'; break;
            case 'down': currentRobot.direction = 'left'; break;
            case 'left': currentRobot.direction = 'up'; break;
            default: break;
          }
        }
        
        // Actualizar el estado del robot
        setRobot({ ...currentRobot });
        
        index++;
        executeNextCommand();
      }, 800); // Retraso entre comandos para la animación
    };
    
    executeNextCommand();
  };

  // Reiniciar el juego
  const resetGame = () => {
    setRobot({ x: 0, y: 0, direction: 'right', isMoving: false });
    setCommands([]);
    setModal({ show: false, message: '', success: false, showPath: false });
  };

  // Renderizar un nuevo problema
  const newProblem = () => {
    generateNewProblem();
  };

  // Obtener la clase CSS para la rotación del robot según su dirección
  const getRobotRotationClass = () => {
    switch (robot.direction) {
      case 'up': return 'rotate-0';
      case 'right': return 'rotate-90';
      case 'down': return 'rotate-180';
      case 'left': return 'rotate-negative-90';
      default: return '';
    }
  };

  // Convertir comando a emoji para la visualización
  const commandToEmoji = (command) => {
    switch (command) {
      case 'forward': return '↑';
      case 'turnLeft': return '↰';
      case 'turnRight': return '↱';
      default: return command;
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Juego Educativo del Robot</h1>
      
      <div className="instructions">
        <p>Guía al robot 🤖 hasta la respuesta correcta. ¡Cuidado con los muros 🧱! Siempre hay un camino posible.</p>
      </div>
      
      {/* Problema matemático */}
      <div className="problem-container">
        <h2 className="problem">¿Cuánto es {problem.num1} + {problem.num2}?</h2>
      </div>
      
      {/* Cuadrícula del juego */}
      <div className="grid-container">
        {grid.map((row, y) => (
          <div key={`row-${y}`} className="grid-row">
            {row.map((cell, x) => (
              <div 
                key={`cell-${x}-${y}`} 
                className={`grid-cell 
                  ${robot.x === x && robot.y === y ? 'has-robot' : ''}
                  ${cell === 'wall' ? 'wall-cell' : ''}
                  ${modal.showPath && solutionPath.some(pos => pos.x === x && pos.y === y) ? 'solution-path' : ''}
                `}
              >
                {robot.x === x && robot.y === y ? (
                  <div className={`robot ${getRobotRotationClass()}`}>
                    <span role="img" aria-label="robot">🤖</span>
                  </div>
                ) : cell === 'wall' ? (
                  <div className="wall">
                    <span role="img" aria-label="wall">🧱</span>
                  </div>
                ) : null}
                {cell !== 'wall' && cell !== null && (
                  <span className={`cell-number ${cell === problem.result ? 'correct-answer' : 'incorrect-answer'}`}>
                    {cell}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Controles */}
      <div className="controls-container">
        <button 
          className="control-button"
          onClick={() => addCommand('forward')} 
          disabled={robot.isMoving}
        >
          ↑ Avanzar
        </button>
        <button 
          className="control-button"
          onClick={() => addCommand('turnLeft')} 
          disabled={robot.isMoving}
        >
          ↰ Girar Izquierda
        </button>
        <button 
          className="control-button"
          onClick={() => addCommand('turnRight')} 
          disabled={robot.isMoving}
        >
          ↱ Girar Derecha
        </button>
      </div>
      
      {/* Cola de comandos */}
      <div className="commands-container">
        <h3>Cola de Comandos:</h3>
        <div className="command-queue">
          {commands.length > 0 ? (
            commands.map((cmd, index) => (
              <span key={`cmd-${index}`} className="command-item">
                {commandToEmoji(cmd)}
              </span>
            ))
          ) : (
            <span className="empty-queue">No hay comandos</span>
          )}
        </div>
      </div>
      
      {/* Botones de ejecución y reinicio */}
      <div className="action-buttons">
        <button 
          className="execute-button"
          onClick={executeCommands}
          disabled={commands.length === 0 || robot.isMoving}
        >
          ▶️ Ejecutar
        </button>
        <button 
          className="reset-button"
          onClick={resetGame}
          disabled={robot.isMoving}
        >
          🔁 Reiniciar
        </button>
        <button 
          className="new-problem-button"
          onClick={newProblem}
          disabled={robot.isMoving}
        >
          🔄 Nuevo Problema
        </button>
      </div>
      
      {/* Modal de resultado */}
      {modal.show && (
        <div className="modal-overlay">
          <div className={`modal-content ${modal.success ? 'success' : 'failure'}`}>
            <h2>{modal.message}</h2>
            <p>La respuesta correcta es: {problem.result}</p>
            {modal.success && (
              <p className="path-info">¡El camino óptimo tiene {solutionPath.length - 1} pasos!</p>
            )}
            <div className="modal-buttons">
              <button onClick={resetGame}>Reiniciar</button>
              <button onClick={newProblem}>Nuevo Problema</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
