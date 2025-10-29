class Game{

    constructor(gameParameters){
        this.dog1 = new Dog("dog1");
        this.dog2 = new Dog("dog2");
        this.duckMovesNumber = gameParameters.movesNumber;
        this.shotHandler = new ShotHandler(gameParameters.initialAmmo);
        this.pointsHandler = new PointsHandler(gameParameters.ducksNumber);
        this.ducksHandler = new DucksHandler(gameParameters.ducksNumber, gameParameters.movesNumber);
        this.roundEndCountdown;
        this.percentProgress = 0;
        this.lives = 3;
        this.newRoundTimeout;
        this.totalSuccessfulHits = 0;
        this.totalShotsNumber = 0;
        // Additional statistics for enhanced reporting
        this.emailsEscaped = 0;
        this.gameStartTime = Date.now();
        this.duckSpawnTimes = new Map();
    }
    
    postToParent(payload) {
        if (!window.parent || window.parent === window) return;
        try {
            window.parent.postMessage({
                ts: Date.now(),
                difficulty: this.pointsHandler.level || 1,
                ...payload
            }, window.location.origin);
        } catch (error) {
            debugError('Phish Hunt telemetry failed:', error);
        }
    }

    startGame(){
        this.dog1.launchWalkoutAnimation();
        setTimeout(() => this.startNewRound(), 7300);
    }

    shoot(){
        this.totalShotsNumber ++;
        let successfulHits = this.shotHandler.checkIfHitSuccessful(this.ducksHandler.ducks);
        this.ducksHandler.ducksKilledInRound += successfulHits;

        if (successfulHits > 0) {
            this.totalSuccessfulHits += successfulHits;
            this.pointsHandler.addPoints(successfulHits);
            this.percentProgress = this.ducksHandler.countPrecentOfDucksKilled();
            displayProgressOnProgressBar(this.percentProgress);
            
            // Emit telemetry for successful shot
            this.ducksHandler.ducks.forEach(duck => {
                if (!duck.isAlive && duck.wasShot && this.duckSpawnTimes.has(duck.duckId)) {
                    const spawnTime = this.duckSpawnTimes.get(duck.duckId);
                    const reactionMs = Date.now() - spawnTime;
                    this.postToParent({
                        type: 'PHISH_HUNT_INTERACTION',
                        action: 'shoot_duck',
                        outcome: 'correct',
                        category: 'phishing_email',
                        ui_type: 'duck_target',
                        reaction_ms: reactionMs
                    });
                    this.duckSpawnTimes.delete(duck.duckId);
                }
            });
        }
        this.checkIfRoundIsFinished();
    }

    checkIfRoundIsFinished(){
        if (this.ducksHandler.checkAllDucksAreShot() || this.shotHandler.checkIsNoAmmoLeft()) {
            this.finishRound();
        }
    }

    finishRound(){
        this.stopCountdownToRoundEnd();
        this.shotHandler.disableShooting();
        
        // Emit telemetry for ducks that escaped (missed)
        this.ducksHandler.ducks.forEach(duck => {
            if (duck.isAlive && this.duckSpawnTimes.has(duck.duckId)) {
                const spawnTime = this.duckSpawnTimes.get(duck.duckId);
                const reactionMs = Date.now() - spawnTime;
                this.postToParent({
                    type: 'PHISH_HUNT_INTERACTION',
                    action: 'miss_duck',
                    outcome: 'incorrect',
                    category: 'phishing_email',
                    ui_type: 'duck_target',
                    reaction_ms: reactionMs
                });
                this.duckSpawnTimes.delete(duck.duckId);
            }
        });
        
        this.ducksHandler.removeRemainingDucks();
        this.dog2.showDogWithKilledDucks(this.ducksHandler.ducksKilledInRound);
        this.newRoundTimeout = setTimeout(() => this.startNewRound(), 2000);        
        this.checkIfRoundIsPassed();
    }

    checkIfRoundIsPassed(){
        if (this.percentProgress < 90) {
            this.subtractLives();
        }
    }

    subtractLives(){
        disableLifeIcon(this.lives);
        this.lives--;
        if (this.lives < 1) {this.finishGame();}
    }
    
    gameOver(){
        this.finishGame();
    }
    
    startNewRound(){
        displayProgressOnProgressBar(0);
        this.percentProgress = 0;
        this.pointsHandler.addLevel();
        this.setCountdownToRoundEnd();
        this.ducksHandler.startDucksFlight();
        this.shotHandler.enableShooting();
        this.shotHandler.resetAmmo();
        
        // Track spawn times for all ducks in this round
        this.ducksHandler.ducks.forEach(duck => {
            if (duck.isAlive) {
                this.duckSpawnTimes.set(duck.duckId, Date.now());
            }
        });
    }

    stopCountdownToRoundEnd(){
        window.clearTimeout(this.roundEndCountdown);
    }

    setCountdownToRoundEnd(){
        let timeToRoundEnd = this.duckMovesNumber*1000;
        this.roundEndCountdown = setTimeout(() => this.finishRound(), timeToRoundEnd);
    }
    
    finishGame(){
        window.clearTimeout(this.newRoundTimeout);
        let accuracy = Math.round(this.totalSuccessfulHits/this.totalShotsNumber*100) || 0;
        
        // Calculate emails escaped (ducks that flew away)
        this.emailsEscaped = this.ducksHandler.ducks.filter(duck => !duck.isAlive && !duck.wasShot).length;
        
        // Save telemetry stats
        if (window.GameTelemetry) {
            const totalDucks = this.totalSuccessfulHits + this.emailsEscaped;
            window.GameTelemetry.saveStats({
                totalPopups: totalDucks,
                correctCount: this.totalSuccessfulHits,
                mistakeCount: this.emailsEscaped,
                falsePositives: 0,
                falseNegatives: this.emailsEscaped,
                avgReactionTime: 0,
                reactionScore: this.pointsHandler.points,
                confidenceScore: accuracy,
                confidenceRating: accuracy >= 70 ? 'balanced' : 'reckless'
            });
        }
        
        // Emit game over telemetry
        this.postToParent({
            type: 'PHISH_HUNT_GAME_OVER',
            score: this.pointsHandler.points,
            level: this.pointsHandler.level,
            ducksShot: this.totalSuccessfulHits,
            emailsEscaped: this.emailsEscaped,
            accuracy: accuracy,
            totalShots: this.totalShotsNumber
        });
        
        displayEndScreen(
            this.pointsHandler, 
            this.totalSuccessfulHits, 
            accuracy, 
            this.totalShotsNumber,
            this.emailsEscaped
        );
    }

    pauseGame() {
        // Store the current state
        this.isPaused = true;
        
        // Stop all duck movements
        if (this.ducksHandler && this.ducksHandler.ducks) {
            this.ducksHandler.ducks.forEach(duck => {
                if (duck.isAlive) {
                    duck.pauseMovement();
                }
            });
        }
        
        // Stop countdown if running
        if (this.roundEndCountdown) {
            clearTimeout(this.roundEndCountdown);
            this.pausedCountdownTime = Date.now();
        }
        
        // Disable shooting
        this.shotHandler.disableShooting();
        
        debugLog("Game paused");
    }

    resumeGame() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        
        // Resume duck movements
        if (this.ducksHandler && this.ducksHandler.ducks) {
            this.ducksHandler.ducks.forEach(duck => {
                if (duck.isAlive) {
                    duck.resumeMovement();
                }
            });
        }
        
        // Resume countdown if it was running
        if (this.pausedCountdownTime) {
            const remainingTime = this.roundEndCountdown - (this.pausedCountdownTime - this.roundStartTime);
            if (remainingTime > 0) {
                this.roundEndCountdown = setTimeout(() => this.finishRound(), remainingTime);
            }
            this.pausedCountdownTime = null;
        }
        
        // Enable shooting
        this.shotHandler.enableShooting();
        
        debugLog("Game resumed");
    }
}


class ExtremeGame extends Game{

    constructor(gameParameters){
        super(gameParameters);
        this.initializeCurrentModeSettings();
        this.shooting;
        this.mouseX;
        this.mouseY;
    }

    initializeCurrentModeSettings(){
        $(".sky").css("backgroundImage", "url(../resources/sprites/background/sky3.png)");
        $(".sky").mousedown(()=>this.startAutoShooting(event));
        $(".sky").mouseup(()=>this.stopAutoShooting(event));
        $("#gunIcon").attr("src", "../resources/sprites/weapons/auto.png");
    }

    saveCurrentCoordinates(){
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    startAutoShooting(event){
        $(".sky").on("mousemove", ()=>this.saveCurrentCoordinates());
        this.shooting = setInterval(()=>this.shoot(),100);
    }

    stopAutoShooting(){
        $(".sky").off("mousemove");
        clearInterval(this.shooting);
    }

    shoot(){
        this.totalShotsNumber ++;
        let successfulHits = this.shotHandler.checkIfHitSuccessful(this.ducksHandler.ducks, this.mouseX, this.mouseY);
        this.ducksHandler.ducksKilledInRound += successfulHits;
        if (successfulHits > 0) {
            this.totalSuccessfulHits += successfulHits;
            this.pointsHandler.addPoints(successfulHits);
            this.percentProgress = this.ducksHandler.countPrecentOfDucksKilled();
            displayProgressOnProgressBar(this.percentProgress);
        }
        this.checkIfRoundIsFinished();
    }

    finishRound(){
        this.stopAutoShooting();
        this.stopCountdownToRoundEnd();
        this.shotHandler.disableShooting();
        this.ducksHandler.removeRemainingDucks();
        this.dog2.showDogWithKilledDucks(this.ducksHandler.ducksKilledInRound);
        this.newRoundTimeout = setTimeout(() => this.startNewRound(), 2000);   
        this.checkIfRoundIsPassed();
        this.addNewDuck();
    }

    addNewDuck(){
        if (this.ducksHandler.numberOfDucks < 20) {
            this.ducksHandler.createNewDuck();
        }
    }
}


class ModernGame extends Game{
    
    constructor(gameParameters){
        super(gameParameters);
        this.changeBackgroudsForCurrentMode();
    }

    changeBackgroudsForCurrentMode(){
        $(".sky").css("backgroundImage", "url(../resources/sprites/background/modern.png)");
        $(".bushes").css("backgroundImage", "url(../resources/sprites/background/bushes.png)");
        $("#sky").click(this.shoot.bind(this));
        $("#gunIcon").attr("src", "../resources/sprites/weapons/shotgun.png");
    }
}


class ClassicGame extends Game{
    constructor(gameParameters){
        super(gameParameters);
        this.changeBackgroudsForCurrentMode();
    }

    changeBackgroudsForCurrentMode(){
        $(".sky").css("backgroundImage", "url(../resources/sprites/background/sky1.png)");
        $("#sky").click(this.shoot.bind(this));
    }
}