import { LabelBase } from './label-common';
import { TextTransform } from 'tns-core-modules/ui/text-base/text-base';
export * from './label-common';
export declare class Label extends LabelBase {
    nativeViewProtected: android.widget.TextView;
    createNativeView(): globalAndroid.widget.TextView;
    initNativeView(): void;
    resetNativeView(): void;
}
export declare function getTransformedText(text: string, textTransform: TextTransform): string;
