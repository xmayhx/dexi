import { useEffect, useState, useRef, useCallback } from 'react';
import { initScene, cleanup, checkProximity, LocationType } from './game/engine';

type Screen = 'intro' | 'world' | 'hut_enter' | 'hut_inside' | 'stone' | 'gaming' | 'nyan';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screen, setScreen] = useState<Screen>('intro');
  const [hoveredLocation, setHoveredLocation] = useState<LocationType>(null);
  const [dialogText, setDialogText] = useState('');
  const [showControls, setShowControls] = useState(true);

  const handleLocationEnter = useCallback((loc: LocationType) => {
    if (!loc) return;
    switch (loc) {
      case 'hut':
        setScreen('hut_enter');
        break;
      case 'stone':
        setScreen('stone');
        break;
      case 'gaming':
        setScreen('gaming');
        break;
      case 'portal':
        setScreen('nyan');
        break;
    }
  }, []);

  const handleLocationHover = useCallback((loc: LocationType) => {
    setHoveredLocation(loc);
    switch (loc) {
      case 'hut':
        setDialogText('🏚️ Избушка — постучаться?');
        break;
      case 'stone':
        setDialogText('🪨 Камень на распутье...');
        break;
      case 'gaming':
        setDialogText('🌀 Игровая — порталы в другие миры');
        break;
      case 'portal':
        setDialogText('✨ Что-то мерцает между деревьями...');
        break;
      default:
        setDialogText('');
    }
  }, []);

  useEffect(() => {
    if (screen === 'world' && canvasRef.current) {
      initScene(canvasRef.current, handleLocationEnter, handleLocationHover);
      
      // Hide controls after 8 seconds
      const timer = setTimeout(() => setShowControls(false), 8000);
      
      return () => {
        cleanup();
        clearTimeout(timer);
      };
    }
  }, [screen, handleLocationEnter, handleLocationHover]);

  // Proximity check loop
  useEffect(() => {
    if (screen !== 'world') return;
    const interval = setInterval(() => {
      const loc = checkProximity();
      if (loc) {
        // Visual hint
      }
    }, 500);
    return () => clearInterval(interval);
  }, [screen]);

  // ===== INTRO SCREEN =====
  if (screen === 'intro') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050508] relative overflow-hidden">
        {/* Stars */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        {/* Title */}
        <div className="relative z-10 text-center px-4">
          <h1 className="pixel-text text-3xl md:text-5xl text-[#c8b89a] mb-4 tracking-wider">
            ⚔️ ПУТЕШЕСТВИЕ ПО ГОЛОВЕ ⚔️
          </h1>
          <p className="pixel-text text-sm md:text-lg text-[#6a5a4a] mb-2">
            Dark Fantasy World
          </p>
          <p className="pixel-text text-xs text-[#4a3a2a] mb-8">
            ...где тьма хранит тайны, а глаза наблюдают из темноты
          </p>

          <button
            onClick={() => setScreen('world')}
            className="pixel-text px-8 py-3 bg-[#1a1a2e] border-2 border-[#4a3728] 
                       text-[#c8b89a] hover:bg-[#2a2a3e] hover:border-[#6a5738]
                       transition-all duration-300 cursor-pointer text-lg
                       shadow-[0_0_20px_rgba(74,55,40,0.3)]"
          >
            ▶ ВОЙТИ В МИР
          </button>

          <p className="pixel-text text-xs text-[#3a2a1a] mt-6">
            WASD — движение | Клик — взаимодействие
          </p>
        </div>

        {/* Floating eyes in intro */}
        <div className="absolute top-[20%] left-[10%] animate-pulse opacity-50">
          <span className="text-red-500 text-lg">● ●</span>
        </div>
        <div className="absolute top-[60%] right-[15%] animate-pulse opacity-30" style={{ animationDelay: '2s' }}>
          <span className="text-yellow-500 text-sm">● ●</span>
        </div>
      </div>
    );
  }

  // ===== NYAN CAT SCREEN =====
  if (screen === 'nyan') {
    setTimeout(() => {
      window.location.href = 'https://neocities.org';
    }, 3000);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#000033] relative overflow-hidden">
        {/* Rainbow trail */}
        <div className="absolute inset-0 flex flex-col">
          {['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'].map((color, i) => (
            <div key={i} className="flex-1 opacity-30" style={{ background: color }} />
          ))}
        </div>

        {/* Nyan Cat ASCII/Pixel art */}
        <div className="relative z-10 text-center animate-float">
          <div className="pixel-text text-6xl mb-4">🐱</div>
          <div className="pixel-text text-2xl text-white mb-2">NYAN NYAN NYAN~</div>
          <div className="pixel-text text-sm text-pink-300">
            ✨ Добро пожаловать в IndieWeb! ✨
          </div>
          <div className="pixel-text text-xs text-gray-400 mt-4">
            Перенаправление на Neocities...
          </div>
          
          {/* Pixel rainbow trail behind cat */}
          <div className="flex justify-center mt-4 gap-0">
            {['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'].map((color, i) => (
              <div key={i} className="w-8 h-2" style={{ background: color }} />
            ))}
          </div>
        </div>

        {/* Stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        <button
          onClick={() => setScreen('world')}
          className="absolute bottom-8 pixel-text text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          [Вернуться]
        </button>
      </div>
    );
  }

  // ===== HUT ENTER ANIMATION =====
  if (screen === 'hut_enter') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0805] relative">
        <div className="text-center animate-flicker">
          <div className="pixel-text text-4xl mb-6">🚪</div>
          <p className="pixel-text text-[#c8b89a] text-lg mb-4">*тук-тук*</p>
          <p className="pixel-text text-[#8a7a5a] text-sm mb-2">Дверь скрипит...</p>
          <p className="pixel-text text-[#6a5a3a] text-xs mb-8">Вас приглашают войти...</p>
          
          <div className="w-32 h-1 bg-[#1a1a1a] mx-auto mb-4 overflow-hidden">
            <div className="h-full bg-[#ff8833] animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>

        <button
          onClick={() => setScreen('hut_inside')}
          className="pixel-text px-6 py-2 bg-[#1a1008] border border-[#4a3728] 
                     text-[#c8b89a] hover:bg-[#2a2018] cursor-pointer mt-8
                     animate-flicker"
        >
          Войти...
        </button>

        <button
          onClick={() => setScreen('world')}
          className="absolute bottom-8 pixel-text text-xs text-gray-600 hover:text-white transition-colors cursor-pointer"
        >
          [Назад]
        </button>
      </div>
    );
  }

  // ===== HUT INSIDE (BLOG) =====
  if (screen === 'hut_inside') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0f0a05] relative">
        {/* Interior ambiance */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f05] to-[#0a0500]" />
        
        {/* Fireplace glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#ff8833] opacity-5 blur-3xl rounded-full" />

        <div className="relative z-10 text-center max-w-lg px-4">
          {/* Rocking chair */}
          <div className="pixel-text text-5xl mb-4 animate-float" style={{ animationDuration: '4s' }}>
            🪑
          </div>
          
          <p className="pixel-text text-[#c8b89a] text-sm mb-6">
            Вас усаживают в кресло-качалку...<br/>
            <span className="text-[#8a7a5a]">...и вручают газету</span>
          </p>

          {/* Newspaper */}
          <div className="dialog-box relative mx-auto max-w-md">
            <div className="text-center mb-4">
              <h2 className="pixel-text text-xl text-[#c8b89a] border-b border-[#4a3728] pb-2">
                📰 THE DARK CHRONICLES
              </h2>
              <p className="pixel-text text-xs text-[#6a5a4a] mt-1">
                Новости из глубин сознания
              </p>
            </div>

            <div className="space-y-3 text-left">
              <div className="border-b border-[#2a2018] pb-2">
                <h3 className="pixel-text text-sm text-[#ff8833]">Последняя запись</h3>
                <p className="pixel-text text-xs text-[#8a7a5a] mt-1">
                  Добро пожаловать в мой блог! Здесь я делюсь мыслями, 
                  проектами и всем, что приходит в голову... буквально.
                </p>
              </div>
              
              <div className="border-b border-[#2a2018] pb-2">
                <h3 className="pixel-text text-sm text-[#c8b89a]">О сайте</h3>
                <p className="pixel-text text-xs text-[#6a5a4a] mt-1">
                  Этот мир — путешествие по моей голове. 
                  Каждая локация — часть моего внутреннего пространства.
                </p>
              </div>

              <div className="text-center mt-4">
                <p className="pixel-text text-xs text-[#4a3a2a]">
                  [Блог скоро будет здесь]
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen('world')}
          className="absolute bottom-8 pixel-text text-sm text-[#6a5a4a] hover:text-[#c8b89a] 
                     transition-colors cursor-pointer z-20"
        >
          ← Выйти из избушки
        </button>
      </div>
    );
  }

  // ===== STONE (CONTACTS) =====
  if (screen === 'stone') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#050510] relative">
        {/* Mystical background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1a1a4a] opacity-10 blur-3xl rounded-full" />
        </div>

        <div className="relative z-10 text-center max-w-md px-4">
          {/* Stone */}
          <div className="pixel-text text-6xl mb-6">🪨</div>
          
          <h2 className="pixel-text text-2xl text-[#8888ff] mb-2 glow-text">
            КАМЕНЬ НА РАСПУТЬЕ
          </h2>
          <p className="pixel-text text-xs text-[#6666aa] mb-8">
            Древние руны светятся на поверхности...
          </p>

          {/* Contacts */}
          <div className="dialog-box relative">
            <h3 className="pixel-text text-lg text-[#c8b89a] mb-4 text-center">
              📜 Надписи на камне:
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 justify-center">
                <span className="pixel-text text-2xl">💬</span>
                <div className="text-left">
                  <p className="pixel-text text-xs text-[#6a5a4a]">Telegram:</p>
                  <a 
                    href="https://t.me/dexid3x1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="pixel-text text-sm text-[#88aaff] hover:text-[#aaccff] 
                               transition-colors underline"
                  >
                    @dexid3x1
                  </a>
                </div>
              </div>

              <div className="border-t border-[#2a2038] pt-3">
                <div className="flex items-center gap-3 justify-center">
                  <span className="pixel-text text-2xl">🌐</span>
                  <div className="text-left">
                    <p className="pixel-text text-xs text-[#6a5a4a]">Сайт:</p>
                    <p className="pixel-text text-sm text-[#c8b89a]">
                      Этот самый мир, в котором ты сейчас
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rune decorations */}
            <div className="mt-4 text-center pixel-text text-[#4444aa] text-xs opacity-50">
              ᚱ ᚢ ᚦ ᛖ ᚱ ᛊ
            </div>
          </div>

          {/* Direction signs */}
          <div className="mt-6 flex gap-4 justify-center">
            <div className="pixel-text text-xs text-[#ff8833] animate-flicker">
              ← В лес (избушка) 🌲
            </div>
            <div className="pixel-text text-xs text-[#8833ff]">
              Игровая → 🌀
            </div>
          </div>
        </div>

        <button
          onClick={() => setScreen('world')}
          className="absolute bottom-8 pixel-text text-sm text-[#6666aa] hover:text-[#8888ff] 
                     transition-colors cursor-pointer z-20"
        >
          ← Отойти от камня
        </button>
      </div>
    );
  }

  // ===== GAMING =====
  if (screen === 'gaming') {
    const gamePortals = [
      { name: 'Slither.io', url: 'https://slither.io', color: '#33ff33', emoji: '🐍' },
      { name: 'Krunker.io', url: 'https://krunker.io', color: '#ff3333', emoji: '🔫' },
      { name: 'Agar.io', url: 'https://agar.io', color: '#3333ff', emoji: '⚪' },
      { name: '2048', url: 'https://play2048.co', color: '#ffaa33', emoji: '🔢' },
      { name: 'Chess.com', url: 'https://chess.com', color: '#aa8833', emoji: '♟️' },
    ];

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0520] relative overflow-hidden">
        {/* Portal background effect */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] 
                          bg-[#6622cc] opacity-10 blur-3xl rounded-full animate-pulse" />
        </div>

        <div className="relative z-10 text-center max-w-lg px-4">
          <div className="pixel-text text-5xl mb-4 animate-float">🌀</div>
          
          <h2 className="pixel-text text-2xl text-[#aa66ff] mb-2 glow-text">
            ИГРОВАЯ
          </h2>
          <p className="pixel-text text-xs text-[#7744aa] mb-8">
            Выбери портал и войди в другой мир...
          </p>

          {/* Game portals */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gamePortals.map((game) => (
              <a
                key={game.name}
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                className="dialog-box relative p-3 hover:scale-105 transition-transform cursor-pointer
                           group"
                style={{ borderColor: game.color + '44' }}
              >
                <div className="pixel-text text-2xl mb-1">{game.emoji}</div>
                <div 
                  className="pixel-text text-xs group-hover:glow-text transition-all"
                  style={{ color: game.color }}
                >
                  {game.name}
                </div>
                {/* Portal glow */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity rounded"
                  style={{ background: `radial-gradient(circle, ${game.color}, transparent)` }}
                />
              </a>
            ))}
          </div>
        </div>

        <button
          onClick={() => setScreen('world')}
          className="absolute bottom-8 pixel-text text-sm text-[#7744aa] hover:text-[#aa66ff] 
                     transition-colors cursor-pointer z-20"
        >
          ← Вернуться в мир
        </button>
      </div>
    );
  }

  // ===== MAIN WORLD =====
  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        id="pixel-canvas"
        className="w-full h-full"
      />

      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="pixel-text text-xs text-[#4a3a2a]">
            <span className="animate-flicker">☽</span> Полночь
          </div>
          <div className="pixel-text text-xs text-[#3a2a1a]">
            WASD — движение | Клик — действие
          </div>
        </div>

        {/* Location tooltip */}
        {hoveredLocation && dialogText && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80%]">
            <div className="dialog-box relative px-4 py-2">
              <p className="pixel-text text-sm text-[#c8b89a] text-center whitespace-nowrap">
                {dialogText}
              </p>
              <p className="pixel-text text-xs text-[#6a5a4a] text-center mt-1">
                [Кликни чтобы подойти]
              </p>
            </div>
          </div>
        )}

        {/* Controls hint */}
        {showControls && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="dialog-box relative px-6 py-3 text-center">
              <p className="pixel-text text-sm text-[#c8b89a] mb-1">
                ⌨️ WASD или стрелки — движение
              </p>
              <p className="pixel-text text-xs text-[#6a5a4a]">
                🖱️ Клик на объекты — взаимодействие
              </p>
              <p className="pixel-text text-xs text-[#4a3a2a] mt-1">
                Исследуй мир... если осмелишься
              </p>
            </div>
          </div>
        )}

        {/* Mini compass */}
        <div className="absolute bottom-4 right-4">
          <div className="w-12 h-12 border border-[#2a2018] bg-[#0a0a0f]/80 flex items-center justify-center">
            <div className="pixel-text text-xs text-[#4a3a2a]">☽</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
