export class Pixelator {
  static pixelateFromElement = (imgElement, xPixels, yPixels) => {
    const getSingleRGBA = (x, y, width, height) => {
      return new Promise((resolve, reject) => {
        const imageData = ctx.getImageData(x, y, width, height).data;

        const worker = new Worker("worker.js");
        worker.postMessage(imageData.buffer, [imageData.buffer]);
        worker.onmessage = (e) => {
          resolve(e.data);
          worker.terminate();
        };
        worker.onerror = (err) => {
          reject(err);
          worker.terminate();
        };
      });
    };

    const processSingleRGBA = (x, y, width, height) => {
      getSingleRGBA(x, y, width, height).then(([r, g, b, a]) => {
        displayCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        displayCtx.fillRect(x, y, width, height);
      });
    };

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

    console.log("widths", individualSectionWidths);
    console.log("heights", individualSectionHeights);

    console.log(
      "calculated width",
      individualSectionWidths.reduce((acc, current) => acc + current)
    );
    console.log("actual width", width);
    console.log(
      "calculated height",
      individualSectionHeights.reduce((acc, current) => acc + current)
    );
    console.log("actual height", height);

    const numWorkers = navigator.hardwareConcurrency;
    console.log("numworkers", numWorkers);

    const secondCanvas = document.getElementById("secondCanvas");
    const secondCtx = secondCanvas.getContext("2d");

    secondCanvas.width = width;
    secondCanvas.height = height;

    const processInnerPromise = (outerValue, outerDimension) => {
      // const sliceWidth = shouldAllocateByRows ? width : outerValue;
      // const sliceHeight = shouldAllocateByRows ? outerValue : height;

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

    // const sampleOuterValue = outerValues[0];
    // processInner(sampleOuterValue);

    for (const outerValue of outerValues) {
      processInner(outerValue, outerDimension);

      // let innerDimension = 0;

      // for (const innerValue of innerValues) {
      //   const [x, y, width, height] = shouldAllocateByRows
      //     ? [innerDimension, outerDimension, innerValue, outerValue]
      //     : [outerDimension, innerDimension, outerValue, innerValue];
      //   processSingleRGBA(x, y, width, height);

      //   innerDimension += innerValue;
      // }
      outerDimension += outerValue;
    }
  };
}
