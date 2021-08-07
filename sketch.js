//references: tracking.js, draggable, xinxin setinterval;

//There could be a symmetry option, if mapping  turns out ugly
//TODOs 做毛线花纹img - 1hr；线自己绕成一个叶子 - load animation +max；比较符合人的思绪发展；界面外。

let c1;
let c2;
let c3;
let c4;
let c5;
let counter = 0;

let paintbg;
let d = 15;
let promptArea = 80;
let easing=0.04;

// Start point at sleeve
let startX1 = 460;
let startY1 = 480;

//TODO implement if over some sign, shuffle rule
let rule = [2,0,1,4,3];
let knitWidth = 51;
let targetXArray = [];
let colorArray = [];// influenced by color changer function

//color tracking
let trackingData;
let colors;
let trackXBlue;
let trackYBlue;
let trackXRed;
let trackYRed;

// Prompting code
let PicUrl;
let myImg;
let draggedImg;
let imgArray=[];
let imgX;// X coord of image
let imgY;// Y coord of image
let promptDragged = false;
let promptItem;
let stitch;
let patternColor;

//Teachable Machine code
// Classifier Variable
let classifier;
// Model URL
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/1J_bpJDNL/';
// Video
let video;
let flippedVideo;
// To store the classification
let label = "";

let clearButton;
let shuffleButton;
let finishButton;
let hitAlert;
let finishAlert;

//Load ML model
function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');
  img1 = loadImage('images/leaf.png');//ALWAYS remember to preload img
  img2 = loadImage('images/fishbone.png');
  img3 = loadImage('images/diamond.png');
  img4 = loadImage('images/peacock.png');
  img5 = loadImage('images/twist.png');
  img6 = loadImage('images/heart.png');
  imgArray=[img1,img2,img3,img4,img5,img6];
  clearButton = loadImage('images/clear_button_cn.png');
  shuffleButton = loadImage('images/shuffle_button.png');
  finishButton = loadImage('images/finish_button_cn.png');
  hitAlert = createAudio('sounds/hit.wav');
  finishAlert = createAudio('sounds/finish.wav');
}

function setup() {
 
 c1 = color('#AC2022');//red
 c2 = color('#A168DE');//purple
 c3 = color('#C2E4FF');//blue
 c4 = color('#C2FFC2');//green
 c5 = color('#F3EDB9');//yellow
  createCanvas(720, 540);

  // TODO - Could make prompt images animated, need to be same style for sure
   setInterval(function(){
     draggedImg = int(random(6));
    myImg = imgArray[draggedImg];//doesn't include max value
    imgX = int(random(65,655));// 50 is set to show whole image
    if (int(random(0,2))==0&&imgX>=492&&imgX<640){
     imgY = int(random(0,15));
      }else
     {imgY = int(random(460,475));//weird offset 32.5
     }
    // console.log(myImg);
  },10000)
  
  noStroke();
  // newpaint = new Painter();  
  paintbg = createGraphics(width,380);// This is necessary to save all the knitting patterns
  
  //ML - Create the video
  video = createCapture(VIDEO);
  video.size(width, height);
  video.id("myVideo");
  video.position(0,0);
  video.style('opacity',0);
  //video.hide();
  flippedVideo = ml5.flipImage(video);
  // Start classifying
  classifyVideo();

  // Registering my own blue color
  tracking.ColorTracker.registerColor('blue',function(r,g,b){
    if (r<40&&g<90&&b>120){
      return true;
    }
    return false;
  });
    // Registering my own red color
  tracking.ColorTracker.registerColor('red',function(r,g,b){
    if (r>210&&g<160&&b<160){
      return true;
    }
    return false;
  });
  colors = new tracking.ColorTracker(['blue','red']);
  tracking.track('#myVideo',colors);
  colors.on('track', function(event){
     trackingData = event.data; // break the trackingjs data into a global so we can access it with p5
  });

}

function draw() {

  // set background canvas grey 50,50,50
  background(50,50,50);

  // Insert the graphics canvas
  image(paintbg,0,promptArea);
  // Draw the two rectangle regions for prompting
  fill(0);
  rect(0,0,720,promptArea); 
  rect(0,460,720,540);
   
// Prompting code
if (myImg&&imgX&&imgY){
  promptItem = new Prompt(myImg,imgX,imgY,65,65);
  promptItem.show();
  promptItem.hoverToDrag();
  promptItem.dragging();
  promptItem.dropOnCanvas();
}

// Knitting code
if (label == "Red & Blue"&&promptDragged == false){
  
  targetX1 = trackXBlue;//coordinates of tracked color
  targetXArray[0] = targetX1;
  targetY1 = trackYBlue;//coordinates of tracked color
  for (let i=0;i<5;i++){
    targetXArray[i] = trackXBlue + i*knitWidth/4;
  }
  
  // Making sure audience knit within knitting constraints
  if(abs(width-startX1-width+targetXArray[rule[0]])/720<=10/72 && abs(startY1-promptArea-targetY1+promptArea)/400>=1/20 && abs(startY1-promptArea-targetY1+promptArea)/400<=1/5){
    let baseColor = colorChanger();
    for (let i = 0;i<5;i++){
    baseColor.setAlpha(random(100,255));
    colorArray[i] = baseColor.toString();
    // console.log(baseColor);
    }
  //unblur before blurring again
  // paintbg.filter(BLUR,0);
    for (let i = 0; i<5;i++){
      //TODO colorArray should be defined every time you knit, according to the color resulting from color change. Each time you knit, color changes once, at the beginning.
      paintbg.stroke(color(colorArray[i]));
      paintbg.strokeWeight(5);
      paintbg.line(width-(startX1+i*knitWidth/4),startY1-promptArea,width-targetXArray[rule[i]],targetY1-promptArea); 
      // paintbg.filter(BLUR,1);//and then unblur everything b4 next blur!
    }
      startX1 = targetX1;// Starting point becomes the previously tracked coordinates 
      startY1 = targetY1;
    }
}
  //Draw ML result label
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
        
  //tracking code and cursor ellipses (trackingData is JS objects within an array)
  if (trackingData){
    for (let i = 0; i<trackingData.length;i++){
      if (trackingData[i].color == "blue"){
      trackXBlue = trackingData[i].x+trackingData[i].width/2;
      trackYBlue =trackingData[i].y+trackingData[i].height/2;
        // Paint function separate from knitting
        let pointX = 0;
        let pointY = 0;
        let ptargetX = trackXBlue;
        let ptargetY = trackYBlue;

        //display the points, MIGHT NEED MORE TO MATCH YARN
        fill('blue');
        ellipse(width - trackXBlue,trackYBlue,d,d);
      } else if (trackingData[i].color == "red"){
        trackXRed = trackingData[i].x+trackingData[i].width/2;
        trackYRed = trackingData[i].y+trackingData[i].height/2;
        // console.log(trackXRed);
        fill('red'); 
        ellipse(width - trackXRed,trackYRed,d,d)
      }
    }
  }
      // Knit pattern shuffle button, clear and finish buttons
  image(shuffleButton,640,12,40,40);
    if ((label == 'Red'||label == 'Red & Blue'||label == 'Blue')&&trackXRed<696&&trackXRed>656&&trackYRed>12&&trackYRed<52){
      hitAlert.play();
      shuffle(rule,true);
      console.log(rule);
      }
  image(clearButton,40,12,40,40);
  if ((label == 'Red'||label == 'Red & Blue'||label == 'Blue')&&trackXRed<616&&trackXRed>576&&trackYRed>12&&trackYRed<52){
      hitAlert.play();
      paintbg.clear();
      }
  image(finishButton,144,12,40,40);
  if ((label == 'Red'||label == 'Red & Blue'||label == 'Blue')&&trackXRed<534&&trackXRed>494&&trackYRed>12&&trackYRed<52){
      finishAlert.play();
      paintbg.filter(BLUR,5);
      startX1 = 460;
      startY1 = 480;
      }
}

// function to implement yarn gradient
function colorChanger() {
    let cF1 = lerpColor(c1, c2, counter % 1);
    let cF2 = lerpColor(c2, c3, counter % 1);
    let cF3 = lerpColor(c3, c4, counter % 1);
    let cF4 = lerpColor(c4, c5, counter % 1);
    let cF5 = lerpColor(c5, c1, counter % 1);
    let cFinal = c1;
    if (int(counter) % 6 == 0) { 
      cFinal = cF1;//cFinal = c2(0.几 的时候一直cF1)
    } else if (int(counter) % 6 == 1) {
      cFinal = cF2;

    } else if (int(counter) % 6 == 2) {
      cFinal = cF3;

    } else if (int(counter) % 6 == 3) {
      cFinal = cF4;

    } else if (int(counter) % 6 == 4) {
      cFinal = cF5;
    }
    counter += 0.05;// global variable
    return cFinal;
  }

 // Get a prediction for the current video frame
  function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove();
  }

  // When we get a result
  function gotResult(error, results) {
    // If there is an error
    if (error) {
      console.error(error);
      return;
    }
    // The results are in an array ordered by confidence.
    // console.log(results[0]);
    label = results[0].label;
    // Classifiy again!
    classifyVideo();
  }

class Prompt{
  constructor(img,x,y,w,h){
    this.img = img;
    this.hover = false;
    this.x = x;
    this.y = y;
     this.w = w;
    this.h = h;
    this.offsetX = 0;
    this.offsetY = 0;
  }
  
  show(){
    image(this.img,this.x,this.y,this.w,this.h);
  }
  
  //call this in draw
  hoverToDrag(){
    // console.log('redx = '+ trackXRed);
    // console.log('x = '+ this.x);
    // console.log('redy = '+ trackYRed);
    // console.log('y = '+ this.y);
    if((label == 'Red'||label == 'Red & Blue'||label == 'Blue')&&trackXRed<width-this.x&&trackXRed>width-(this.x+this.w)&&trackYRed>this.y&&trackYRed<this.y+this.h){
      // TODO pause setinterval when hover
      promptDragged = true;
      //console.log('here');
      // this.offsetX = this.x - trackXRed;
      // this.offsetY = this.y - trackYRed;
      // this.x = trackXRed + this.offsetX;
      // this.y = trackYRed + this.offsetY;
    }
  }
  
  dragging(){
  if (promptDragged){
     this.x = width-trackXRed;
    this.y = trackYRed;
     image(this.img,this.x,this.y,this.w,this.h);
  }
  }
  
  // TODO - show function visual feedback
  
  dropOnCanvas(){
    //console.log(promptDragged);
        //console.log(trackYRed);
    stitch=random(10,30);
    patternColor = color(random(255),random(255),random(255));
    paintbg.stroke(patternColor);
    paintbg.strokeWeight(5);
    if(promptDragged == true&&label=="Red & Blue"&&trackYRed>80&&trackYRed<400){
      // paintbg.image(this.img, this.x,this.y,this.w,this.h);
      if(draggedImg == 0){
        leafPattern(this.x,this.y);
      }else if (draggedImg == 1){
        fishbonePattern(this.x,this.y);
      }else if (draggedImg == 2){
        diamondPattern(this.x,this.y);
      }else if (draggedImg == 3){
        peacockPattern(this.x,this.y);
      }else if (draggedImg == 4){
        twistPattern(this.x,this.y);
      }else if(draggedImg == 5){
        heartPattern(this.x,this.y);
      }
      console.log(stitch);
      promptDragged = false;
    }
  }
}
function leafPattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
  for (let i = 0; i < 5;i++){
    paintbg.line(xArray[2],y,xArray[i],y-stitch);
  }
  for(let j =0;j<2;j++){
    paintbg.line(xArray[0],y-(j+1)*stitch,xArray[0],y-(2+j)*stitch);
    paintbg.line(xArray[4],y-(j+1)*stitch,xArray[4],y-(2+j)*stitch);
    for (let i = 0; i < 3;i++){
        paintbg.line(xArray[2],y-(j+1)*stitch,xArray[1],y-(2+j)*stitch);
        paintbg.line(xArray[2],y-(j+1)*stitch,xArray[2],y-(2+j)*stitch);
        paintbg.line(xArray[2],y-(j+1)*stitch,xArray[3],y-(2+j)*stitch);
    }
  }
  for(let i =1;i<4;i++){
    paintbg.line(xArray[2],y-3*stitch,xArray[i],y-4*stitch);
  }
  paintbg.line(xArray[0],y-3*stitch,xArray[1],y-4*stitch);
  paintbg.line(xArray[4],y-3*stitch,xArray[3],y-4*stitch);
   for(let i =1;i<4;i++){
    paintbg.line(xArray[2],y-5*stitch,xArray[i],y-4*stitch);
  }
}

function fishbonePattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
  for (let j=0;j<3;j++){
  for (let i = 0; i <3;i++){
    paintbg.line(xArray[0],y-j*stitch,xArray[1],y-(1+j)*stitch);
    paintbg.line(xArray[1],y-j*stitch,xArray[2],y-(1+j)*stitch);
    paintbg.line(xArray[3],y-j*stitch,xArray[2],y-(1+j)*stitch);
    paintbg.line(xArray[4],y-j*stitch,xArray[3],y-(1+j)*stitch);
  }
  }
}

//peacock
function peacockPattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
  for (let i=0;i<3;i++){
    paintbg.line(xArray[0],y-2*i*stitch,xArray[0],y-(1+2*i)*stitch);
    paintbg.line(xArray[4],y-2*i*stitch,xArray[4],y-(1+2*i)*stitch);
   paintbg.line(xArray[0],y-(1+2*i)*stitch,xArray[1],y-2*(i+1)*stitch);
    paintbg.line(xArray[4],y-(1+2*i)*stitch,xArray[3],y-2*(i+1)*stitch);
    paintbg.line(xArray[1],y-2*(i+1)*stitch,xArray[3],y-2*(i+1)*stitch);
    paintbg.line(xArray[2],y-2*i*stitch,xArray[1],y-(1+2*i)*stitch);
    paintbg.line(xArray[2],y-2*i*stitch,xArray[2],y-(1+2*i)*stitch);
    paintbg.line(xArray[2],y-2*i*stitch,xArray[3],y-(1+2*i)*stitch);
  }
}

//twist
function twistPattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
    for (i=0;i<3;i++){
    paintbg.line(xArray[1],y-2*i*stitch,xArray[0],y-(1+2*i)*stitch);
    paintbg.line(xArray[2],y-2*i*stitch,xArray[1],y-(1+2*i)*stitch);
    paintbg.line(xArray[2],y-2*i*stitch,xArray[3],y-(1+2*i)*stitch);

    paintbg.line(xArray[3],y-2*i*stitch,xArray[4],y-(1+2*i)*stitch);
    paintbg.line(xArray[0],y-(1+2*i)*stitch,xArray[1],y-2*(i+1)*stitch);
    paintbg.line(xArray[2],y-(1+2*i)*stitch,xArray[3],y-2*(i+1)*stitch);
    paintbg.line(xArray[4],y-(1+2*i)*stitch,xArray[3],y-2*(i+1)*stitch);
  }
}

//heart
function heartPattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
  for (i=0;i<2;i++){
    paintbg.line(xArray[2],y-i*stitch,xArray[1],y-(1+i)*stitch);
    paintbg.line(xArray[2],y-i*stitch,xArray[3],y-(1+i)*stitch);
    paintbg.line(xArray[1],y-(1+i)*stitch,xArray[0],y-(2+i)*stitch);
    paintbg.line(xArray[3],y-(1+i)*stitch,xArray[4],y-(2+i)*stitch);
    paintbg.line(xArray[0],y-(2+i)*stitch,xArray[0],y-(3+i)*stitch);
    paintbg.line(xArray[4],y-(2+i)*stitch,xArray[4],y-(3+i)*stitch);
    paintbg.line(xArray[0],y-(3+i)*stitch,xArray[1],y-(4+i)*stitch);
    paintbg.line(xArray[4],y-(3+i)*stitch,xArray[3],y-(4+i)*stitch);
    paintbg.line(xArray[2],y-(3+i)*stitch,xArray[1],y-(4+i)*stitch);
    paintbg.line(xArray[2],y-(3+i)*stitch,xArray[3],y-(4+i)*stitch);
  }
}

//diamond
function diamondPattern(x,y){
  let x1 = x-stitch*2;
  let x2 = x-stitch;
  let x3 = x;
  let x4 = x+stitch;
  let x5 = x+stitch*2;
  xArray = [x1,x2,x3,x4,x5];
 
   for (i=0;i<2;i++){
   for (j=0;j<2;j++){
     paintbg.line(xArray[1+2*j],y-2*i*stitch,xArray[0+2*j],y-(1+2*i)*stitch);
     paintbg.line(xArray[1+2*j],y-2*i*stitch,xArray[2+2*j],y-(1+2*i)*stitch);
     paintbg.line(xArray[0+2*j],y-(1+2*i)*stitch,xArray[1+2*j],y-(2+2*i)*stitch);
     paintbg.line(xArray[2+2*j],y-(1+2*i)*stitch,xArray[1+2*j],y-(2+2*i)*stitch);
   }
   }
}
