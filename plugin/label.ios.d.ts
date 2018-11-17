import { LabelBase } from './label-common';
export * from './label-common';
declare module 'tns-core-modules/ui/text-base/text-base' {
    interface TextBase {
        _requestLayoutOnTextChanged(): any;
    }
}
export declare class Label extends LabelBase {
    nativeViewProtected: UITextView;
    static DTCORETEXT_INIT: boolean;
    constructor();
    createNativeView(): UITextView;
    initNativeView(): void;
    readonly ios: UITextView;
    private _fixedSize;
    _requestLayoutOnTextChanged(): void;
    onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void;
    htmlText: NSMutableAttributedString;
    updateHTMLString(): void;
    applyingNativeSetters: boolean;
    onResumeNativeUpdates(): void;
}
