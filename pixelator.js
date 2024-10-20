function blobToImageElement(blob) {
  const url = URL.createObjectURL(blob);
  const img = document.createElement("img");
  img.src = url;

  return new Promise((resolve) => {
    img.onload = () => resolve(img);
  });
}

function dataUrlToImageElement(dataUrl) {
  const img = new Image();
  img.src = dataUrl;

  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
}

function arrayBufferToImageElement(arrayBuffer) {
  const blob = new Blob([arrayBuffer], { type: "image/png" });
  blobToImageElement(blob);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas to Blob conversion failed"));
      }
    }, "image/png");
  });
}

function canvasToDataURL(canvas) {
  return canvas.toDataURL("iamge/png");
}

async function canvasToArrayBuffer(canvas) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  return blob.arrayBuffer();
}

function convertToImageElement(image, inputType) {
  switch (true) {
    case image instanceof HTMLImageElement:
      console.log("converting from HTMLImageElement");
      return image;
    case image instanceof Blob:
      console.log("converting from Blob");
      return blobToImageElement(image);
    case typeof image === "string" && image.startsWith("data:"):
      console.log("converting from dataURL");
      return dataUrlToImageElement(image);
    case image instanceof ArrayBuffer:
      console.log("converting from ArrayBuffer");
      return arrayBufferToImageElement(image);
    default:
      return ImageType.UNKNOWN;
  }
}

function convertToOutputType(canvas, OutputType) {
  switch (OutputType) {
    case "blob":
      return canvasToBlob(canvas);
    case "dataURL":
      return canvasToDataURL(canvas);
    case "arrayBuffer":
      return canvasToArrayBuffer(canvas);
    default:
      return canvas;
  }
}

export class Pixyelator {
  static toElement(imgInput, xPixels, yPixels, OutputType, InputType) {
    this.fromElement(imgInput, xPixels, yPixels);
  }

  static async fromElement(imgInput, xPixels, yPixels, OutputType) {
    const imgElement = await convertToImageElement(imgInput, "blah");

    const width = imgElement.naturalWidth;
    const height = imgElement.naturalHeight;

    const displayCanvas = await this._pixelateElement(
      imgElement,
      width,
      height,
      xPixels,
      yPixels
    );
    return convertToOutputType(displayCanvas, OutputType);
  }

  static _pixelateElement(element, width, height, xPixels, yPixels) {
    console.log(width, height);

    return new Promise((resolve, reject) => {
      if (xPixels > width || yPixels > height) {
        console.error("Number of pixels exceeds the dimensions of the image.");
        return;
      }

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

      const maxWorkers = navigator.hardwareConcurrency;
      let tasks = [];
      let resolvedTasks = 0;
      let activeWorkers = 0;

      const outerValues = shouldAllocateByRows
        ? individualSectionHeights
        : individualSectionWidths;

      const innerValues = shouldAllocateByRows
        ? individualSectionWidths
        : individualSectionHeights;

      let outerDimension = 0;

      outerValues.forEach((outerValue) => {
        tasks.push([outerValue, outerDimension]);
        outerDimension += outerValue;
      });

      tasks.forEach(() => {
        nextQueue();
      });

      function processInnerSlice(outerValue, outerDimension) {
        const [sliceX, sliceY, sliceWidth, sliceHeight] = shouldAllocateByRows
          ? [0, outerDimension, width, outerValue]
          : [outerDimension, 0, outerValue, height];
        return new Promise((resolve, reject) => {
          createImageBitmap(
            element,
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
              activeWorkers--;
              nextQueue();
            };
            innerWorker.onerror = (err) => {
              reject(err.data);
              innerWorker.terminate();
              activeWorkers--;
              nextQueue();
            };
          });
        });
      }

      function nextQueue() {
        if (tasks.length > 0 && activeWorkers < maxWorkers) {
          activeWorkers++;
          const [outerValue, outerDimension] = tasks.shift();

          return processInnerSlice(outerValue, outerDimension).then(
            (result) => {
              const [x, y] = shouldAllocateByRows
                ? [0, outerDimension]
                : [outerDimension, 0];

              displayCtx.drawImage(result, x, y);
              resolvedTasks++;
              if (resolvedTasks === outerValues.length) {
                resolve(displayCanvas);
              }
            }
          );
        }
      }
    });
  }
}
