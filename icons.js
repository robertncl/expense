import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// 24px line icons with a 2px square-capped stroke, per the Modernist system. Always paired with a word.
const Icon = ({ size = 20, color, children }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="square"
    accessibilityElementsHidden
    importantForAccessibility="no"
  >
    {children}
  </Svg>
);

export const GlobeIcon = props => (
  <Icon {...props}>
    <Circle cx="12" cy="12" r="9" />
    <Path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
  </Icon>
);

export const PlusIcon = props => (
  <Icon {...props}>
    <Path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CloseIcon = props => (
  <Icon {...props}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const CheckIcon = props => (
  <Icon {...props}>
    <Path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const RepeatIcon = props => (
  <Icon {...props}>
    <Path d="M4 11V9h13l-3-3M20 13v2H7l3 3" />
  </Icon>
);
