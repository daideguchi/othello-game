/**
 * オセロゲーム - 究極のUXと最強AI
 * 
 * ゲームロジックとAIエンジンを全面的に改修。
 * 破綻のないルール実装と、挑戦的な3段階のAIを搭載。
 */

// オセロゲーム - AI対戦機能付き完全版
class OthelloGame {
    constructor() {
        console.log('=== オセロゲーム起動 ===');
        
        // 盤面: 0=空, -1=黒, 1=白
        this.board = Array(8).fill(0).map(() => Array(8).fill(0));
        this.currentPlayer = 'black'; // 'black' or 'white'
        this.gameActive = true;
        this.isThinking = false; // AI思考中フラグ
        
        // ゲーム設定
        this.settings = {
            gameMode: 'human', // 'human' or 'ai'
            aiLevel: 'normal', // 'easy', 'normal', 'hard'
            aiPlayer: 'white', // AIは白を担当
            soundEnabled: true,
            hintMode: false, // デフォルトでオフ
            volume: 0.7, // 音量設定（0-1）
            showBestMove: true // 最強の一手表示
        };
        
        // 統計データ初期化
        this.initializeStatistics();
        
        // サウンドシステム初期化
        this.initializeSoundSystem();
        
        // DOM要素を取得
        this.initializeDOM();
        
        // イベントリスナーを設定
        this.setupEventListeners();
        
        // ゲームを初期化
        this.resetGame();
    }
    
    // サウンドシステム初期化
    initializeSoundSystem() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.soundEnabled = this.settings.soundEnabled;
            console.log('サウンドシステム初期化完了:', {
                audioContext: !!this.audioContext,
                state: this.audioContext.state,
                soundEnabled: this.soundEnabled
            });
        } catch (error) {
            console.warn('サウンドシステム初期化失敗:', error);
            this.soundEnabled = false;
        }
    }
    
    // サウンド再生関数
    playSound(type) {
        console.log('サウンド再生試行:', type, {
            soundEnabled: this.soundEnabled,
            audioContext: !!this.audioContext,
            audioContextState: this.audioContext ? this.audioContext.state : 'none'
        });
        
        if (!this.soundEnabled || !this.audioContext) {
            console.log('サウンド再生スキップ:', type);
            return;
        }
        
        // AudioContextが停止している場合は再開
        if (this.audioContext.state === 'suspended') {
            console.log('AudioContext再開中...');
            this.audioContext.resume().then(() => {
                console.log('AudioContext再開完了');
            });
        }
        
        try {
            let frequency, duration, volume;
            
            switch (type) {
                case 'place':
                    frequency = 800;
                    duration = 0.1;
                    volume = this.settings.volume;
                    break;
                case 'flip':
                    frequency = 600;
                    duration = 0.15;
                    volume = this.settings.volume * 0.8;
                    break;
                case 'victory':
                    this.playVictoryMelody();
                    return;
                case 'defeat':
                    frequency = 200;
                    duration = 0.3;
                    volume = this.settings.volume * 0.6;
                    break;
                case 'draw':
                    frequency = 400;
                    duration = 0.2;
                    volume = this.settings.volume * 0.7;
                    break;
                case 'click':
                    frequency = 1000;
                    duration = 0.05;
                    volume = this.settings.volume * 0.5;
                    break;
                case 'invalid':
                    // ブーの音を再生（低い音を2回）
                    this.playErrorSound();
                    return;
                    break;
                default:
                    return;
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            console.log('サウンド再生成功:', type, 'frequency:', frequency, 'duration:', duration, 'volume:', volume);
            
        } catch (error) {
            console.warn('サウンド再生エラー:', error);
        }
    }
    
    // 勝利メロディー再生
    playVictoryMelody() {
        const notes = [
            { freq: 523.25, duration: 0.2 }, // C5
            { freq: 659.25, duration: 0.2 }, // E5
            { freq: 783.99, duration: 0.2 }, // G5
            { freq: 1046.50, duration: 0.4 } // C6
        ];
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                this.playTone(note.freq, note.duration, this.settings.volume * 0.8);
            }, index * 250);
        });
    }
    
    // エラー音（ブー）再生
    playErrorSound() {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            // より特徴的なブーの音を作成
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 低い周波数でsquare波を使用してブーの音を作成
            oscillator.frequency.setValueAtTime(120, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.4); // 周波数を下げる
            oscillator.type = 'square'; // square波でより特徴的な音
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.volume * 0.8, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
            
            console.log('エラー音（ブー）再生成功');
            
        } catch (error) {
            console.warn('エラー音再生エラー:', error);
        }
    }
    
    // 単音再生
    playTone(frequency, duration, volume) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.warn('トーン再生エラー:', error);
        }
    }
    
    // サウンド切り替え
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.settings.soundEnabled = this.soundEnabled;
        
        // ボタンテキスト更新
        if (this.dom.soundBtn) {
            this.dom.soundBtn.innerHTML = this.soundEnabled ? '🔊 サウンド' : '🔇 サウンド';
        }
        
        // 設定をローカルストレージに保存
        this.saveSettings();
        
        // 切り替え音を再生
        if (this.soundEnabled) {
            this.playSound('click');
        }
        
        console.log('サウンド切り替え:', this.soundEnabled);
    }
    
    // 設定保存
    saveSettings() {
        try {
            localStorage.setItem('othello-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('設定保存エラー:', error);
        }
    }
    
    // 設定読み込み
    loadSettings() {
        try {
            const saved = localStorage.getItem('othello-settings');
            if (saved) {
                const loaded = JSON.parse(saved);
                this.settings = { ...this.settings, ...loaded };
                this.soundEnabled = this.settings.soundEnabled;
            }
        } catch (error) {
            console.warn('設定読み込みエラー:', error);
        }
    }
    
    initializeDOM() {
        this.dom = {
            board: document.getElementById('game-board'),
            blackScore: document.getElementById('black-score'),
            whiteScore: document.getElementById('white-score'),
            currentPlayerText: document.getElementById('current-player-text'),
            gameStatus: document.getElementById('game-status'),
            
            // モードボタン
            humanBtn: document.getElementById('human-btn'),
            aiEasyBtn: document.getElementById('ai-easy-btn'),
            aiNormalBtn: document.getElementById('ai-normal-btn'),
            aiHardBtn: document.getElementById('ai-hard-btn'),
            
            // 操作ボタン
            hintBtn: document.getElementById('hint-btn'),
            restartBtn: document.getElementById('restart-btn'),
            soundBtn: document.getElementById('sound-btn'),
            statsBtn: document.getElementById('stats-btn'),
            resetStatsBtn: document.getElementById('reset-stats-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            
            // モーダル
            gameOverModal: document.getElementById('game-over-modal'),
            finalBlackScore: document.getElementById('final-black-score'),
            finalWhiteScore: document.getElementById('final-white-score'),
            winnerText: document.getElementById('winner-text'),
            playAgainBtn: document.getElementById('play-again-btn')
        };
        
        // 設定を読み込み
        this.loadSettings();
        
        // サウンドボタンの初期表示を設定
        if (this.dom.soundBtn) {
            this.dom.soundBtn.innerHTML = this.soundEnabled ? '🔊 サウンド' : '🔇 サウンド';
        }
        
        // ヒントボタンの初期表示を設定
        if (this.dom.hintBtn) {
            this.dom.hintBtn.innerHTML = this.settings.hintMode ? '💡 ヒントON' : '💡 ヒント';
            this.dom.hintBtn.classList.toggle('active', this.settings.hintMode);
        }
        
        console.log('DOM要素取得完了:', {
            board: !!this.dom.board,
            humanBtn: !!this.dom.humanBtn,
            aiEasyBtn: !!this.dom.aiEasyBtn,
            aiNormalBtn: !!this.dom.aiNormalBtn,
            aiHardBtn: !!this.dom.aiHardBtn,
            soundBtn: !!this.dom.soundBtn,
            statsBtn: !!this.dom.statsBtn,
            settingsBtn: !!this.dom.settingsBtn
        });
    }
    
    setupEventListeners() {
        console.log('=== イベントリスナー設定開始 ===');
        
        // モードボタン
        if (this.dom.humanBtn) {
            this.dom.humanBtn.addEventListener('click', () => {
                console.log('人間対戦モード選択');
                this.setGameMode('human');
            });
        }
        
        if (this.dom.aiEasyBtn) {
            this.dom.aiEasyBtn.addEventListener('click', () => {
                console.log('AI簡単モード選択');
                this.setGameMode('ai', 'easy');
            });
        }
        
        if (this.dom.aiNormalBtn) {
            this.dom.aiNormalBtn.addEventListener('click', () => {
                console.log('AI普通モード選択');
                this.setGameMode('ai', 'normal');
            });
        }
        
        if (this.dom.aiHardBtn) {
            this.dom.aiHardBtn.addEventListener('click', () => {
                console.log('AI難しいモード選択');
                this.setGameMode('ai', 'hard');
            });
        }
        
        // 操作ボタン
        if (this.dom.hintBtn) {
            this.dom.hintBtn.addEventListener('click', () => {
                console.log('ヒントボタン押下');
                this.toggleHint();
            });
        }
        
        if (this.dom.restartBtn) {
            this.dom.restartBtn.addEventListener('click', () => {
                console.log('やり直しボタン押下');
                
                // 現在のゲームが進行中の場合、確認ダイアログを表示
                if (this.gameActive && this.hasGameProgress()) {
                    const confirmed = confirm('ゲームをやり直しますか？\n現在のゲームはリセットされます。');
                    
                    if (!confirmed) {
                        console.log('やり直しをキャンセル');
                        return;
                    }
                }
                
                this.resetGame();
            });
        }
        
        if (this.dom.playAgainBtn) {
            this.dom.playAgainBtn.addEventListener('click', () => {
                console.log('もう一度プレイボタン押下');
                this.resetGame();
                this.dom.gameOverModal.style.display = 'none';
            });
        }
        
        if (this.dom.soundBtn) {
            this.dom.soundBtn.addEventListener('click', () => {
                console.log('サウンドボタン押下');
                this.toggleSound();
            });
        }
        
        if (this.dom.statsBtn) {
            this.dom.statsBtn.addEventListener('click', () => {
                console.log('統計ボタン押下');
                this.showStatistics();
            });
        }
        
        if (this.dom.resetStatsBtn) {
            this.dom.resetStatsBtn.addEventListener('click', () => {
                console.log('統計リセットボタン押下');
                this.resetStatistics();
            });
        }
        
        if (this.dom.settingsBtn) {
            this.dom.settingsBtn.addEventListener('click', () => {
                console.log('設定ボタン押下');
                this.showSettings();
            });
        }
        
        console.log('=== イベントリスナー設定完了 ===');
    }
    
    setGameMode(mode, level = 'normal') {
        // 現在のゲームが進行中の場合、確認ダイアログを表示
        if (this.gameActive && this.hasGameProgress()) {
            const modeText = mode === 'human' ? '人間対戦' : `AI対戦 (${level})`;
            const confirmed = confirm(`ゲームモードを「${modeText}」に変更しますか？\n現在のゲームはリセットされます。`);
            
            if (!confirmed) {
                console.log('ゲームモード変更をキャンセル');
                return;
            }
        }
        
        console.log(`=== ゲームモード変更: ${mode} ${level} ===`);
        
        this.settings.gameMode = mode;
        if (mode === 'ai') {
            this.settings.aiLevel = level;
        }
        
        // ボタンの表示を更新
        this.updateModeButtons();
        
        // ゲームをリセット
        this.resetGame();
    }
    
    // ゲームが進行中かどうかを判定
    hasGameProgress() {
        // 初期配置以外に石が置かれているかチェック
        let stoneCount = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] !== 0) {
                    stoneCount++;
                }
            }
        }
        // 初期配置は4個の石があるので、それより多い場合は進行中
        return stoneCount > 4;
    }
    
    updateModeButtons() {
        // すべてのボタンから active クラスを削除
        [this.dom.humanBtn, this.dom.aiEasyBtn, this.dom.aiNormalBtn, this.dom.aiHardBtn].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        // 現在のモードに応じてボタンを有効化
        if (this.settings.gameMode === 'human') {
            if (this.dom.humanBtn) this.dom.humanBtn.classList.add('active');
        } else if (this.settings.gameMode === 'ai') {
            if (this.settings.aiLevel === 'easy' && this.dom.aiEasyBtn) {
                this.dom.aiEasyBtn.classList.add('active');
            } else if (this.settings.aiLevel === 'normal' && this.dom.aiNormalBtn) {
                this.dom.aiNormalBtn.classList.add('active');
            } else if (this.settings.aiLevel === 'hard' && this.dom.aiHardBtn) {
                this.dom.aiHardBtn.classList.add('active');
            }
        }
        
        console.log('モードボタン更新完了:', this.settings);
    }
    
    resetGame() {
        console.log('=== ゲームリセット ===');
        
        // 盤面を完全クリア
        this.board = Array(8).fill(0).map(() => Array(8).fill(0));
        
        // 初期配置
        this.board[3][3] = 1;  // 白
        this.board[3][4] = -1; // 黒  
        this.board[4][3] = -1; // 黒
        this.board[4][4] = 1;  // 白
        
        // ゲーム状態リセット
        this.currentPlayer = 'black';
        this.gameActive = true;
        this.isThinking = false;
        
        // 統計記録開始
        this.startGameStats();
        
        // 初期配置をコンソールに表示
        this.printBoard();
        
        // UI更新
        this.updateUI();
        this.updateModeButtons();
        
        // 初期の有効手を確認
        const validMoves = this.getValidMoves(-1); // 黒の有効手
        console.log('黒の初期有効手:', validMoves);
        
        this.updateStatus('黒の番です');
        
        // 自動ヒント表示（設定が有効の場合）
        if (this.settings.hintMode) {
            setTimeout(() => this.showHints(), 500);
        }
        
        // AIモードで黒がAIの場合（通常は白がAI）
        if (this.settings.gameMode === 'ai' && this.settings.aiPlayer === 'black') {
            setTimeout(() => this.triggerAI(), 1000);
        }
    }
    
    updateUI() {
        this.renderBoard();
        this.updateScore();
    }
    
    renderBoard() {
        if (!this.dom.board) return;
        
        // ボードを完全にクリア
        this.dom.board.innerHTML = '';
        
        // 8x8のセルを作成
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 石がある場合は追加
                const stone = this.board[row][col];
                if (stone !== 0) {
                    const stoneElement = document.createElement('div');
                    stoneElement.className = `stone ${stone === -1 ? 'black' : 'white'}`;
                    cell.appendChild(stoneElement);
                }
                
                // クリックイベント
                cell.addEventListener('click', () => {
                    this.handleCellClick(row, col);
                });
                
                this.dom.board.appendChild(cell);
            }
        }
    }
    
    handleCellClick(row, col) {
        console.log(`=== セルクリック (${row}, ${col}) ===`);
        console.log('現在のプレイヤー:', this.currentPlayer);
        console.log('ゲーム状態:', this.gameActive);
        console.log('AI思考中:', this.isThinking);
        console.log('セルの値:', this.board[row][col]);
        
        // ゲームが終了している場合は無視
        if (!this.gameActive) {
            console.log('ゲーム終了済み - ブーの音を再生します');
            this.playSound('invalid'); // ブーの音を再生
            return;
        }
        
        // AI思考中の場合は無視
        if (this.isThinking) {
            console.log('AI思考中のため無視 - ブーの音を再生します');
            this.playSound('invalid'); // ブーの音を再生
            return;
        }
        
        // AIモードで現在AIのターンの場合は無視
        if (this.settings.gameMode === 'ai' && this.currentPlayer === this.settings.aiPlayer) {
            console.log('AIのターンなので無視 - ブーの音を再生します');
            this.playSound('invalid'); // ブーの音を再生
            return;
        }
        
        // セルが既に占有されている場合は無視
        if (this.board[row][col] !== 0) {
            console.log('セルは既に占有されています - ブーの音を再生します');
            this.playSound('invalid'); // ブーの音を再生
            return;
        }
        
        // 現在のプレイヤーの値を取得
        const playerValue = this.currentPlayer === 'black' ? -1 : 1;
        
        // ひっくり返せる石を取得
        const flippedStones = this.getFlippedStones(row, col, playerValue);
        console.log('ひっくり返せる石:', flippedStones);
        
        // 有効な手でない場合は無視
        if (flippedStones.length === 0) {
            console.log('無効な手です - ブーの音を再生します');
            this.updateStatus('無効な手です');
            this.playSound('invalid'); // ブーの音を再生
            return;
        }
        
        // 手を実行
        this.makeMove(row, col, playerValue, flippedStones);
        
        // サウンド再生
        this.playSound('place');
    }
    
    makeMove(row, col, playerValue, flippedStones) {
        console.log(`=== 手を実行: (${row}, ${col}) ===`);
        
        // 石を配置
        this.board[row][col] = playerValue;
        
        // 石をひっくり返す
        flippedStones.forEach(([r, c]) => {
            this.board[r][c] = playerValue;
        });
        
        // ひっくり返しサウンド再生
        if (flippedStones.length > 0) {
            this.playSound('flip');
        }
        
        console.log('手を実行後の盤面:');
        this.printBoard();
        
        // UI更新
        this.updateUI();
        
        // 次のターンへ
        this.nextTurn();
    }
    
    getFlippedStones(row, col, playerValue) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        const allFlipped = [];
        
        // 8方向をチェック
        for (const [dr, dc] of directions) {
            const line = [];
            let r = row + dr;
            let c = col + dc;
            
            // 相手の石を探す
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === -playerValue) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }
            
            // 自分の石で挟めるかチェック
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] === playerValue && line.length > 0) {
                allFlipped.push(...line);
            }
        }
        
        return allFlipped;
    }
    
    getValidMoves(playerValue) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === 0) {
                    const flipped = this.getFlippedStones(row, col, playerValue);
                    if (flipped.length > 0) {
                        moves.push([row, col]);
                    }
                }
            }
        }
        
        return moves;
    }
    
    nextTurn() {
        // プレイヤーを切り替え
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        const playerValue = this.currentPlayer === 'black' ? -1 : 1;
        
        // 有効な手があるかチェック
        const validMoves = this.getValidMoves(playerValue);
        
        if (validMoves.length === 0) {
            // パスまたはゲーム終了
            const opponentValue = -playerValue;
            const opponentMoves = this.getValidMoves(opponentValue);
            
            if (opponentMoves.length === 0) {
                // ゲーム終了
                this.endGame();
                return;
            } else {
                // パス
                this.updateStatus(`${this.currentPlayer === 'black' ? '黒' : '白'}はパスします`);
                setTimeout(() => {
                    this.nextTurn();
                }, 1500);
                return;
            }
        }
        
        // 通常のターン
        this.updateStatus(`${this.currentPlayer === 'black' ? '黒' : '白'}の番です`);
        console.log(`${this.currentPlayer}の番、有効手:`, validMoves);
        
        // 自動ヒント表示（設定が有効で、人間のターンの場合）
        if (this.settings.hintMode && this.settings.gameMode === 'human') {
            setTimeout(() => this.showHints(), 300);
        } else if (this.settings.hintMode && this.settings.gameMode === 'ai' && this.currentPlayer !== this.settings.aiPlayer) {
            setTimeout(() => this.showHints(), 300);
        }
        
        // AIのターンかチェック
        if (this.settings.gameMode === 'ai' && this.currentPlayer === this.settings.aiPlayer) {
            setTimeout(() => this.triggerAI(), 500);
        }
    }
    
    // ==============================================
    // AI機能
    // ==============================================
    
    triggerAI() {
        if (!this.gameActive) return;
        
        console.log(`=== AI思考開始 (${this.settings.aiLevel}) ===`);
        this.isThinking = true;
        this.updateStatus('AIが考え中...');
        
        const playerValue = this.settings.aiPlayer === 'black' ? -1 : 1;
        const validMoves = this.getValidMoves(playerValue);
        
        if (validMoves.length === 0) {
            console.log('AIに有効手なし');
            this.isThinking = false;
            this.nextTurn();
            return;
        }
        
        // 難易度に応じた思考時間
        const thinkingTime = {
            easy: 500,
            normal: 1000,
            hard: 1500
        };
        
        setTimeout(() => {
            if (!this.gameActive) return;
            
            let bestMove;
            
            switch (this.settings.aiLevel) {
                case 'easy':
                    bestMove = this.getRandomMove(validMoves);
                    break;
                case 'normal':
                    bestMove = this.getGreedyMove(validMoves, playerValue);
                    break;
                case 'hard':
                    bestMove = this.getAdvancedMove(validMoves, playerValue);
                    break;
                default:
                    bestMove = validMoves[0];
            }
            
            console.log('AI選択:', bestMove);
            
            const flippedStones = this.getFlippedStones(bestMove[0], bestMove[1], playerValue);
            this.isThinking = false;
            this.makeMove(bestMove[0], bestMove[1], playerValue, flippedStones);
            
        }, thinkingTime[this.settings.aiLevel]);
    }
    
    getRandomMove(validMoves) {
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    getGreedyMove(validMoves, playerValue) {
        let bestMove = validMoves[0];
        let maxFlips = 0;
        
        for (const move of validMoves) {
            const flips = this.getFlippedStones(move[0], move[1], playerValue).length;
            if (flips > maxFlips) {
                maxFlips = flips;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    getAdvancedMove(validMoves, playerValue) {
        // 角の位置に重みを付ける
        const cornerPositions = [[0,0], [0,7], [7,0], [7,7]];
        const edgePositions = [];
        
        // 端の位置を計算
        for (let i = 0; i < 8; i++) {
            if (i !== 0 && i !== 7) {
                edgePositions.push([0, i], [7, i], [i, 0], [i, 7]);
            }
        }
        
        // 角があれば最優先
        for (const move of validMoves) {
            if (cornerPositions.some(([r, c]) => move[0] === r && move[1] === c)) {
                return move;
            }
        }
        
        // 端があれば次に優先
        for (const move of validMoves) {
            if (edgePositions.some(([r, c]) => move[0] === r && move[1] === c)) {
                return move;
            }
        }
        
        // それ以外は貪欲法
        return this.getGreedyMove(validMoves, playerValue);
    }
    
    endGame() {
        this.gameActive = false;
        
        // スコア計算
        const scores = this.calculateScore();
        
        let message;
        let soundType;
        let result;
        
        if (scores.black > scores.white) {
            message = '黒の勝利！';
            soundType = 'victory';
            result = this.settings.gameMode === 'ai' && this.settings.aiPlayer === 'white' ? 'win' : 'loss';
        } else if (scores.white > scores.black) {
            message = '白の勝利！';
            soundType = 'victory';
            result = this.settings.gameMode === 'ai' && this.settings.aiPlayer === 'white' ? 'loss' : 'win';
        } else {
            message = '引き分け！';
            soundType = 'draw';
            result = 'draw';
        }
        
        // 統計更新
        this.updateGameStats(result, scores);
        
        // サウンド再生
        this.playSound(soundType);
        
        this.updateStatus(`ゲーム終了！ ${message}`);
        console.log('=== ゲーム終了 ===');
        console.log('最終スコア:', scores);
        console.log('結果:', message);
        
        // モーダル表示
        if (this.dom.gameOverModal) {
            if (this.dom.finalBlackScore) this.dom.finalBlackScore.textContent = scores.black;
            if (this.dom.finalWhiteScore) this.dom.finalWhiteScore.textContent = scores.white;
            if (this.dom.winnerText) this.dom.winnerText.textContent = message;
            this.dom.gameOverModal.style.display = 'flex';
        }
    }
    
    calculateScore() {
        let black = 0, white = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col] === -1) black++;
                else if (this.board[row][col] === 1) white++;
            }
        }
        
        return { black, white };
    }
    
    updateScore() {
        const scores = this.calculateScore();
        
        if (this.dom.blackScore) {
            this.dom.blackScore.textContent = scores.black;
        }
        if (this.dom.whiteScore) {
            this.dom.whiteScore.textContent = scores.white;
        }
    }
    
    updateStatus(message) {
        if (this.dom.gameStatus) {
            this.dom.gameStatus.textContent = message;
        }
        if (this.dom.currentPlayerText) {
            this.dom.currentPlayerText.textContent = message;
        }
    }
    
    toggleHint() {
        this.settings.hintMode = !this.settings.hintMode;
        
        // ヒントボタンの表示を更新
        if (this.dom.hintBtn) {
            this.dom.hintBtn.innerHTML = this.settings.hintMode ? '💡 ヒントON' : '💡 ヒント';
            this.dom.hintBtn.classList.toggle('active', this.settings.hintMode);
        }
        
        if (this.settings.hintMode) {
            this.showHints();
            this.playSound('click');
        } else {
            this.hideHints();
            this.playSound('click');
        }
        
        // 設定を保存
        this.saveSettings();
        
        console.log('ヒントモード切り替え:', this.settings.hintMode);
    }
    
    showHints() {
        // AI思考中は無視
        if (this.isThinking) return;
        
        const playerValue = this.currentPlayer === 'black' ? -1 : 1;
        const validMoves = this.getValidMoves(playerValue);
        
        // すべてのヒントを削除
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('hint', 'best-move');
        });
        
        // 最強の一手を判定
        const bestMove = this.getBestMove(playerValue);
        
        // 有効手にヒントを追加
        validMoves.forEach(([row, col]) => {
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                // 最強の一手かどうかチェック
                if (bestMove && row === bestMove[0] && col === bestMove[1]) {
                    cell.classList.add('best-move');
                } else {
                    cell.classList.add('hint');
                }
            }
        });
        
        // ヒント数と最強の一手を表示
        if (validMoves.length > 0) {
            let statusText = `${this.currentPlayer === 'black' ? '黒' : '白'}の有効手: ${validMoves.length}箇所`;
            if (bestMove) {
                statusText += ` (最強の一手: ${bestMove[0]},${bestMove[1]})`;
            }
            this.updateStatus(statusText);
        } else {
            this.updateStatus(`${this.currentPlayer === 'black' ? '黒' : '白'}の有効手なし`);
        }
        
        console.log('ヒント表示:', validMoves.length, '箇所', '最強の一手:', bestMove);
    }
    
    hideHints() {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('hint', 'best-move');
        });
        
        // 通常の状態表示に戻す
        this.updateStatus(`${this.currentPlayer === 'black' ? '黒' : '白'}の番です`);
        
        console.log('ヒント非表示');
    }
    
    // デバッグ用：盤面を表示
    printBoard() {
        console.log('=== 現在の盤面 ===');
        console.log('  0 1 2 3 4 5 6 7');
        for (let row = 0; row < 8; row++) {
            let line = row + ' ';
            for (let col = 0; col < 8; col++) {
                const cell = this.board[row][col];
                if (cell === 0) line += '・';
                else if (cell === -1) line += '●';
                else if (cell === 1) line += '○';
                line += ' ';
            }
            console.log(line);
        }
        console.log('==================');
    }
    
    // テスト用関数
    testGame() {
        console.log('=== ゲームテスト開始 ===');
        this.printBoard();
        
        const blackMoves = this.getValidMoves(-1);
        console.log('黒の有効手:', blackMoves);
        
        blackMoves.forEach(([row, col]) => {
            const flipped = this.getFlippedStones(row, col, -1);
            console.log(`(${row},${col}): ${flipped.length}個ひっくり返し`, flipped);
        });
        
        return blackMoves.length > 0 ? '正常' : '異常';
    }
    
    // 統計データ初期化
    initializeStatistics() {
        this.stats = {
            totalGames: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalPlayTime: 0,
            averageGameTime: 0,
            highestScore: 0,
            perfectWins: 0,
            aiStats: {
                easy: { wins: 0, losses: 0 },
                normal: { wins: 0, losses: 0 },
                hard: { wins: 0, losses: 0 }
            },
            gameStartTime: null
        };
        
        this.loadStatistics();
    }
    
    // 統計データ保存
    saveStatistics() {
        try {
            localStorage.setItem('othello-statistics', JSON.stringify(this.stats));
        } catch (error) {
            console.warn('統計保存エラー:', error);
        }
    }
    
    // 統計データ読み込み
    loadStatistics() {
        try {
            const saved = localStorage.getItem('othello-statistics');
            if (saved) {
                this.stats = { ...this.stats, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('統計読み込みエラー:', error);
        }
    }
    
    // ゲーム開始時の統計記録
    startGameStats() {
        this.stats.gameStartTime = Date.now();
    }
    
    // ゲーム終了時の統計更新
    updateGameStats(result, scores) {
        const gameTime = this.stats.gameStartTime ? Date.now() - this.stats.gameStartTime : 0;
        
        this.stats.totalGames++;
        this.stats.totalPlayTime += gameTime;
        this.stats.averageGameTime = this.stats.totalPlayTime / this.stats.totalGames;
        
        // 最高スコア更新
        const maxScore = Math.max(scores.black, scores.white);
        if (maxScore > this.stats.highestScore) {
            this.stats.highestScore = maxScore;
        }
        
        // パーフェクト勝利チェック（64点）
        if (maxScore === 64) {
            this.stats.perfectWins++;
        }
        
        // 勝敗記録
        if (result === 'win') {
            this.stats.wins++;
            this.stats.currentStreak++;
            if (this.stats.currentStreak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.currentStreak;
            }
        } else if (result === 'loss') {
            this.stats.losses++;
            this.stats.currentStreak = 0;
        } else if (result === 'draw') {
            this.stats.draws++;
            this.stats.currentStreak = 0;
        }
        
        // AI対戦の場合、難易度別統計を更新
        if (this.settings.gameMode === 'ai') {
            const aiLevel = this.settings.aiLevel;
            if (result === 'win') {
                this.stats.aiStats[aiLevel].wins++;
            } else if (result === 'loss') {
                this.stats.aiStats[aiLevel].losses++;
            }
        }
        
        this.saveStatistics();
        console.log('統計更新:', this.stats);
    }
    
    // 統計表示
    showStatistics() {
        const winRate = this.stats.totalGames > 0 ? 
            ((this.stats.wins / this.stats.totalGames) * 100).toFixed(1) : '0.0';
        
        const avgTime = Math.round(this.stats.averageGameTime / 1000);
        
        const statsText = `
🎮 ゲーム統計

📊 基本統計
総ゲーム数: ${this.stats.totalGames}
勝利: ${this.stats.wins}回
敗北: ${this.stats.losses}回
引き分け: ${this.stats.draws}回
勝率: ${winRate}%

🔥 連勝記録
現在の連勝: ${this.stats.currentStreak}回
最高連勝: ${this.stats.maxStreak}回

⏱️ 時間統計
総プレイ時間: ${Math.round(this.stats.totalPlayTime / 1000 / 60)}分
平均ゲーム時間: ${avgTime}秒

🏆 記録
最高得点: ${this.stats.highestScore}点
パーフェクト勝利: ${this.stats.perfectWins}回

🤖 AI対戦成績
簡単: ${this.stats.aiStats.easy.wins}勝${this.stats.aiStats.easy.losses}敗
普通: ${this.stats.aiStats.normal.wins}勝${this.stats.aiStats.normal.losses}敗
難しい: ${this.stats.aiStats.hard.wins}勝${this.stats.aiStats.hard.losses}敗
        `;
        
        alert(statsText);
    }
    
    // 統計リセット
    resetStatistics() {
        if (confirm('すべての統計データをリセットしますか？\nこの操作は取り消せません。')) {
            this.stats = {
                totalGames: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                currentStreak: 0,
                maxStreak: 0,
                totalPlayTime: 0,
                averageGameTime: 0,
                highestScore: 0,
                perfectWins: 0,
                aiStats: {
                    easy: { wins: 0, losses: 0 },
                    normal: { wins: 0, losses: 0 },
                    hard: { wins: 0, losses: 0 }
                },
                gameStartTime: null
            };
            
            this.saveStatistics();
            alert('統計データをリセットしました。');
            console.log('統計リセット完了');
        }
    }
    
    // 設定表示
    showSettings() {
        const settingsHtml = `
            <div class="modal-overlay" id="settings-modal" style="display: flex;">
                <div class="modal-content" style="max-width: 500px;">
                    <h2 class="modal-title">⚙️ 設定</h2>
                    
                    <div class="settings-section">
                        <h3>🔊 サウンド設定</h3>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="sound-toggle" ${this.settings.soundEnabled ? 'checked' : ''}>
                                サウンドを有効にする
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>音量: <span id="volume-value">${Math.round(this.settings.volume * 100)}%</span></label>
                            <input type="range" id="volume-slider" min="0" max="100" value="${Math.round(this.settings.volume * 100)}">
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>🎮 ゲーム設定</h3>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="auto-hint" ${this.settings.hintMode ? 'checked' : ''}>
                                自動ヒント表示
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="ai-thinking-time" checked>
                                AI思考時間を表示
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="hint-count" checked>
                                ヒント数を表示
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                <input type="checkbox" id="best-move-hint" ${this.settings.showBestMove ? 'checked' : ''}>
                                最強の一手を表示
                            </label>
                        </div>
                    </div>
                    
                    <div class="settings-section">
                        <h3>🎨 表示設定</h3>
                        <div class="setting-item">
                            <label>アニメーション速度:</label>
                            <select id="animation-speed">
                                <option value="slow">遅い</option>
                                <option value="normal" selected>普通</option>
                                <option value="fast">早い</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="settings-actions">
                        <button class="modal-btn" id="settings-save">保存</button>
                        <button class="modal-btn" id="settings-cancel">キャンセル</button>
                    </div>
                </div>
            </div>
        `;
        
        // 既存の設定モーダルを削除
        const existingModal = document.getElementById('settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // 新しいモーダルを追加
        document.body.insertAdjacentHTML('beforeend', settingsHtml);
        
        // イベントリスナーを設定
        this.setupSettingsEventListeners();
    }
    
    // 設定モーダルのイベントリスナー設定
    setupSettingsEventListeners() {
        const modal = document.getElementById('settings-modal');
        const saveBtn = document.getElementById('settings-save');
        const cancelBtn = document.getElementById('settings-cancel');
        const soundToggle = document.getElementById('sound-toggle');
        const volumeSlider = document.getElementById('volume-slider');
        const volumeValue = document.getElementById('volume-value');
        const autoHint = document.getElementById('auto-hint');
        const aiThinkingTime = document.getElementById('ai-thinking-time');
        const animationSpeed = document.getElementById('animation-speed');
        const bestMoveHint = document.getElementById('best-move-hint');
        
        // 音量スライダー
        if (volumeSlider && volumeValue) {
            volumeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                volumeValue.textContent = value + '%';
                this.settings.volume = value / 100;
            });
        }
        
        // 保存ボタン
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // 設定を更新
                this.settings.soundEnabled = soundToggle ? soundToggle.checked : this.settings.soundEnabled;
                this.settings.hintMode = autoHint ? autoHint.checked : this.settings.hintMode;
                this.settings.volume = volumeSlider ? volumeSlider.value / 100 : this.settings.volume;
                this.settings.showBestMove = bestMoveHint ? bestMoveHint.checked : true;
                
                // ヒントボタンの表示を更新
                if (this.dom.hintBtn) {
                    this.dom.hintBtn.innerHTML = this.settings.hintMode ? '💡 ヒントON' : '💡 ヒント';
                    this.dom.hintBtn.classList.toggle('active', this.settings.hintMode);
                }
                
                // サウンド状態を更新
                this.soundEnabled = this.settings.soundEnabled;
                
                // 設定を保存
                this.saveSettings();
                
                // サウンドボタンの表示を更新
                if (this.dom.soundBtn) {
                    this.dom.soundBtn.innerHTML = this.soundEnabled ? '🔊 サウンド' : '🔇 サウンド';
                }
                
                // モーダルを閉じる
                if (modal) {
                    modal.remove();
                }
                
                // 保存音を再生
                this.playSound('click');
                
                console.log('設定保存完了:', this.settings);
            });
        }
        
        // キャンセルボタン
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (modal) {
                    modal.remove();
                }
            });
        }
        
        // モーダル外クリックで閉じる
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });
        }
    }
    
    // 最強の一手を判定
    getBestMove(playerValue) {
        const validMoves = this.getValidMoves(playerValue);
        if (validMoves.length === 0) return null;
        
        let bestMove = validMoves[0];
        let bestScore = -Infinity;
        
        // 各有効手を評価
        for (const move of validMoves) {
            const score = this.evaluateMove(move, playerValue);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        console.log('最強の一手:', bestMove, 'スコア:', bestScore);
        return bestMove;
    }
    
    // 手の評価関数
    evaluateMove(move, playerValue) {
        const [row, col] = move;
        let score = 0;
        
        // 1. 石を置いた後の盤面をシミュレート
        const tempBoard = this.board.map(row => [...row]);
        const flippedStones = this.getFlippedStones(row, col, playerValue);
        
        // 一時的に手を実行
        tempBoard[row][col] = playerValue;
        flippedStones.forEach(([r, c]) => {
            tempBoard[r][c] = playerValue;
        });
        
        // 2. 位置評価（角・端の重要性）
        score += this.evaluatePosition(row, col);
        
        // 3. 石数評価
        score += this.evaluateStoneCount(tempBoard, playerValue);
        
        // 4. 安定性評価
        score += this.evaluateStability(tempBoard, playerValue);
        
        // 5. 機動性評価（相手の有効手を減らす）
        const opponentValue = -playerValue;
        const opponentMoves = this.getValidMovesForBoard(tempBoard, opponentValue);
        score -= opponentMoves.length * 2; // 相手の有効手を減らすことを重視
        
        // 6. 終盤戦略（石数が40個以上の場合）
        const totalStones = this.countStones(tempBoard);
        if (totalStones >= 40) {
            score += this.evaluateEndgame(tempBoard, playerValue);
        }
        
        return score;
    }
    
    // 位置評価
    evaluatePosition(row, col) {
        // 角の位置（最高評価）
        if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
            return 100;
        }
        
        // 端の位置（高評価）
        if (row === 0 || row === 7 || col === 0 || col === 7) {
            return 10;
        }
        
        // 内側の位置（低評価）
        if (row === 1 || row === 6 || col === 1 || col === 6) {
            return -5;
        }
        
        // 中央の位置（中評価）
        return 0;
    }
    
    // 石数評価
    evaluateStoneCount(board, playerValue) {
        let playerStones = 0;
        let opponentStones = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === playerValue) {
                    playerStones++;
                } else if (board[row][col] === -playerValue) {
                    opponentStones++;
                }
            }
        }
        
        return playerStones - opponentStones;
    }
    
    // 安定性評価
    evaluateStability(board, playerValue) {
        let stableStones = 0;
        
        // 角の石は安定
        const corners = [[0,0], [0,7], [7,0], [7,7]];
        for (const [row, col] of corners) {
            if (board[row][col] === playerValue) {
                stableStones += 10;
            }
        }
        
        // 端の石も比較的安定
        for (let i = 0; i < 8; i++) {
            if (board[0][i] === playerValue) stableStones += 2;
            if (board[7][i] === playerValue) stableStones += 2;
            if (board[i][0] === playerValue) stableStones += 2;
            if (board[i][7] === playerValue) stableStones += 2;
        }
        
        return stableStones;
    }
    
    // 終盤評価
    evaluateEndgame(board, playerValue) {
        let playerStones = 0;
        let opponentStones = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === playerValue) {
                    playerStones++;
                } else if (board[row][col] === -playerValue) {
                    opponentStones++;
                }
            }
        }
        
        // 終盤では石数を重視
        return (playerStones - opponentStones) * 3;
    }
    
    // 指定された盤面での有効手を取得
    getValidMovesForBoard(board, playerValue) {
        const moves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] === 0) {
                    const flipped = this.getFlippedStonesForBoard(board, row, col, playerValue);
                    if (flipped.length > 0) {
                        moves.push([row, col]);
                    }
                }
            }
        }
        
        return moves;
    }
    
    // 指定された盤面でのひっくり返せる石を取得
    getFlippedStonesForBoard(board, row, col, playerValue) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        const allFlipped = [];
        
        for (const [dr, dc] of directions) {
            const line = [];
            let r = row + dr;
            let c = col + dc;
            
            while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === -playerValue) {
                line.push([r, c]);
                r += dr;
                c += dc;
            }
            
            if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === playerValue && line.length > 0) {
                allFlipped.push(...line);
            }
        }
        
        return allFlipped;
    }
    
    // 石数をカウント
    countStones(board) {
        let count = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (board[row][col] !== 0) {
                    count++;
                }
            }
        }
        return count;
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM読み込み完了 ===');
    window.game = new OthelloGame();
    
    // テスト実行
    setTimeout(() => {
        console.log('テスト結果:', window.game.testGame());
    }, 1000);
}); 