import * as React from 'react';
import 'react-native';

declare module 'react-native' {
  interface View extends React.Component<any, any> {}
  interface Text extends React.Component<any, any> {}
  interface TextInput extends React.Component<any, any> {}
  interface ActivityIndicator extends React.Component<any, any> {}
  interface Pressable extends React.Component<any, any> {}
  interface ScrollView extends React.Component<any, any> {}
  interface TouchableOpacity extends React.Component<any, any> {}
  interface Modal extends React.Component<any, any> {}
  interface KeyboardAvoidingView extends React.Component<any, any> {}
  interface Switch extends React.Component<any, any> {}
  interface Image extends React.Component<any, any> {}
  interface RefreshControl extends React.Component<any, any> {}
}

declare module 'expo-router' {
  export const Link: any;
  export const useRouter: any;
  export const useLocalSearchParams: <T = any>() => T;
  export const useSegments: any;
  export const Stack: any;
  export const Redirect: any;
  export type Href = any;
}

declare module 'expo-router/ui' {
  export const Tabs: any;
  export const TabList: any;
  export const TabTrigger: any;
  export const TabSlot: any;
  export type TabTriggerSlotProps = any;
  export type TabListProps = any;
}

declare global {
  namespace JSX {
    interface Element extends React.JSX.Element {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
    interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
  }
}
