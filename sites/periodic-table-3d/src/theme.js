/* Shared rendering palette: the same atlas under night and daylight conditions. */
import { CATEGORIES } from './elements.js';

export const RENDER_THEMES = {
  dark: {
    light: false, tileTop: '#12211D', tileBottom: '#0A1714',
    text: '#F7F7F7', secondary: '#D8E2EC', muted: '#8FA8A0', column: '#6E8A82',
    placeholder: '#0B1714', placeholderText: '#B6B6B6', border: '#B7B6B657',
    fog: '#04120F', fogDensity: 0.0075, stars: '#9FD8CC', starOpacity: 0.75,
    exposure: 1.18, ambient: 0.62, key: 1.05, rim: '#67E8C8', rimIntensity: 0.35,
    edgeFactor: 0.24, edgeEmission: 0.22, back: '#0A1714', emissionScale: 1,
    shells: ['#8FFBDC', '#5FE8C8', '#3AD9C0', '#2AC9B8', '#25B9B0', '#2AA8C8', '#3F97D8'],
    orbitOpacity: 0.55, orbitHalo: 0.09, orbit2d: '#78F0CD73',
    core: '#EAFFF7', halo: '#9CFFE4', trail: '#6FE9CE', haloOpacity: 0.75, trailOpacity: 0.5,
    atomGlow: '#3DF5A8', atomGlowScale: 1, atomGlow2d: '#3DF5A838',
    proton: '#FF8A50', protonEmissive: '#FF5A28', protonEdge: '#FFC8A0E6',
    neutron: '#4FA8FF', neutronEmissive: '#2E7FE0', neutronEdge: '#B4DCFFE6',
    nucleonEmission: 1, pointLight: 1,
  },
  light: {
    light: true, tileTop: '#FFFFFF', tileBottom: '#F0F4F2',
    text: '#1A1A1A', secondary: '#34463F', muted: '#52645D', column: '#52645D',
    placeholder: '#E8EEEA', placeholderText: '#52645D', border: '#AABCB2',
    fog: '#F7F7F7', fogDensity: 0.004, stars: '#57786B', starOpacity: 0.16,
    exposure: 1, ambient: 1.7, key: 2.2, rim: '#D4E3DB', rimIntensity: 0.6,
    edgeFactor: 0.72, edgeEmission: 0, back: '#DCE7E0', emissionScale: 0,
    shells: ['#216C59', '#287F6D', '#327484', '#376889', '#576C87', '#64648D', '#775E86'],
    orbitOpacity: 0.86, orbitHalo: 0.035, orbit2d: '#216C59BD',
    core: '#155D4D', halo: '#5EA590', trail: '#397F70', haloOpacity: 0.15, trailOpacity: 0.3,
    atomGlow: '#7CA995', atomGlowScale: 0.35, atomGlow2d: '#7CA99518',
    proton: '#C96031', protonEmissive: '#A4441B', protonEdge: '#743E27',
    neutron: '#3B7FAC', neutronEmissive: '#2E648E', neutronEdge: '#294E6D',
    nucleonEmission: 0.08, pointLight: 0.12,
  },
};
const LIGHT_CATEGORIES = {
  alkali: '#A84330', alkaline: '#8B641E', transition: '#24745D', post: '#5D5CA6',
  metalloid: '#26758A', nonmetal: '#7651A0', halogen: '#786C1D', noble: '#326FA6',
  lanthanide: '#A54C61', actinide: '#95517D',
};
let activeTheme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
export const getTheme = () => activeTheme;
export const renderTheme = () => RENDER_THEMES[activeTheme];
export const categoryColor = key => activeTheme === 'light' ? LIGHT_CATEGORIES[key] : CATEGORIES[key].color;
export function onThemeChange(listener) {
  window.addEventListener('elementa:themechange', listener);
  return () => window.removeEventListener('elementa:themechange', listener);
}
export function setTheme(name) {
  if (!Object.hasOwn(RENDER_THEMES, name)) return;
  const changed = name !== activeTheme;
  activeTheme = name;
  document.documentElement.dataset.theme = name;
  try { localStorage.setItem('elementa-theme', name); } catch { /* Storage is optional. */ }
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === name));
  });
  if (changed) window.dispatchEvent(new Event('elementa:themechange'));
}
export function initThemeControls() {
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.themeChoice === activeTheme));
    button.addEventListener('click', () => setTheme(button.dataset.themeChoice));
  });
}
