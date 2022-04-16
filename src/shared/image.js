function newMatrix(y, x, defaultValue) {
  return new Array(y).fill(null).map(() => new Array(x).fill(defaultValue));
}
function forEachValueIn(matrix, func) {
  const ylen = matrix.length;
  const xlen = matrix[0].length;
  for (let y = 0; y < ylen; y++) {
    for (let x = 0; x < xlen; x++) {
      func(matrix[y][x], x, y);
    }
  }
}
function getMinMaxFromMatrix(matrix) {
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  forEachValueIn(matrix, (val) => {
    if (val < min) {
      min = val;
    } else if (val > max) {
      max = val;
    }
  });
  return { min, max };
}
export function getImageDataFromBlob(blob) {
  return new Promise((resolve) => {
    if (!blob) return;
    if (!blob.type.match("image.*")) {
      return alert("File must be an image!");
    }
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = (evt) => {
      var _a;
      if (
        ((_a = evt.target) === null || _a === void 0
          ? void 0
          : _a.readyState) == FileReader.DONE
      ) {
        const image = new Image();
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) {
          return alert('Error: canvas.getContext("2d") returned NULL 🤯');
        }
        image.src = evt.target.result || "";
        image.onload = () => {
          const { width, height } = image;
          canvas.width = width;
          canvas.height = height;
          context.drawImage(image, 0, 0, width, height);
          resolve({
            getPixel: (x, y) => {
              const { data } = context.getImageData(x, y, 1, 1);
              console.assert(data.length === 4);
              return Array.from(data);
            },
            width,
            height,
          });
        };
      }
    };
  });
}
export function getPixelMatrix({
  getPixel,
  width,
  height,
  select,
  resolution,
  stretchX = 1,
}) {
  const ratio = width / height;
  const ylen = resolution;
  const xlen = Math.ceil(ylen * ratio * stretchX);
  const matrix = newMatrix(ylen, xlen, -1);
  console.table({
    width,
    height,
    select,
    resolution,
    ratio,
    ylen,
    xlen,
  });
  for (let y = 0; y < ylen; y++) {
    for (let x = 0; x < xlen; x++) {
      const pixel = getPixel(
        Math.floor((width / xlen) * x),
        Math.floor((height / ylen) * y)
      );
      matrix[y][x] = select(pixel);
    }
  }
  return { matrix };
}
