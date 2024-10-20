import { Pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 900;
const yPixels = 900;

const thing = await Pixyelator.fromElement(imgElement, xPixels, yPixels, 'dataURL', 900);
// console.log("thing", thing);
