class ShotHandler{

    constructor(initialAmmo){
        this.initialAmmo = initialAmmo;
        this.ammo = initialAmmo;
        this.shoot = new Audio('/games/phish-hunt/sounds/Duck Hunt SFX (2).wav');
    }

    getAmmoNumber(){
        return this.ammo;
    }

    resetAmmo(){
        this.ammo = this.initialAmmo;
        this.changeShootBoxImage();
    }

    checkIsNoAmmoLeft(){
        if (this.ammo == 0) {
            return true;
        }
        return false;
    }

    checkIfHitSuccessful(ducks, mouseX, mouseY){
        if (mouseX == undefined || mouseY == undefined) {
            mouseX = event.clientX;
            mouseY = event.clientY;
        }
        let numberOfSuccessfulHits = 0;
        this.subtractAmmunition();

        for (let index = 0; index < ducks.length; index++) {
            let duck = ducks[index];
            let duckPosition = $(duck.duckId).offset();

            if(this.isShotOnDuck(mouseX,mouseY,duckPosition) && duck.isAlive){
                duck.fallDown();
                numberOfSuccessfulHits++;
                
                // Show enlarged email for malicious duck
                if (duck.emailData && typeof showEnlargedEmail === 'function') {
                    // Add explanation for why this email is malicious
                    const emailWithExplanation = {
                        ...duck.emailData,
                        explanation: this.getPhishingExplanation(duck.emailData)
                    };
                    showEnlargedEmail(emailWithExplanation);
                }
            }   
        }
        if (numberOfSuccessfulHits>1) {
            showComboMessage(mouseX,mouseY, numberOfSuccessfulHits);
        }
        return numberOfSuccessfulHits;
    }

    subtractAmmunition(){
        this.shoot.currentTime = 0;
        this.shoot.play();
        this.ammo--;
        this.changeShootBoxImage();
    }

    isShotOnDuck(mouseX,mouseY,duckPosition) {
        let duckX = duckPosition.left;
        let duckY = duckPosition.top;
        let duckWidth = 78;
        let duckHeight = 73;
    
        if ((mouseX>=duckX) && (mouseX <= duckX+duckHeight) && 
            (mouseY >= duckY) && (mouseY <= duckY+duckWidth)){
            return true;
        }
        return false;
    }

    changeShootBoxImage() {
        //add displaying images on classic and modern game mode;
        $("#ammunitionAmmount").html(this.ammo)
    }

    enableShooting(){
        $("#shootBlocker").hide();
    }

    disableShooting(){
        $("#shootBlocker").show();
    }

    getPhishingExplanation(emailData) {
        const explanations = {
            "security@paypal-verification.com": "This email uses a fake domain that mimics PayPal. The real PayPal domain is paypal.com, not paypal-verification.com. The urgent language and threat of account closure are classic phishing tactics.",
            "noreply@amazon-security.net": "Amazon's official domain is amazon.com, not amazon-security.net. Legitimate companies don't use third-party domains for security notifications. The vague 'unrecognized device' claim is designed to create panic.",
            "alerts@bank-security.org": "Banks don't use generic domains like 'bank-security.org' for official communications. The urgent 2-hour deadline and specific dollar amount are red flags designed to bypass rational thinking.",
            "winner@lottery-international.com": "This is a classic lottery scam. You cannot win a lottery you never entered. The request for a 'processing fee' is a common scam tactic - legitimate winnings never require upfront payments.",
            "support@microsoft-update.net": "Microsoft uses microsoft.com for official communications, not microsoft-update.net. Legitimate security updates come through Windows Update, not email attachments or links."
        };
        
        // Return specific explanation or generic one
        return explanations[emailData.from] || "This email contains typical phishing indicators such as urgent language, suspicious sender domain, requests for immediate action, or attempts to create fear and panic to bypass critical thinking.";
    }
}
