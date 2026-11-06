import { Image } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';
import { IconName, icons } from '../assets/icons';

type Props = {
  name: IconName;
  /** Rendered edge length; defaults must match the SVG's root width/height from Figma. */
  size: number;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
};

/** Renders an exported Figma SVG at its exact design size. */
export function Icon({ name, size, width, height, style }: Props) {
  return (
    <Image
      source={icons[name]}
      contentFit="fill"
      style={[{ width: width ?? size, height: height ?? size }, style]}
      accessibilityElementsHidden
    />
  );
}
