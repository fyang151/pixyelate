import { Pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 40;
const yPixels = 50;

Pixyelator.fromElement(imgElement, xPixels, yPixels);

// console.log(pixelData);
