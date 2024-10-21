import { Pixyelator } from "./pixelator.js";

const imgElement = document.getElementById("myImage");
const xPixels = 100;
const yPixels = 100;

const thing = await Pixyelator.toArrayBuffer(imgElement, xPixels, yPixels);
console.log("thing", thing);

console.log("otherThing", await arrayBufferToDataURL(thing));
