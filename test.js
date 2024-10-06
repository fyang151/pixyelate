import { Pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 20;
const yPixels = 30;

Pixyelator.fromElement(imgElement, xPixels, yPixels);

// console.log(pixelData);
