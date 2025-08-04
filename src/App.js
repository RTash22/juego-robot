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
  
  // Estado para el modo profesor
  const [teacherMode, setTeacherMode] = useState(false);
  
  // Estado para la edición de problemas en modo profesor
  const [teacherProblem, setTeacherProblem] = useState({
    num1: 0,
    num2: 0,
    result: 0
  });
  
  // Estado para la herramienta seleccionada en modo profesor
  const [selectedTool, setSelectedTool] = useState('wall'); // 'wall', 'correct', 'incorrect', 'empty'
  
  // Estado para el modo de juego (individual o 1vs1)
  const [gameMode, setGameMode] = useState('individual'); // 'individual' o '1vs1'
  
  // Estado para el número de rondas en modo 1vs1
  const [rounds, setRounds] = useState(3);
  
  // Estado para los nombres de los jugadores
  const [playerNames, setPlayerNames] = useState({
    player1: 'Jugador 1',
    player2: 'Jugador 2'
  });
  
  // Estado para controlar qué secciones están abiertas en el panel del profesor
  const [openSections, setOpenSections] = useState({
    problemMath: true,
    gameMode: false,
    boardDesign: false,
    roundsDesign: false
  });
  
  // Estado para el puntaje de los jugadores en modo 1vs1
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  
  // Estado para el jugador actual en modo 1vs1
  const [currentPlayer, setCurrentPlayer] = useState('player1');
  
  // Estado para las rondas personalizadas en modo profesor
  const [customRounds, setCustomRounds] = useState([]);
  
  // Estado para la ronda actual que se está editando
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  
  // Estado para indicar si se están usando rondas personalizadas configuradas
  const [usingConfiguredRounds, setUsingConfiguredRounds] = useState(false);
  
  // Estado para llevar el control de la ronda actual en juego
  const [gameRoundIndex, setGameRoundIndex] = useState(0);

  // Generar un nuevo problema de suma al cargar la app
  useEffect(() => {
    if (!teacherMode) {
      generateNewProblem();
    }
  }, [teacherMode]);

  // Generar un nuevo problema de suma y colocar números en la cuadrícula
  const generateNewProblem = () => {
    // Generar números aleatorios entre 1 y 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    const result = num1 + num2;
    
    setProblem({ num1, num2, result });
    
    // Crear la cuadrícula con celdas vacías (todos null)
    // Esto asegura que no haya valores residuales de rondas anteriores
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
            // Actualizar puntuación en modo 1vs1
            if (gameMode === '1vs1') {
              setScores(prev => ({
                ...prev,
                [currentPlayer]: prev[currentPlayer] + 1
              }));
              
              // Verificar si se completaron todas las rondas
              const totalPlays = scores.player1 + scores.player2 + 1;
              const isGameComplete = totalPlays >= rounds * 2;
              
              if (isGameComplete) {
                // Determinar el ganador
                const updatedScores = {
                  ...scores,
                  [currentPlayer]: scores[currentPlayer] + 1
                };
                
                const winnerKey = 
                  updatedScores.player1 > updatedScores.player2 
                    ? 'player1' 
                    : updatedScores.player1 < updatedScores.player2 
                      ? 'player2' 
                      : 'empate';
                
                const pointDifference = Math.abs(updatedScores.player1 - updatedScores.player2);
                const winnerName = winnerKey === 'player1' ? playerNames.player1 : 
                                  winnerKey === 'player2' ? playerNames.player2 : 'Empate';
                
                setModal({
                  show: true,
                  message: winnerKey === 'empate' 
                    ? '¡Juego terminado! ¡Es un empate!'
                    : `¡${winnerName} ha ganado!`,
                  success: true,
                  showPath: true,
                  gameComplete: true,
                  finalScores: updatedScores,
                  winnerKey: winnerKey,
                  pointDifference: pointDifference,
                  winnerName: winnerName
                });
              } else {
                // Cambiar al siguiente jugador
                const nextPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
                setCurrentPlayer(nextPlayer);
                
                setModal({
                  show: true,
                  message: `¡Felicidades, ${currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2}! ¡Has encontrado la respuesta correcta!`,
                  success: true,
                  showPath: true,
                  nextPlayer: nextPlayer === 'player1' ? playerNames.player1 : playerNames.player2
                });
              }
            } else {
              // Modo individual
              setModal({
                show: true,
                message: '¡Felicidades! ¡Has encontrado la respuesta correcta!',
                success: true,
                showPath: true
              });
            }
          } else if (currentCell !== null && currentCell !== 'wall') {
            // Respuesta incorrecta
            if (gameMode === '1vs1') {
              // Cambiar al siguiente jugador en caso de error
              const nextPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
              setCurrentPlayer(nextPlayer);
              
              setModal({
                show: true,
                message: `¡Respuesta incorrecta! Turno de ${nextPlayer === 'player1' ? playerNames.player1 : playerNames.player2}.`,
                success: false,
                nextPlayer: nextPlayer === 'player1' ? playerNames.player1 : playerNames.player2
              });
            } else {
              setModal({
                show: true,
                message: '¡Inténtalo de nuevo! No has encontrado la respuesta correcta.',
                success: false
              });
            }
          } else {
            // Si no está en ninguna casilla con número
            if (gameMode === '1vs1') {
              // Cambiar al siguiente jugador
              const nextPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
              setCurrentPlayer(nextPlayer);
              
              setModal({
                show: true,
                message: `¡Debes llegar a una casilla con número! Turno de ${nextPlayer === 'player1' ? playerNames.player1 : playerNames.player2}.`,
                success: false,
                nextPlayer: nextPlayer === 'player1' ? playerNames.player1 : playerNames.player2
              });
            } else {
              setModal({
                show: true,
                message: '¡Inténtalo de nuevo! Debes llegar a la casilla con la respuesta correcta.',
                success: false
              });
            }
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
    
    // Si estamos usando rondas configuradas, volver a cargar la ronda actual
    if (usingConfiguredRounds && window.gameRounds && window.gameRounds.length > 0) {
      const currentRound = window.gameRounds[gameRoundIndex];
      if (currentRound) {
        // Hacer una copia profunda para evitar modificar la original
        const gridCopy = JSON.parse(JSON.stringify(currentRound.grid));
        setGrid(gridCopy);
        console.log("Restableciendo tablero a configuración original:", gridCopy);
      }
    }
  };

  // Renderizar un nuevo problema
  const newProblem = () => {
    if (usingConfiguredRounds && window.gameRounds && window.gameRounds.length > 0) {
      // En modo de rondas configuradas, avanzamos a la siguiente ronda
      let nextRoundIndex;
      
      if (gameMode === '1vs1') {
        // En modo 1vs1, calculamos la ronda basada en la puntuación total
        const totalPlays = scores.player1 + scores.player2;
        nextRoundIndex = Math.min(totalPlays % window.gameRounds.length, window.gameRounds.length - 1);
      } else {
        // En modo individual, simplemente avanzamos a la siguiente ronda
        nextRoundIndex = (gameRoundIndex + 1) % window.gameRounds.length;
      }
      
      console.log(`Cargando ronda ${nextRoundIndex + 1} de ${window.gameRounds.length}`);
      
      // Cargar la ronda correspondiente
      const nextRound = window.gameRounds[nextRoundIndex];
      
      if (!nextRound) {
        console.error("No se pudo cargar la ronda:", nextRoundIndex);
        alert("Error al cargar la ronda. Volviendo al modo aleatorio.");
        setUsingConfiguredRounds(false);
        generateNewProblem();
        return;
      }
      
      console.log("Cargando ronda configurada:", nextRound);
      
      // Asegurarse de crear copias profundas de los datos
      setProblem(JSON.parse(JSON.stringify(nextRound.problem)));
      
      // Crear una copia profunda de la grid
      const gridCopy = JSON.parse(JSON.stringify(nextRound.grid));
      
      // Asegurar que solo se muestran las respuestas configuradas explícitamente
      // y que no hay valores residuales de rondas anteriores
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          // Solo mantener muros y respuestas (valores numéricos)
          // Todo lo demás será null
          const cell = gridCopy[y][x];
          if (cell !== 'wall' && typeof cell !== 'number') {
            gridCopy[y][x] = null;
          }
        }
      }
      
      setGrid(gridCopy);
      console.log("Grid cargada para juego:", gridCopy);
      
      // Crear una copia del camino solución
      const pathCopy = JSON.parse(JSON.stringify(nextRound.solutionPath));
      setSolutionPath(pathCopy);
      
      setGameRoundIndex(nextRoundIndex);
      
      // Mostrar información de la ronda actual
      const roundName = nextRound.name || `Ronda ${nextRoundIndex + 1}`;
      if (gameMode !== '1vs1') {
        alert(`Cargando ${roundName}`);
      }
      
      console.log("Problema cargado:", nextRound.problem);
      console.log("Grid cargada:", gridCopy);
    } else {
      // Si no estamos en modo de rondas configuradas, generar un problema aleatorio
      generateNewProblem();
    }
    
    // En modo 1vs1, mostrar de quién es el turno
    if (gameMode === '1vs1') {
      const playerName = currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2;
      const roundInfo = usingConfiguredRounds ? 
        ` - ${window.gameRounds[gameRoundIndex].name || `Ronda ${gameRoundIndex + 1}`}` : '';
      alert(`Turno de ${playerName}${roundInfo}`);
    }
  };
  
  // Reiniciar el juego completamente (para modo 1vs1)
  const resetEntireGame = () => {
    resetGame();
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer('player1');
    setGameRoundIndex(0);
    
    // Cargar la primera ronda si estamos usando rondas configuradas
    if (usingConfiguredRounds && window.gameRounds && window.gameRounds.length > 0) {
      const firstRound = window.gameRounds[0];
      
      // Usar JSON.parse/stringify para copias profundas
      setProblem(JSON.parse(JSON.stringify(firstRound.problem)));
      
      // Copiar la grid asegurando que solo se incluyen muros y valores numéricos
      const gridCopy = JSON.parse(JSON.stringify(firstRound.grid));
      
      // Asegurar que solo se muestran las respuestas configuradas explícitamente
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          // Solo mantener muros y respuestas (valores numéricos)
          const cell = gridCopy[y][x];
          if (cell !== 'wall' && typeof cell !== 'number') {
            gridCopy[y][x] = null;
          }
        }
      }
      
      setGrid(gridCopy);
      setSolutionPath(JSON.parse(JSON.stringify(firstRound.solutionPath)));
      
      // Mostrar mensaje con el nombre de la primera ronda
      const roundName = firstRound.name || "Ronda 1";
      alert(`Comenzando partida con ${roundName}`);
    } else {
      generateNewProblem();
    }
    
    // No reiniciamos los nombres de los jugadores para mantener la personalización
  };
  
  // Cambiar entre modo estudiante y modo profesor
  const toggleTeacherMode = () => {
    const newMode = !teacherMode;
    
    // Si está usando rondas configuradas y quiere entrar al modo profesor, confirmar
    if (newMode && usingConfiguredRounds) {
      const confirmChange = window.confirm(
        "Ya tienes rondas configuradas en uso. Si modificas la configuración, se aplicarán los cambios. ¿Deseas continuar?"
      );
      if (!confirmChange) {
        return; // Cancelar el cambio de modo
      }
    }
    
    setTeacherMode(newMode);
    
    if (newMode) {
      // Al entrar en modo profesor, inicializar la cuadrícula vacía si está vacía
      if (grid.length === 0) {
        const emptyGrid = Array(5).fill().map(() => Array(5).fill(null));
        setGrid(emptyGrid);
      }
      
      // Copiar los valores del problema actual al formulario del profesor
      setTeacherProblem({ ...problem });
      
      // Si ya hay rondas configuradas, cargar esas
      if (usingConfiguredRounds && window.gameRounds && window.gameRounds.length > 0) {
        // Hacer copias profundas para evitar problemas de referencia
        setCustomRounds(JSON.parse(JSON.stringify(window.gameRounds)));
        setCurrentRoundIndex(0);
        
        // Cargar la primera ronda para edición
        const firstRound = window.gameRounds[0];
        
        // Crear una copia profunda del grid
        const gridCopy = JSON.parse(JSON.stringify(firstRound.grid));
        
        // Asegurar que las celdas muestran 'correct' e 'incorrect' en lugar de valores numéricos
        // para facilitar la edición
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            const cell = gridCopy[y][x];
            if (typeof cell === 'number') {
              // Si el valor es igual al resultado, marcarlo como 'correct'
              if (cell === parseInt(firstRound.problem.result, 10)) {
                gridCopy[y][x] = 'correct';
              } 
              // Si no, marcarlo como 'incorrect'
              else if (cell !== 'wall') {
                gridCopy[y][x] = 'incorrect';
              }
            }
          }
        }
        
        setGrid(gridCopy);
        setTeacherProblem(JSON.parse(JSON.stringify(firstRound.problem)));
      } 
      // Inicializar las rondas personalizadas si están vacías
      else if (customRounds.length === 0) {
        // Creamos una primera ronda basada en el estado actual
        // Asegurarnos de que la grid es una copia profunda
        const gridCopy = grid.length > 0 ? 
          [...grid.map(row => row ? [...row] : Array(5).fill(null))] : 
          Array(5).fill().map(() => Array(5).fill(null));
          
        const initialRound = {
          grid: gridCopy,
          problem: { ...problem },
          name: "Ronda 1"
        };
        setCustomRounds([initialRound]);
        setCurrentRoundIndex(0);
        
        console.log("Inicializando primera ronda:", initialRound);
      }
    } else {
      // Al salir del modo profesor, aplicar los cambios si la configuración es válida
      validateAndApplyTeacherConfig();
    }
  };
  
  // Manejar cambios en el modo de juego
  const handleGameModeChange = (mode) => {
    setGameMode(mode);
    
    // Si cambia al modo 1vs1, reiniciar puntuaciones
    if (mode === '1vs1') {
      setScores({ player1: 0, player2: 0 });
      setCurrentPlayer('player1');
    }
  };
  
  // Manejar cambios en el número de rondas
  const handleRoundsChange = (e) => {
    const value = parseInt(e.target.value, 10) || 1;
    setRounds(Math.max(1, Math.min(10, value))); // Limitar entre 1 y 10 rondas
  };
  
  // Alternar secciones plegables del panel del profesor
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Añadir una nueva ronda personalizada
  const addCustomRound = () => {
    // Guardar los cambios de la ronda actual antes de crear una nueva
    saveCurrentRoundChanges();
    
    const newRoundNumber = customRounds.length + 1;
    
    // Creamos una ronda con una cuadrícula vacía
    const newGrid = Array(5).fill().map(() => Array(5).fill(null));
    
    const newRound = {
      grid: newGrid,
      problem: { ...teacherProblem },
      name: `Ronda ${newRoundNumber}`
    };
    
    // Añadir la nueva ronda
    const updatedRounds = [...customRounds, newRound];
    setCustomRounds(updatedRounds);
    
    // Cambiar a la nueva ronda
    const newIndex = updatedRounds.length - 1;
    setCurrentRoundIndex(newIndex);
    setGrid(newGrid);
    
    console.log(`Creada nueva ronda ${newRoundNumber}`);
    console.log("Total de rondas:", updatedRounds.length);
  };
  
  // Eliminar una ronda personalizada
  const deleteCustomRound = (index) => {
    if (customRounds.length <= 1) {
      alert("Debe haber al menos una ronda.");
      return;
    }
    
    const newRounds = [...customRounds];
    newRounds.splice(index, 1);
    
    // Ajustar el índice actual si es necesario
    if (currentRoundIndex >= newRounds.length) {
      setCurrentRoundIndex(Math.max(0, newRounds.length - 1));
    }
    
    setCustomRounds(newRounds);
  };
  
  // Cambiar a una ronda específica para editarla
  const selectRound = (index) => {
    if (index >= 0 && index < customRounds.length) {
      // Guardar los cambios actuales antes de cambiar
      saveCurrentRoundChanges();
      
      // Cambiar a la nueva ronda
      setCurrentRoundIndex(index);
      
      // Cargar la configuración de la ronda seleccionada
      const selectedRound = customRounds[index];
      
      // Asegurarse de hacer una copia profunda de la grid
      const gridCopy = selectedRound.grid ? 
        JSON.parse(JSON.stringify(selectedRound.grid)) : 
        Array(5).fill().map(() => Array(5).fill(null));
        
      setGrid(gridCopy);
      setTeacherProblem({ ...selectedRound.problem });
      
      console.log(`Seleccionada ronda ${index + 1} (${selectedRound.name})`);
      console.log("Grid cargada:", gridCopy);
      console.log("Problema cargado:", selectedRound.problem);
    }
  };
  
  // Guardar los cambios de la ronda actual
  const saveCurrentRoundChanges = () => {
    if (currentRoundIndex >= 0 && currentRoundIndex < customRounds.length) {
      // Crear una copia profunda de todas las rondas
      const updatedRounds = JSON.parse(JSON.stringify(customRounds));
      
      // Crear una copia profunda del grid actual
      const gridCopy = JSON.parse(JSON.stringify(grid));
      
      // Limpiar cualquier celda que no sea 'wall', 'correct' o 'incorrect'
      // Esto asegura que solo tengamos las celdas explícitamente configuradas
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const cell = gridCopy[y][x];
          if (cell !== 'wall' && 
              cell !== 'correct' && 
              cell !== 'incorrect' && 
              typeof cell !== 'number') {
            gridCopy[y][x] = null;
          }
        }
      }
      
      // Asegurarse de que el problema tiene el resultado calculado correctamente
      const num1Value = parseInt(teacherProblem.num1, 10) || 0;
      const num2Value = parseInt(teacherProblem.num2, 10) || 0;
      const updatedProblem = { 
        num1: num1Value,
        num2: num2Value,
        result: num1Value + num2Value
      };
      
      updatedRounds[currentRoundIndex] = {
        ...updatedRounds[currentRoundIndex],
        grid: gridCopy,
        problem: updatedProblem
      };
      
      setCustomRounds(updatedRounds);
      // También actualizar el teacherProblem para que refleje el resultado correcto
      setTeacherProblem(updatedProblem);
      
      console.log(`Guardados cambios para ronda ${currentRoundIndex + 1}`);
      console.log("Grid guardada:", gridCopy);
      console.log("Problema guardado:", updatedProblem);
      console.log("Total de rondas:", updatedRounds.length);
    }
  };
  
  // Cambiar el nombre de una ronda
  const updateRoundName = (index, name) => {
    const updatedRounds = [...customRounds];
    updatedRounds[index] = {
      ...updatedRounds[index],
      name
    };
    setCustomRounds(updatedRounds);
  };
  
  // Validar y aplicar la configuración del profesor
  const validateAndApplyTeacherConfig = () => {
    // Guardar los cambios de la ronda actual
    saveCurrentRoundChanges();
    
    console.log("Validando configuración...");
    console.log("Rondas personalizadas:", customRounds);
    
    // Validar cada ronda y crear la configuración final
    const finalRounds = [];
    let allValid = true;
    
    // Función para validar un tablero individual
    const validateBoard = (boardGrid, boardProblem) => {
      // Contar cuántas casillas de respuesta correcta hay
      let correctCount = 0;
      let incorrectCount = 0;
      let hasPath = false;
      
      // Crear una copia del grid
      const currentGrid = [...boardGrid.map(row => [...row])];
      
        // Verificar las respuestas y calcular el resultado
      const resultValue = parseInt(boardProblem.result, 10);
      console.log(`Buscando respuestas en el tablero. Resultado correcto: ${resultValue}`);
      
      // Primero, limpiamos cualquier respuesta numérica que no sea 'correct' o 'incorrect' o 'wall'
      // Esto asegura que solo se mantengan las respuestas explícitamente configuradas
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const cell = currentGrid[y][x];
          // Si es un número y no está explícitamente configurado como correcto o incorrecto, lo limpiamos
          if (typeof cell === 'number') {
            currentGrid[y][x] = null;
          }
        }
      }
      
      // Ahora procesamos solo las celdas explícitamente marcadas
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const cell = currentGrid[y][x];
          
          // Caso 1: Celda marcada explícitamente como "correct"
          if (cell === 'correct') {
            correctCount++;
            console.log(`Encontrada respuesta correcta (marcada) en (${x},${y})`);
            // Asignar el resultado como valor numérico
            currentGrid[y][x] = resultValue;
            console.log(`Asignado valor ${resultValue} a la celda correcta`);
          } 
          // Caso 2: Celda marcada explícitamente como "incorrect"
          else if (cell === 'incorrect') {
            incorrectCount++;
            console.log(`Encontrada respuesta incorrecta en (${x},${y})`);
            // Generar un valor incorrecto (diferente al resultado)
            let incorrectValue;
            do {
              incorrectValue = Math.floor(Math.random() * 50) + 1;
            } while (incorrectValue === resultValue);
            currentGrid[y][x] = incorrectValue;
            console.log(`Asignado valor ${incorrectValue} a la celda incorrecta`);
          }
        }
      }
      
      console.log(`Conteo final: ${correctCount} celdas correctas, ${incorrectCount} celdas incorrectas`);
      console.log("Grid después de procesar respuestas:", currentGrid);      
      
      // Si hay exactamente una respuesta correcta e incorrecta, actualizar el estado
      if (correctCount === 1 && incorrectCount >= 1) {
        console.log("Configuración válida: 1 respuesta correcta y al menos 1 incorrecta");
        console.log("Problema a validar:", boardProblem);
        
        // Verificar si hay un camino a la respuesta correcta
        const visited = Array(5).fill().map(() => Array(5).fill(false));
        let correctX, correctY;
        
        // Buscar la posición de la respuesta correcta
        console.log("Buscando posición de la respuesta correcta para validación de camino...");
        const resultValue = parseInt(boardProblem.result, 10);
        
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            // Verificar el valor numérico (la celda 'correct' ya debería haberse convertido a número)
            const cellValue = currentGrid[y][x];
            
            if (cellValue === resultValue) {
              correctX = x;
              correctY = y;
              console.log(`Encontrada respuesta correcta para validación en (${x},${y}), valor: ${cellValue}`);
              break;
            }
          }
          if (correctX !== undefined) break;
        }
        
        // Verificación adicional para debugging
        if (correctX === undefined || correctY === undefined) {
          console.error("No se encontró la respuesta correcta en el tablero.");
          console.log("Grid completa:", currentGrid);
          console.log("Buscando valor:", resultValue);
        }
        
        // Si no se encontró la respuesta correcta, es un error
        if (correctX === undefined || correctY === undefined) {
          return { isValid: false, error: "No se pudo encontrar la posición de la respuesta correcta." };
        }
        
        // Función para verificar si una celda es válida para moverse
        const isSafe = (x, y) => {
          return (
            x >= 0 && x < 5 && y >= 0 && y < 5 && 
            !visited[y][x] && 
            currentGrid[y][x] !== 'wall'
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
        
        // Calcular el camino solución
        const finalPath = [{ x: 0, y: 0 }]; // Incluimos la posición inicial
        hasPath = findPath(0, 0, correctX, correctY, finalPath);
        
        if (hasPath) {
          console.log("Camino encontrado a la respuesta correcta:", finalPath);
          console.log("Grid final validada:", currentGrid);
          
          // Si hay un camino, retornamos la configuración final y el camino
          return {
            grid: currentGrid,
            problem: boardProblem,
            solutionPath: finalPath,
            isValid: true
          };
        } else {
          console.error("No se encontró un camino a la respuesta correcta");
          return { isValid: false, error: "No hay un camino válido a la respuesta correcta." };
        }
      } else if (correctCount !== 1) {
        return { isValid: false, error: "Debe haber exactamente una respuesta correcta." };
      } else if (incorrectCount < 1) {
        return { isValid: false, error: "Debe haber al menos una respuesta incorrecta." };
      }
      
      return { isValid: false, error: "Configuración inválida." };
    };
    
    // Validar cada ronda
    for (let i = 0; i < customRounds.length; i++) {
      const round = customRounds[i];
      console.log(`Validando ronda ${i + 1} (${round.name}):`);
      console.log("Grid:", round.grid);
      console.log("Problema:", round.problem);
      
      const validationResult = validateBoard(round.grid, round.problem);
      
      if (!validationResult.isValid) {
        console.error(`Error en ronda ${i + 1}:`, validationResult.error);
        alert(`Error en ${round.name}: ${validationResult.error}`);
        allValid = false;
        setCurrentRoundIndex(i);
        
        // Cargar la ronda con error para que el usuario pueda corregirla
        setGrid([...round.grid.map(row => [...row])]);
        setTeacherProblem({ ...round.problem });
        
        break;
      }
      
      console.log(`Ronda ${i + 1} válida. Solución:`, validationResult.solutionPath);
      
      finalRounds.push({
        grid: validationResult.grid,
        problem: validationResult.problem,
        solutionPath: validationResult.solutionPath,
        name: round.name
      });
    }
    
    if (allValid) {
      // Si todas las rondas son válidas, actualizar el estado y comenzar con la primera ronda
      // Aquí podemos ajustar el número de rondas según el modo de juego
      setRounds(customRounds.length); 
      
      // Cargar la primera ronda
      const firstRound = finalRounds[0];
      setProblem(JSON.parse(JSON.stringify(firstRound.problem)));
      
      // Hacer una copia profunda usando JSON parse/stringify para evitar referencias
      const gridCopy = JSON.parse(JSON.stringify(firstRound.grid));
      setGrid(gridCopy);
      
      // Copiar camino solución
      setSolutionPath(JSON.parse(JSON.stringify(firstRound.solutionPath)));
      
      // Activar el modo de rondas configuradas
      setUsingConfiguredRounds(true);
      setGameRoundIndex(0);
      
      // Guardar todas las rondas configuradas usando JSON para asegurar copias profundas
      window.gameRounds = JSON.parse(JSON.stringify(finalRounds));
      
      // Mostrar mensaje de confirmación
      alert("Configuración guardada. El juego ahora usará las rondas personalizadas.");
      return true;
    }
    
    return false;
  };
  
  // Manejar clics en la cuadrícula en modo profesor
  const handleCellClick = (x, y) => {
    if (!teacherMode || (x === 0 && y === 0)) return; // No permitir editar la casilla inicial
    
    const newGrid = [...grid.map(row => [...row])];
    
    switch (selectedTool) {
      case 'wall':
        newGrid[y][x] = 'wall';
        console.log(`Colocando muro en (${x},${y})`);
        break;
      case 'correct':
        // Eliminar cualquier otra respuesta correcta primero
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 5; j++) {
            if (newGrid[i][j] === 'correct' || newGrid[i][j] === parseInt(teacherProblem.result, 10)) {
              console.log(`Eliminando respuesta correcta previa en (${j},${i})`);
              newGrid[i][j] = null;
            }
          }
        }
        newGrid[y][x] = 'correct';
        console.log(`Colocando respuesta correcta en (${x},${y}), valor: ${teacherProblem.result}`);
        break;
      case 'incorrect':
        // Si ya había una respuesta correcta en esta posición, eliminarla
        if (newGrid[y][x] === 'correct' || newGrid[y][x] === parseInt(teacherProblem.result, 10)) {
          console.log(`Reemplazando respuesta correcta con incorrecta en (${x},${y})`);
        }
        newGrid[y][x] = 'incorrect';
        console.log(`Colocando respuesta incorrecta en (${x},${y})`);
        break;
      case 'empty':
        newGrid[y][x] = null;
        console.log(`Limpiando celda en (${x},${y})`);
        break;
      default:
        break;
    }
    
    // Actualizar la grid directamente
    setGrid([...newGrid]);
    
    // También actualizar la ronda actual en customRounds
    if (customRounds.length > 0) {
      console.log(`Actualizando ronda ${currentRoundIndex + 1} con nuevos cambios de celda en (${x},${y}): ${selectedTool}`);
      console.log("Grid actualizada:", newGrid);
      
      // Limpiar cualquier valor residual que no sea wall, correct o incorrect
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          if (newGrid[i][j] !== 'wall' && 
              newGrid[i][j] !== 'correct' && 
              newGrid[i][j] !== 'incorrect' && 
              typeof newGrid[i][j] !== 'number') {
            newGrid[i][j] = null;
          }
        }
      }
      
      // Guardar cambio inmediatamente para asegurar consistencia
      // Usamos JSON para crear una copia profunda y evitar problemas de referencia
      const updatedRounds = JSON.parse(JSON.stringify(customRounds));
      updatedRounds[currentRoundIndex] = {
        ...updatedRounds[currentRoundIndex],
        grid: JSON.parse(JSON.stringify(newGrid))
      };
      setCustomRounds(updatedRounds);
      
      // Actualizamos directamente en saveCurrentRoundChanges en vez de aquí
      saveCurrentRoundChanges();
    }
  };
  
  // Manejar cambios en el problema del profesor
  const handleProblemChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10) || 0;
    
    if (name === 'num1' || name === 'num2') {
      const otherField = name === 'num1' ? 'num2' : 'num1';
      const otherValue = teacherProblem[otherField];
      setTeacherProblem({
        ...teacherProblem,
        [name]: numValue,
        result: numValue + otherValue
      });
    }
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
      <div className="app-header">
        <h1 className="app-title">Juego Educativo del Robot</h1>
        <div className="header-buttons">
          {usingConfiguredRounds && !teacherMode && (
            <div className="configured-mode-indicator">
              <span className="mode-label">Modo Rondas Configuradas</span>
              <button 
                className="reset-mode-button"
                onClick={() => {
                  if (confirm("¿Deseas desactivar las rondas configuradas y volver al modo aleatorio?")) {
                    setUsingConfiguredRounds(false);
                    generateNewProblem();
                  }
                }}
              >
                🔄 Volver a modo aleatorio
              </button>
            </div>
          )}
          <button 
            className={`teacher-mode-button ${teacherMode ? 'active' : ''}`} 
            onClick={toggleTeacherMode}
          >
            {teacherMode ? '👨‍🎓 Modo Estudiante' : '👨‍🏫 Modo Profesor'}
          </button>
        </div>
      </div>
      
      {teacherMode ? (
        <div className="teacher-panel">
          <h3>Panel del Profesor</h3>
          
          {/* Configuración del problema matemático */}
          <div className="teacher-section">
            <div 
              className="teacher-section-header" 
              onClick={() => toggleSection('problemMath')}
            >
              <h4>Problema Matemático</h4>
              <span className={`section-toggle-icon ${openSections.problemMath ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`teacher-section-content ${openSections.problemMath ? 'open' : ''}`}>
              <div className="teacher-form">
                <div className="form-group">
                  <label htmlFor="num1">Primer número:</label>
                  <input 
                    type="number" 
                    id="num1" 
                    name="num1" 
                    value={teacherProblem.num1} 
                    onChange={handleProblemChange}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="num2">Segundo número:</label>
                  <input 
                    type="number" 
                    id="num2" 
                    name="num2" 
                    value={teacherProblem.num2} 
                    onChange={handleProblemChange}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="form-group">
                  <label>Resultado:</label>
                  <span className="result-display">{teacherProblem.result}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Configuración del modo de juego */}
          <div className="teacher-section">
            <div 
              className="teacher-section-header"
              onClick={() => toggleSection('gameMode')}
            >
              <h4>Modo de Juego</h4>
              <span className={`section-toggle-icon ${openSections.gameMode ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`teacher-section-content ${openSections.gameMode ? 'open' : ''}`}>
              <div className="game-mode-selector">
                <button 
                  className={`mode-button ${gameMode === 'individual' ? 'selected' : ''}`}
                  onClick={() => handleGameModeChange('individual')}
                >
                  👤 Individual
                </button>
                <button 
                  className={`mode-button ${gameMode === '1vs1' ? 'selected' : ''}`}
                  onClick={() => handleGameModeChange('1vs1')}
                >
                  👥 1 vs 1
                </button>
              </div>
              
              {gameMode === '1vs1' && (
                <>
                  <div className="rounds-selector">
                    <label htmlFor="rounds">Número de rondas:</label>
                    <input 
                      type="number" 
                      id="rounds" 
                      value={rounds} 
                      onChange={handleRoundsChange}
                      min="1"
                      max="10"
                    />
                    <span className="rounds-info">
                      (Cada jugador jugará {rounds} veces, total: {rounds * 2} turnos)
                    </span>
                  </div>
                  
                  <div className="player-names-container">
                    <div className="player-name-input">
                      <label htmlFor="player1name">Nombre Jugador 1:</label>
                      <input 
                        type="text" 
                        id="player1name" 
                        value={playerNames.player1} 
                        onChange={(e) => setPlayerNames({...playerNames, player1: e.target.value})}
                        placeholder="Jugador 1"
                        maxLength="15"
                      />
                    </div>
                    <div className="player-name-input">
                      <label htmlFor="player2name">Nombre Jugador 2:</label>
                      <input 
                        type="text" 
                        id="player2name" 
                        value={playerNames.player2} 
                        onChange={(e) => setPlayerNames({...playerNames, player2: e.target.value})}
                        placeholder="Jugador 2"
                        maxLength="15"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Configuración de rondas */}
          <div className="teacher-section">
            <div 
              className="teacher-section-header"
              onClick={() => toggleSection('roundsDesign')}
            >
              <h4>Configuración de Rondas</h4>
              <span className={`section-toggle-icon ${openSections.roundsDesign ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`teacher-section-content ${openSections.roundsDesign ? 'open' : ''}`}>
              <div className="rounds-manager">
                <div className="rounds-list">
                  {customRounds.map((round, index) => (
                    <div 
                      key={`round-${index}`} 
                      className={`round-item ${currentRoundIndex === index ? 'active' : ''}`}
                    >
                      <input 
                        type="text" 
                        value={round.name} 
                        onChange={(e) => updateRoundName(index, e.target.value)}
                        className="round-name-input"
                      />
                      <div className="round-actions">
                        <button 
                          className="round-select-btn"
                          onClick={() => selectRound(index)}
                        >
                          Editar
                        </button>
                        <button 
                          className="round-delete-btn"
                          onClick={() => deleteCustomRound(index)}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounds-controls">
                  <button className="add-round-btn" onClick={addCustomRound}>
                    + Añadir Ronda
                  </button>
                  <p className="rounds-info">
                    Total de rondas: {customRounds.length} (Cada jugador jugará cada ronda una vez)
                  </p>
                </div>
                <p className="rounds-instructions">
                  <strong>Instrucciones:</strong> Configura cada ronda con su propio problema y diseño de tablero. 
                  Cambia entre rondas para editarlas individualmente.
                </p>
              </div>
            </div>
          </div>
          
          {/* Herramientas para el diseño del tablero */}
          <div className="teacher-section">
            <div 
              className="teacher-section-header"
              onClick={() => toggleSection('boardDesign')}
            >
              <h4>Diseño del Tablero {customRounds[currentRoundIndex]?.name || ''}</h4>
              <span className={`section-toggle-icon ${openSections.boardDesign ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            
            <div className={`teacher-section-content ${openSections.boardDesign ? 'open' : ''}`}>
              <div className="teacher-tools">
                <div className="tool-buttons">
                  <button 
                    className={`tool-button ${selectedTool === 'wall' ? 'selected' : ''}`}
                    onClick={() => setSelectedTool('wall')}
                  >
                    🧱 Muro
                  </button>
                  <button 
                    className={`tool-button ${selectedTool === 'correct' ? 'selected' : ''}`}
                    onClick={() => setSelectedTool('correct')}
                  >
                    ✅ Respuesta Correcta
                  </button>
                  <button 
                    className={`tool-button ${selectedTool === 'incorrect' ? 'selected' : ''}`}
                    onClick={() => setSelectedTool('incorrect')}
                  >
                    ❌ Respuesta Incorrecta
                  </button>
                  <button 
                    className={`tool-button ${selectedTool === 'empty' ? 'selected' : ''}`}
                    onClick={() => setSelectedTool('empty')}
                  >
                    🧹 Borrar
                  </button>
                </div>
                <div className="teacher-instructions">
                  <p><strong>Instrucciones:</strong> Haz clic en las celdas para colocar muros, respuestas correctas e incorrectas. La casilla (0,0) no se puede modificar.</p>
                  <p>Debe haber exactamente 1 respuesta correcta, al menos 1 incorrecta y un camino válido.</p>
                </div>
                
                {/* Cuadrícula del juego en modo profesor */}
                <div className="grid-container teacher-grid">
                  {grid.map((row, y) => (
                    <div key={`row-${y}`} className="grid-row">
                      {row.map((cell, x) => (
                        <div 
                          key={`cell-${x}-${y}`} 
                          className={`grid-cell 
                            ${robot.x === x && robot.y === y ? 'has-robot' : ''}
                            ${cell === 'wall' ? 'wall-cell' : ''}
                            ${cell === 'correct' ? 'correct-cell' : ''}
                            ${cell === 'incorrect' ? 'incorrect-cell' : ''}
                            ${modal.showPath && solutionPath.some(pos => pos.x === x && pos.y === y) ? 'solution-path' : ''}
                            teacher-grid-cell
                          `}
                          onClick={() => handleCellClick(x, y)}
                        >
                          {/* Coordenadas en modo profesor */}
                          <div className="cell-coords">
                            {x},{y}
                          </div>
                          
                          {/* Contenido de la celda */}
                          {cell === 'wall' ? (
                            <div className="wall">
                              <span role="img" aria-label="wall">🧱</span>
                            </div>
                          ) : cell === 'correct' ? (
                            <div className="correct-indicator">
                              <span role="img" aria-label="correct">✅</span>
                            </div>
                          ) : cell === 'incorrect' ? (
                            <div className="incorrect-indicator">
                              <span role="img" aria-label="incorrect">❌</span>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="teacher-validate">
            <button 
              className="validate-button"
              onClick={validateAndApplyTeacherConfig}
            >
              ✓ Validar Configuración
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="instructions">
            <p>Guía al robot 🤖 hasta la respuesta correcta. ¡Cuidado con los muros 🧱! Siempre hay un camino posible.</p>
          </div>
          
          {/* Mostrar información del modo 1vs1 si está activo */}
          {gameMode === '1vs1' && (
            <div className={`game-status player-${currentPlayer}-turn`}>
              <div className="player-info">
                <div className={`player-score ${currentPlayer === 'player1' ? 'current-player' : ''}`}>
                  <div className="player-avatar player1-avatar">👤</div>
                  <div className="player-details">
                    <span className="player-name">{playerNames.player1}</span>
                    <span className="score-value">{scores.player1}</span>
                  </div>
                </div>
                
                <div className="round-counter">
                  Ronda: {Math.floor((scores.player1 + scores.player2) / 2) + 1} de {rounds}
                </div>
                
                <div className={`player-score ${currentPlayer === 'player2' ? 'current-player' : ''}`}>
                  <div className="player-avatar player2-avatar">👤</div>
                  <div className="player-details">
                    <span className="player-name">{playerNames.player2}</span>
                    <span className="score-value">{scores.player2}</span>
                  </div>
                </div>
              </div>
              
              <div className="turn-banner">
                Turno de: <strong>{currentPlayer === 'player1' ? playerNames.player1 : playerNames.player2}</strong>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Problema matemático */}
      <div className="problem-container">
        {usingConfiguredRounds && !teacherMode && (
          <div className="current-round-indicator">
            {window.gameRounds && window.gameRounds[gameRoundIndex] && 
              window.gameRounds[gameRoundIndex].name || `Ronda ${gameRoundIndex + 1}`}
          </div>
        )}
        <h2 className="problem">¿Cuánto es {teacherMode ? teacherProblem.num1 : problem.num1} + {teacherMode ? teacherProblem.num2 : problem.num2}?</h2>
      </div>
      
      {/* Cuadrícula del juego - solo visible en modo estudiante */}
      {!teacherMode && (
        <div className="grid-container">
          {grid.map((row, y) => (
            <div key={`row-${y}`} className="grid-row">
              {row.map((cell, x) => (
                <div 
                  key={`cell-${x}-${y}`} 
                  className={`grid-cell 
                    ${robot.x === x && robot.y === y ? 'has-robot' : ''}
                    ${cell === 'wall' ? 'wall-cell' : ''}
                    ${cell === 'correct' ? 'correct-cell' : ''}
                    ${cell === 'incorrect' ? 'incorrect-cell' : ''}
                    ${modal.showPath && solutionPath.some(pos => pos.x === x && pos.y === y) ? 'solution-path' : ''}
                  `}
                  onClick={() => handleCellClick(x, y)}
                >
                  {/* Robot */}
                  {robot.x === x && robot.y === y && (
                    <div className={`robot ${getRobotRotationClass()}`}>
                      <span role="img" aria-label="robot">🤖</span>
                    </div>
                  )}
                  
                  {/* Contenido de la celda en modo estudiante */}
                  {cell === 'wall' ? (
                    <div className="wall">
                      <span role="img" aria-label="wall">🧱</span>
                    </div>
                  ) : null}
                  
                  {/* Números en modo estudiante */}
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
      )}
      
      {/* Controles - solo visibles en modo estudiante */}
      {!teacherMode && (
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
      )}
      
      {/* Cola de comandos - solo visible en modo estudiante */}
      {!teacherMode && (
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
      )}
      
      {/* Botones de ejecución y reinicio - habilitados solo en modo estudiante */}
      <div className="action-buttons">
        {!teacherMode ? (
          <>
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
          </>
        ) : (
          <button 
            className="apply-config-button"
            onClick={() => {
              if (validateAndApplyTeacherConfig()) {
                setTeacherMode(false);
                
                // Mostrar información sobre las rondas configuradas
                if (customRounds.length > 0) {
                  const roundsNames = customRounds.map(r => r.name).join(", ");
                  alert(`¡Configuración aplicada con éxito! Se han configurado ${customRounds.length} rondas: ${roundsNames}. El juego ahora usará estas rondas.`);
                } else {
                  alert("¡Configuración aplicada con éxito! Cambiando al modo estudiante.");
                }
              }
            }}
          >
            ✅ Aplicar y cambiar a modo estudiante
          </button>
        )}
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
            
            {/* Información adicional para el modo 1vs1 */}
            {gameMode === '1vs1' && !modal.gameComplete && modal.nextPlayer && (
              <div className="next-player-info">
                <p>Siguiente turno: {modal.nextPlayer}</p>
              </div>
            )}
            
            {/* Información de fin de juego para modo 1vs1 */}
            {modal.gameComplete && modal.finalScores && (
              <div className="final-scores">
                <h3>¡Juego Terminado!</h3>
                
                {modal.winnerKey !== 'empate' && (
                  <div className="player-winner">
                    🏆 {modal.winnerName} ganó por {modal.pointDifference} puntos 🏆
                  </div>
                )}
                
                <div className="score-table">
                  <div className={`score-row ${modal.winnerKey === 'player1' ? 'winner-row' : ''}`}>
                    <span className="player-name">{playerNames.player1}</span>
                    <span className="final-score">{modal.finalScores.player1}</span>
                    {modal.winnerKey === 'player1' && <span className="winner-trophy">🏆</span>}
                  </div>
                  <div className={`score-row ${modal.winnerKey === 'player2' ? 'winner-row' : ''}`}>
                    <span className="player-name">{playerNames.player2}</span>
                    <span className="final-score">{modal.finalScores.player2}</span>
                    {modal.winnerKey === 'player2' && <span className="winner-trophy">🏆</span>}
                  </div>
                </div>
                
                {modal.winnerKey === 'empate' && (
                  <div className="tie-message">¡El juego terminó en empate!</div>
                )}
              </div>
            )}
            
            <div className="modal-buttons">
              <button onClick={resetGame}>Reiniciar</button>
              {gameMode === '1vs1' && modal.gameComplete ? (
                <button onClick={resetEntireGame}>Nuevo Juego</button>
              ) : (
                <button onClick={newProblem}>Nuevo Problema</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
