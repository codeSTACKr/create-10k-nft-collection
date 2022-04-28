// Offsets for where to place the rarity image from the top left corner of the image.
const offset_x = 10;
const offset_y = 10;

// This uses the highest rarity image it can based on thresholds
// (This list need not be in order)
const rarity_thresholds = [
  { threshold: 120, image: "cross.png" },
  { threshold: 90, image: "square.png" },
  { threshold: 30, image: "triangle.png" },
  { threshold: 0, image: "circle.png" },
];

module.exports = {
  offset_x,
  offset_y,
  rarity_thresholds,
};
