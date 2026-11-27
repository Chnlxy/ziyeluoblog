export interface BrightStar {
  id: string;
  rightAscensionHours: number;
  declinationDegrees: number;
  magnitude: number;
  colorIndex?: number;
}

// J2000 positions and magnitudes from d3-celestial's BSD-3-Clause
// stars.6.json dataset. Only the 50 brightest entries are bundled.
export const brightStars: BrightStar[] = [
  { id: "hip-32349", rightAscensionHours: 6.75248, declinationDegrees: -16.7161, magnitude: -1.44, colorIndex: 0.009 },
  { id: "hip-30438", rightAscensionHours: 6.3992, declinationDegrees: -52.6957, magnitude: -0.62, colorIndex: 0.164 },
  { id: "hip-69673", rightAscensionHours: 14.26102, declinationDegrees: 19.1824, magnitude: -0.05, colorIndex: 1.239 },
  { id: "hip-71683", rightAscensionHours: 14.66014, declinationDegrees: -60.834, magnitude: -0.01, colorIndex: 0.71 },
  { id: "hip-91262", rightAscensionHours: 18.615647, declinationDegrees: 38.7837, magnitude: 0.03, colorIndex: -0.001 },
  { id: "hip-24608", rightAscensionHours: 5.278153, declinationDegrees: 45.998, magnitude: 0.08, colorIndex: 0.795 },
  { id: "hip-24436", rightAscensionHours: 5.2423, declinationDegrees: -8.2016, magnitude: 0.18, colorIndex: -0.03 },
  { id: "hip-37279", rightAscensionHours: 7.655033, declinationDegrees: 5.225, magnitude: 0.4, colorIndex: 0.432 },
  { id: "hip-7588", rightAscensionHours: 1.628567, declinationDegrees: -57.2368, magnitude: 0.45, colorIndex: -0.158 },
  { id: "hip-27989", rightAscensionHours: 5.919527, declinationDegrees: 7.4071, magnitude: 0.45, colorIndex: 1.5 },
  { id: "hip-68702", rightAscensionHours: 14.063727, declinationDegrees: -60.373, magnitude: 0.61, colorIndex: -0.231 },
  { id: "hip-97649", rightAscensionHours: 19.846387, declinationDegrees: 8.8683, magnitude: 0.76, colorIndex: 0.221 },
  { id: "hip-60718", rightAscensionHours: 12.443307, declinationDegrees: -63.0991, magnitude: 0.77, colorIndex: -0.243 },
  { id: "hip-21421", rightAscensionHours: 4.59868, declinationDegrees: 16.5093, magnitude: 0.87, colorIndex: 1.538 },
  { id: "hip-65474", rightAscensionHours: 13.41988, declinationDegrees: -11.1613, magnitude: 0.98, colorIndex: -0.235 },
  { id: "hip-80763", rightAscensionHours: 16.490127, declinationDegrees: -26.432, magnitude: 1.06, colorIndex: 1.865 },
  { id: "hip-37826", rightAscensionHours: 7.755267, declinationDegrees: 28.0262, magnitude: 1.16, colorIndex: 0.991 },
  { id: "hip-113368", rightAscensionHours: 22.960847, declinationDegrees: -29.6222, magnitude: 1.17, colorIndex: 0.145 },
  { id: "hip-102098", rightAscensionHours: 20.690533, declinationDegrees: 45.2803, magnitude: 1.25, colorIndex: 0.092 },
  { id: "hip-62434", rightAscensionHours: 12.795353, declinationDegrees: -59.6888, magnitude: 1.25, colorIndex: -0.238 },
  { id: "hip-71681", rightAscensionHours: 14.659747, declinationDegrees: -60.8372, magnitude: 1.35, colorIndex: 0.9 },
  { id: "hip-49669", rightAscensionHours: 10.139533, declinationDegrees: 11.9672, magnitude: 1.36, colorIndex: -0.087 },
  { id: "hip-33579", rightAscensionHours: 6.9771, declinationDegrees: -28.9721, magnitude: 1.5, colorIndex: -0.211 },
  { id: "hip-36850", rightAscensionHours: 7.576627, declinationDegrees: 31.8883, magnitude: 1.58, colorIndex: 0.034 },
  { id: "hip-61084", rightAscensionHours: 12.519433, declinationDegrees: -57.1132, magnitude: 1.59, colorIndex: 1.6 },
  { id: "hip-85927", rightAscensionHours: 17.560147, declinationDegrees: -37.1038, magnitude: 1.62, colorIndex: -0.231 },
  { id: "hip-25336", rightAscensionHours: 5.418853, declinationDegrees: 6.3497, magnitude: 1.64, colorIndex: -0.224 },
  { id: "hip-25428", rightAscensionHours: 5.4382, declinationDegrees: 28.6075, magnitude: 1.65, colorIndex: -0.13 },
  { id: "hip-45238", rightAscensionHours: 9.219993, declinationDegrees: -69.7172, magnitude: 1.67, colorIndex: 0.07 },
  { id: "hip-26311", rightAscensionHours: 5.60356, declinationDegrees: -1.2019, magnitude: 1.69, colorIndex: -0.184 },
  { id: "hip-109268", rightAscensionHours: 22.13722, declinationDegrees: -46.961, magnitude: 1.73, colorIndex: -0.07 },
  { id: "hip-26727", rightAscensionHours: 5.679313, declinationDegrees: -1.9426, magnitude: 1.74, colorIndex: -0.199 },
  { id: "hip-39953", rightAscensionHours: 8.158873, declinationDegrees: -47.3366, magnitude: 1.75, colorIndex: -0.145 },
  { id: "hip-62956", rightAscensionHours: 12.900487, declinationDegrees: 55.9598, magnitude: 1.76, colorIndex: -0.022 },
  { id: "hip-90185", rightAscensionHours: 18.402867, declinationDegrees: -34.3846, magnitude: 1.79, colorIndex: -0.031 },
  { id: "hip-15863", rightAscensionHours: 3.40538, declinationDegrees: 49.8612, magnitude: 1.79, colorIndex: 0.481 },
  { id: "hip-54061", rightAscensionHours: 11.062133, declinationDegrees: 61.751, magnitude: 1.81, colorIndex: 1.061 },
  { id: "hip-34444", rightAscensionHours: 7.13986, declinationDegrees: -26.3932, magnitude: 1.83, colorIndex: 0.671 },
  { id: "hip-67301", rightAscensionHours: 13.792347, declinationDegrees: 49.3133, magnitude: 1.85, colorIndex: -0.099 },
  { id: "hip-41037", rightAscensionHours: 8.375233, declinationDegrees: -59.5095, magnitude: 1.86, colorIndex: 1.196 },
  { id: "hip-86228", rightAscensionHours: 17.62198, declinationDegrees: -42.9978, magnitude: 1.86, colorIndex: 0.406 },
  { id: "hip-28360", rightAscensionHours: 5.992147, declinationDegrees: 44.9474, magnitude: 1.9, colorIndex: 0.077 },
  { id: "hip-82273", rightAscensionHours: 16.81108, declinationDegrees: -69.0277, magnitude: 1.91, colorIndex: 1.447 },
  { id: "hip-31681", rightAscensionHours: 6.628527, declinationDegrees: 16.3993, magnitude: 1.93, colorIndex: 0.001 },
  { id: "hip-42913", rightAscensionHours: 8.74506, declinationDegrees: -54.7088, magnitude: 1.93, colorIndex: 0.043 },
  { id: "hip-100751", rightAscensionHours: 20.42746, declinationDegrees: -56.7351, magnitude: 1.94, colorIndex: -0.118 },
  { id: "hip-11767", rightAscensionHours: 2.5303, declinationDegrees: 89.2641, magnitude: 1.97, colorIndex: 0.636 },
  { id: "hip-30324", rightAscensionHours: 6.378327, declinationDegrees: -17.9559, magnitude: 1.98, colorIndex: -0.24 },
  { id: "hip-46390", rightAscensionHours: 9.459787, declinationDegrees: -8.6586, magnitude: 1.99, colorIndex: 1.44 },
  { id: "hip-50583", rightAscensionHours: 10.332873, declinationDegrees: 19.8415, magnitude: 2.01, colorIndex: 1.128 },
];
