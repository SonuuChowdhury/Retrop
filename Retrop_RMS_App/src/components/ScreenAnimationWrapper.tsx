import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import { ReactNode } from 'react';

interface ScreenAnimationWrapperProps {
  children: ReactNode;
  isGoingBack?: boolean;
}

export const ScreenAnimationWrapper = ({
  children,
  isGoingBack = false,
}: ScreenAnimationWrapperProps) => {
  return (
    <Animated.View
      entering={isGoingBack ? FadeIn : SlideInRight}
      exiting={isGoingBack ? SlideOutLeft : FadeOut}
      style={{ flex: 1 }}
    >
      {children}
    </Animated.View>
  );
};
