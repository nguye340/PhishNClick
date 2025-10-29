import Obstacle from "./Obstacle.js";
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';


export default class OstacleController {
    OBSTACLE_INTERVAL_MIN = 500;
    OBSTACLE_INTERVAL_MAX = 2000;

    nextObstacleInterval = null;

    obstacle = [];
    
    constructor(ctx,obstacleImages, speed, scaleRatio) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.obstacleImages = obstacleImages;
        this.scaleRatio = scaleRatio;
        this.speed = speed;
    } //constructor

    setNextObstacleTime(){
        const num = this.getRandomNumber(this.OBSTACLE_INTERVAL_MIN, this.OBSTACLE_INTERVAL_MAX);
        this.nextObstacleInterval = num;
       // debugLog(this.nextObstacleInterval);
    }

    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    createObstacle(){
        const index = this.getRandomNumber(0, this.obstacleImages.length - 1);
        const obstacleImage = this.obstacleImages[index];
        const x = this.canvas.width * 1.5;
        const y = this.canvas.height - obstacleImage.height;
        const obstacle = new Obstacle(this.ctx, x, y, obstacleImage.width, obstacleImage.height, obstacleImage.image);

        this.obstacle.push(obstacle);
    }

    update(gameSpeed, frametimeDelta) {
        if(this.nextObstacleInterval <0){
            this.createObstacle();
            this.setNextObstacleTime();
        }
        this.nextObstacleInterval -= frametimeDelta;

        this.obstacle.forEach((obstacle) => {
            obstacle.update(this.speed, gameSpeed, frametimeDelta, this.scaleRatio);
        });

        this.obstacle = this.obstacle.filter((obstacle) => obstacle.x > -obstacle.width);

    } //update

    draw(){
        this.obstacle.forEach((obstacle) => obstacle.draw());
    }

    collideWith(sprite){
        return this.obstacle.some(obstacle => obstacle.collideWith(sprite));
    }

    
}