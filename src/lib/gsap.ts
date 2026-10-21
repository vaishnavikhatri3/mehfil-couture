import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Strong ease-out — entrances. Matches the CSS --ease-out token. */
export const EASE_OUT = "expo.out";
export { gsap, ScrollTrigger, useGSAP };
