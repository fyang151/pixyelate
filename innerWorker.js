onmessage = (e) => {
  const getSingleRGBA = (rgbaData) => {
    const length = rgbaData.length;
    const valueOccurence = length / 4;

    let i = 0;
    let r = 0,
      g = 0,
      b = 0,
      a = 0;

    while (i < length) {
      [r, g, b, a] = [
        r + rgbaData[i],
        g + rgbaData[i + 1],
        b + rgbaData[i + 2],
        a + rgbaData[i + 3],
      ];
      i += 4;
    }

    r = Math.floor(r / valueOccurence);
    g = Math.floor(g / valueOccurence);
    b = Math.floor(b / valueOccurence);
    a = Math.floor(a / valueOccurence);

    return [r, g, b, a];
  };

  const [
    imageBitmap,
    outerValue,
    outerDimension,
    innerValues,
    individualSectionWidths,
    individualSectionHeights,
    shouldAllocateByRows,
  ] = e.data;

  const imageWidth = shouldAllocateByRows ? imageBitmap.width : outerValue;
  const imageHeight = shouldAllocateByRows ? outerValue : imageBitmap.height;

  const canvas = new OffscreenCanvas(imageWidth, imageHeight);
  const ctx = canvas.getContext("2d", {
    willReadFrequently: true,
  });
  ctx.drawImage(imageBitmap, 0, 0);

  // console.log("should allocate by rows", shouldAllocateByRows);

  const wholeImageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
  console.log("whole image data", wholeImageData);

  let innerDimension = 0;

  for (const innerValue of innerValues) {
    const [x, y] = shouldAllocateByRows
      ? [innerDimension, 0]
      : [0, innerDimension];

    const sectionWidth = shouldAllocateByRows ? innerValue : outerValue;
    const sectionHeight = shouldAllocateByRows ? outerValue : innerValue;

    console.log("x, y, width, height", x, y, sectionWidth, sectionHeight);
    const imageData = ctx.getImageData(x, y, sectionWidth, sectionHeight);

    const [r, g, b, a] = getSingleRGBA(imageData.data);

    console.log("imagedata", [r, g, b, a], x, y);

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    ctx.fillRect(x, y, sectionWidth, sectionHeight);

    innerDimension += innerValue;
  }

  const resultBitmap = canvas.transferToImageBitmap();
  self.postMessage(resultBitmap, [resultBitmap]);
};
