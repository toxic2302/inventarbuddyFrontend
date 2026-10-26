import {definePreset} from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const surface = {
  0: '#ffffff',
  50: '{neutral.50}',
  100: '{neutral.100}',
  200: '{neutral.200}',
  300: '{neutral.300}',
  400: '{neutral.400}',
  500: '{neutral.500}',
  600: '{neutral.600}',
  700: '{neutral.700}',
  800: '{neutral.800}',
  900: '{neutral.900}',
  950: '{neutral.950}',
};

/** Aura mit Primärfarbe "rose" und Surface "neutral". */
export const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{rose.50}',
      100: '{rose.100}',
      200: '{rose.200}',
      300: '{rose.300}',
      400: '{rose.400}',
      500: '{rose.500}',
      600: '{rose.600}',
      700: '{rose.700}',
      800: '{rose.800}',
      900: '{rose.900}',
      950: '{rose.950}',
    },
    colorScheme: {
      light: {surface},
      dark: {surface},
    },
  },
});
