self.onmessage = (e) => {
  const data = new Uint8ClampedArray(e.data);

  const length = data.length;
  const valueOccurence = length / 4;

  let i = 0;
  let r = 0,
    g = 0,
    b = 0,
    a = 0;

  while (i < length) {
    [r, g, b, a] = [
      r + data[i],
      g + data[i + 1],
      b + data[i + 2],
      a + data[i + 3],
    ];
    i += 4;
  }

  r = Math.floor(r / valueOccurence);
  g = Math.floor(g / valueOccurence);
  b = Math.floor(b / valueOccurence);
  a = Math.floor(a / valueOccurence);

  postMessage([r, g, b, a]);
};
