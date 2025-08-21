class Duck{

    constructor(id, duckMovesNumber){
        this.duckMovesNumber = duckMovesNumber;
        this.duckId = `#${id}`;
        this.isAlive = true;
        this.moveCount = 0;
        this.duckFlight;
        this.currentWidth = 48;
        this.currentHeight = 20;
        this.wasShot = false;
        // Add duck flying sound
        this.duckFlyingSound = new Audio('/games/phish-hunt/sounds/duck.wav');
        
        // Generate email data for this duck
        this.emailData = this.generateEmailData();
        
        // Make duck clickable to show email
        this.setupClickHandler();
    }


    startFlight(){
        this.resurrect();
        this.duckFlight = setInterval(() => this.fly(), 1000);
    }


    resurrect(){
        this.isAlive = true;
        this.moveCount = 0;
        this.currentWidth = 48;
        this.currentHeight = 20;
        this.moveToInitialPosition();
    }


    stopFlightAnimation(){
        clearInterval(this.duckFlight);
        $(this.duckId).stop(true);
    }


    moveToInitialPosition(){
        $(this.duckId).css("bottom", "20%");
    }


    flyOut(){
        this.stopFlightAnimation();
        this.wasShot = false; // Mark as escaped, not shot
        let destWidth = this.getRandomWidth(10,85);
        this.changeDuckBackground(destWidth, 100);
        $(this.duckId).animate({bottom: `100%`, left: `${destWidth}%`}, 500 ,function(){})
    }


    fallDown(){
            this.isAlive = false;
            this.wasShot = true;
            let this_ = this;
            this.stopFlightAnimation();
            $(this.duckId).css("background-image", "url(../resources/sprites/duck/hit.png)")

            setTimeout(function(){
                $(this_.duckId)
                    .css("background-image", "url(../resources/sprites/duck/falling.gif)")
                    .animate({bottom: `10%`,}, 650);
            },150);
    }
    

    fly(){
        this.moveCount++;
        let destWidth = this.getRandomWidth(10,85);
        let destHeight = this.getRandomHeight(35,85);
        this.changeDuckBackground(destWidth, destHeight);
        $(this.duckId).animate({bottom: `${destHeight}%`, left: `${destWidth}%`}, 1000)
        this.currentWidth = destWidth;
        this.currentHeight = destHeight;
    }


    changeDuckBackground(destWidth, destHeight){
        if (destWidth > this.currentWidth) {
            $(this.duckId)
            .css("background-image", "url(../resources/sprites/duck/phishRight.gif)");
            if(destHeight - this.currentHeight > 20){
                $(this.duckId)
                .css("background-image", "url(../resources/sprites/duck/flyrightup.gif)");}
            if(destHeight - this.currentHeight < -20){
                $(this.duckId)
                .css("background-image", "url(../resources/sprites/duck/flyrightdown.gif)");
            
            }
        } else {
            $(this.duckId)
            .css("background-image", "url(../resources/sprites/duck/phishLeft.gif)");

            if(destHeight - this.currentHeight > 20){
                $(this.duckId)
                .css("background-image", "url(../resources/sprites/duck/flyleftup.gif)");}
            if(destHeight - this.currentHeight < -20){
                $(this.duckId)
                .css("background-image", "url(../resources/sprites/duck/flyleftdown.gif)");
            }
        }
    }


    getRandomWidth(min,max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    
    getRandomHeight(min,max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;   
    }
    
    generateEmailData() {
        const phishingEmails = [
            {
                from: "security@paypal-verification.com",
                subject: "Urgent: Account Suspended - Verify Now",
                message: "Your PayPal account has been temporarily suspended due to suspicious activity. Click here to verify your identity immediately or your account will be permanently closed within 24 hours.",
                threatLevel: "HIGH"
            },
            {
                from: "noreply@amazon-security.net",
                subject: "Unusual Sign-in Activity Detected",
                message: "We detected a sign-in attempt from an unrecognized device. If this wasn't you, please click here to secure your account immediately.",
                threatLevel: "HIGH"
            },
            {
                from: "alerts@bank-security.org",
                subject: "Urgent: Fraudulent Transaction Alert",
                message: "A suspicious transaction of $2,847.99 was attempted on your account. Click here within 2 hours to cancel this transaction.",
                threatLevel: "HIGH"
            },
            {
                from: "winner@lottery-international.com",
                subject: "Congratulations! You've Won $500,000!",
                message: "You have been selected as the winner of our international lottery! Click here to claim your prize. Processing fee of $299 required.",
                threatLevel: "MEDIUM"
            },
            {
                from: "support@microsoft-update.net",
                subject: "Critical Windows Security Update Required",
                message: "Your Windows system is at risk. Download this critical security patch immediately to protect your computer from malware.",
                threatLevel: "HIGH"
            }
        ];
        
        return phishingEmails[Math.floor(Math.random() * phishingEmails.length)];
    }
    
    setupClickHandler() {
        const self = this;
        // Add click handler after a short delay to ensure element exists
        setTimeout(() => {
            $(self.duckId).css('cursor', 'pointer');
            $(self.duckId).on('click', function(e) {
                if (self.isAlive) {
                    e.stopPropagation();
                    showDuckEmailModal(self.emailData);
                }
            });
        }, 100);
    }

    pauseMovement() {
        // Stop any current animations
        $(this.duckId).stop(true, false);
        this.isPaused = true;
    }

    resumeMovement() {
        if (!this.isPaused) return;
        this.isPaused = false;
        
        // Resume flying if the duck is still alive and should be moving
        if (this.isAlive && this.moveCount < this.duckMovesNumber) {
            // Continue with the next movement
            this.fly();
        }
    }
}