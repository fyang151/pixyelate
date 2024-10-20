import { Pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 60;
const yPixels = 17;

const thing = await Pixyelator.fromElement(imgElement, xPixels, yPixels, 'dataURL');
console.log("thing", thing);
