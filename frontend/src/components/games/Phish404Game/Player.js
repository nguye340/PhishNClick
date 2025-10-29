import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';

export default class Player {
   WALK_TIMER = 200;
   walkTimer = this.WALK_TIMER;
   catWalkImage = [];

   jumpPressed = false;
   jumpInProgress = false;
   falling = false;
   JUMP_SPEED = 0.6;
   GRAVITY = 0.4;
   
    constructor(ctx, width, height, minJumpHeight, maxJumpHeight, scaleRatio) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.width = width;
        this.height = height;
        this.minJumpHeight = minJumpHeight;
        this.maxJumpHeight = maxJumpHeight;
        this.scaleRatio = scaleRatio;

        this.jumpSound = new Audio('audio/meow.mp3');

        this.x = 10 * scaleRatio;
        this.y = this.canvas.height - this.height - 1.5 * scaleRatio;
        this.yStandingPosition = this.y;

        this.StandingStillImage = new Image();
        this.StandingStillImage.src = 'img/cat1.PNG';
        this.image = this.StandingStillImage;
        
        const catWalkImage1 = new Image();
        catWalkImage1.src = 'img/cat1.PNG'; 

        const catWalkImage2 = new Image();
        catWalkImage2.src = 'img/cat2.PNG';

        this.catWalkImage.push(catWalkImage1);
        this.catWalkImage.push(catWalkImage2);

        //keyboard
        window.removeEventListener('keydown', this.keydown);
        window.removeEventListener('keyup', this.keyup);

        window.addEventListener('keydown', this.keydown);
        window.addEventListener('keyup', this.keyup);
    }

    keydown = (event) =>{
        if(event.code === 'Space'){
            this.jumpPressed = true;
            this.jumpSound.currentTime = 0;
            this.jumpSound.play();
        }
    };

    keyup = (event) =>{
        if(event.code === 'Space'){
            this.jumpPressed = false;
        }
    };

    update(gameSpeed, frametimeDelta) {
        //debugLog(this.jumpPressed);
        this.walk(gameSpeed, frametimeDelta);  
        this.jump(frametimeDelta);
    } // update

    jump(frametimeDelta){
        if(this.jumpPressed){
            this.jumpInProgress = true;
        } // if 1

        if(this.jumpInProgress && !this.falling){ 
            if((this.y > this.canvas.height - this.minJumpHeight) || (this.y > this.canvas.height - this.maxJumpHeight && this.jumpPressed)){
                this.y -= this.JUMP_SPEED * frametimeDelta * this.scaleRatio;
                } // if 2.1
            else{
                    this.falling = true;
                }// else
        }// if 2
        else{
            if(this.y < this.yStandingPosition){
                this.y += this.GRAVITY * frametimeDelta * this.scaleRatio;
                if(this.y + this.height > this.canvas.height){
                    this.y = this.yStandingPosition;
                }
            }
            else{
                this.falling = false;
                this.jumpInProgress = false;
            }
        }//else
    } // jump





    walk(gameSpeed, frametimeDelta) {
        if(this.walkTimer <= 0) {
            if(this.image === this.catWalkImage[0]) {
                this.image = this.catWalkImage[1];
            }
            else{
                this.image = this.catWalkImage[0];
            }
            this.walkTimer = this.WALK_TIMER;
        }
        this.walkTimer -= frametimeDelta * gameSpeed;
    }

    draw(){
        this.ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}
