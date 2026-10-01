
export const colors = {
  white: '#e6e6e6',
  orange: '#ff4d00',
  black: '#000000',
  grey: '#666666',
  darkGrey: '#2e2e2e',
  lightGrey: '#c4c4c4',
} as const;

export type Color = typeof colors[keyof typeof colors];


export const cssVariables = {
  white: '--basement-white',
  orange: '--basement-orange',
  black: '--basement-black',
  grey: '--basement-grey',
  darkGrey: '--basement-dark-grey',
  lightGrey: '--basement-light-grey',
} as const;
