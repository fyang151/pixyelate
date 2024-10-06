import { Pixelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 20;
const yPixels = 30;

Pixelator.pixelateFromElement(imgElement, xPixels, yPixels);

// console.log(pixelData);
