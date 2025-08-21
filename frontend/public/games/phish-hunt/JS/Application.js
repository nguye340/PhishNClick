var startScreen = new StartScreen();

function launchApplication() {
    let gameParameters = startScreen.getGameParametersFromUserSelect();
    let selectedModeName = gameParameters.modeName;
    let selectedMode;

    if (selectedModeName == "EXTREME") {
        selectedMode = new ExtremeGame(gameParameters);
    }
    else if(selectedModeName == "MODERN"){
        selectedMode = new ModernGame(gameParameters);
    }
    else{
        selectedMode = new ClassicGame(gameParameters);
    }

    startScreen.hideStartScreen();
    // Make game instance globally available for pause/resume functionality
    window.gameInstance = selectedMode;
    selectedMode.startGame();
}