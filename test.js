import { pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 40;
const yPixels = 50;

pixyelator.fromElement(imgElement, xPixels, yPixels);