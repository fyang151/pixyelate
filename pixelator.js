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

    const displayCanvas = document.getElementById("displayCanvas");

    const displayCtx = displayCanvas.getContext("2d");

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
            width,
            height,
            outerValue,
            innerValues,
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
        const [x, y] = shouldAllocateByRows
          ? [0, outerDimension]
          : [outerDimension, 0];

        displayCtx.drawImage(result, x, y);
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
