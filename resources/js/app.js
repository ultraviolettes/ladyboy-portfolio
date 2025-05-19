import { animate, createAnimatable, eases, utils } from 'animejs';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './column-scroll.js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

import.meta.glob([
  '../img/**',
  '../fonts/**',
]);
