export class Pixyelator {
  static fromElement = (imgElement, xPixels, yPixels) => {
    const width = imgElement.naturalWidth;
    const height = imgElement.naturalHeight;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imgElement, 0, 0);

    const displayCanvas = document.getElementById("myCanvas");

    displayCanvas.width = width;
    displayCanvas.height = height;

    const shouldAllocateByRows = xPixels > yPixels;

    const widthRemainderPixels = width % xPixels;
    const heightRemainderPixels = height % yPixels;

    let individualSectionWidths = Array.from({ length: xPixels }, () =>
      Math.floor(width / xPixels)
    );

    for (let i = 0; i < widthRemainderPixels; i++) {
      individualSectionWidths[
        Math.floor(i * (xPixels / widthRemainderPixels))
      ]++;
    }

    let individualSectionHeights = Array.from({ length: yPixels }, () =>
      Math.floor(height / yPixels)
    );

    for (let i = 0; i < heightRemainderPixels; i++) {
      individualSectionHeights[
        Math.floor(i * (yPixels / heightRemainderPixels))
      ]++;
    }

    const numWorkers = navigator.hardwareConcurrency;

    const secondCanvas = document.getElementById("secondCanvas");
    const secondCtx = secondCanvas.getContext("2d");

    secondCanvas.width = width;
    secondCanvas.height = height;

    const processInnerPromise = (outerValue, outerDimension) => {

      const [sliceX, sliceY, sliceWidth, sliceHeight] = shouldAllocateByRows
        ? [0, outerDimension, width, outerValue]
        : [outerDimension, 0, outerValue, height];
      return new Promise((resolve, reject) => {
        createImageBitmap(
          imgElement,
          sliceX,
          sliceY,
          sliceWidth,
          sliceHeight
        ).then((imageSliceBitmap) => {
          const innerWorker = new Worker("innerWorker.js");

          innerWorker.postMessage([
            imageSliceBitmap,
            outerValue,
            outerDimension,
            innerValues,
            individualSectionWidths,
            individualSectionHeights,
            shouldAllocateByRows,
          ]);

          innerWorker.onmessage = (e) => {
            resolve(e.data);
            innerWorker.terminate();
          };
          innerWorker.onerror = (err) => {
            reject(err.data);
            innerWorker.terminate();
          };
        });
      });
    };

    const processInner = (outerValue, outerDimension) => {
      processInnerPromise(outerValue, outerDimension).then((result) => {
        console.log("result", result);
        secondCtx.drawImage(result, outerDimension, 0);
      });
    };

    let outerDimension = 0;

    const outerValues = shouldAllocateByRows
      ? individualSectionHeights
      : individualSectionWidths;

    const innerValues = shouldAllocateByRows
      ? individualSectionWidths
      : individualSectionHeights;

    for (const outerValue of outerValues) {
      processInner(outerValue, outerDimension);
      outerDimension += outerValue;
    }
  };
}
