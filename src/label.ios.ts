import { htmlProperty, LabelBase, lineBreakProperty, maxLinesProperty } from './label-common';
import { layout } from 'tns-core-modules/utils/utils';
import { fontInternalProperty, Length, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, View } from 'tns-core-modules/ui/page/page';
import { Font } from 'tns-core-modules/ui/styling/font';
import { WhiteSpace, whiteSpaceProperty } from 'tns-core-modules/ui/text-base/text-base';

export * from './label-common';
enum FixedSize {
    NONE = 0,
    WIDTH = 1,
    HEIGHT = 2,
    BOTH = 3
}

declare module 'tns-core-modules/ui/text-base/text-base' {
    interface TextBase {
        _requestLayoutOnTextChanged();
    }
}

export class Label extends LabelBase {
    nativeViewProtected: UITextView;
    static DTCORETEXT_INIT = false;
    constructor() {
        super();
        if (!Label.DTCORETEXT_INIT) {
            Label.DTCORETEXT_INIT = true;
            DTCoreTextFontDescriptor.asyncPreloadFontLookupTable();
        }
    }

    public createNativeView() {
        // console.log('createNativeView', this);
        const view = UITextView.new();
        if (!view.font) {
            view.font = UIFont.systemFontOfSize(12);
        }
        view.scrollEnabled = false;
        view.editable = false;
        view.selectable = false;
        view.backgroundColor = UIColor.clearColor;
        view.userInteractionEnabled = true;
        view.dataDetectorTypes = UIDataDetectorTypes.All;
        view.textContainerInset = {
            top: 0,
            left: 0,
            bottom: 0,
            right: 0
        };
        return view;
    }

    public initNativeView() {
        super.initNativeView();
        // console.log('initNativeView', this);
        this.nativeViewProtected.attributedText = this.htmlText;
        // this.htmlText = null;
        // this.needsHTMLUpdate = false;
        // this.updatingHTML = false;
        // if (this.htmlText && this.needsHTMLUpdate) {
        // this.updateHTMLString();
        // }
    }
    // public disposeNativeView() {
    // super.disposeNativeView();
    // this.htmlText = null;
    // this.needsHTMLUpdate = false;
    // this.updatingHTML = false;
    // if (this.htmlText && this.needsHTMLUpdate) {
    //     this.updateHTMLString();
    // }
    // }

    get ios(): UITextView {
        return this.nativeViewProtected;
    }
    private _fixedSize: FixedSize;

    _requestLayoutOnTextChanged(): void {
        if (this._fixedSize === FixedSize.BOTH) {
            return;
        }
        if (this._fixedSize === FixedSize.WIDTH && !this.textWrap && this.getMeasuredHeight() > 0) {
            // Single line label with fixed width will skip request layout on text change.
            return;
        }
        super._requestLayoutOnTextChanged();
    }
    public onMeasure(widthMeasureSpec: number, heightMeasureSpec: number): void {
        const nativeView = this.nativeViewProtected;
        if (nativeView) {
            const width = layout.getMeasureSpecSize(widthMeasureSpec);
            const widthMode = layout.getMeasureSpecMode(widthMeasureSpec);

            const height = layout.getMeasureSpecSize(heightMeasureSpec);
            const heightMode = layout.getMeasureSpecMode(heightMeasureSpec);

            const desiredSize = layout.measureNativeView(nativeView, width, widthMode, height, heightMode);

            const labelWidth = widthMode === layout.AT_MOST ? Math.min(desiredSize.width, width) : desiredSize.width;
            const measureWidth = Math.max(labelWidth, this.effectiveMinWidth);
            const measureHeight = Math.max(desiredSize.height, this.effectiveMinHeight);

            const widthAndState = View.resolveSizeAndState(measureWidth, width, widthMode, 0);
            const heightAndState = View.resolveSizeAndState(measureHeight, height, heightMode, 0);

            this.setMeasuredDimension(widthAndState, heightAndState);
        }
    }

    [htmlProperty.getDefault](): string {
        return null;
    }

    htmlText: NSMutableAttributedString;
    // needsHTMLUpdate = false;
    // updatingHTML = false;
    updateHTMLString() {
        // if (!this.nativeViewProtected || !this.needsHTMLUpdate || this.updatingHTML) {
        //     return;
        // }
        // this.updatingHTML = true;
        if (!this.html) {
            this.htmlText = null;
        } else {
            let htmlString = this.html;

            let fontFamily,
                fontSize = UIFont.labelFontSize;
            if (!!this.style.fontInternal) {
                if (!!this.style.fontInternal.fontFamily) {
                    fontFamily = this.style.fontInternal.fontFamily[0] === "'" ? this.style.fontInternal.fontFamily.replace(/'/g, '') : this.style.fontInternal.fontFamily;
                } else {
                    fontFamily = UIFont.systemFontOfSize(10).familyName;
                }
                if (this.style.fontInternal.fontSize) {
                    fontSize = this.style.fontInternal.fontSize;
                }
            }
            // console.log('span', fontFamily, fontSize);

            htmlString = `<span style="font-family: ${fontFamily}; font-size:${fontSize};">${htmlString}</span>`;
            const nsString = NSString.stringWithString(htmlString);
            // console.log('updateHTMLString1', htmlString);
            const nsData = nsString.dataUsingEncoding(NSUTF8StringEncoding);
            const options = {
                [DTDefaultTextAlignment]: kCTLeftTextAlignment,
                // [NSTextSizeMultiplierDocumentOption]: 1,
                // [DTIgnoreLinkStyleOption]: false,
                // [DTDefaultFontFamily]: fontFamily,
                // [NSFontAttributeName]: fontFamily,
                [NSTextSizeMultiplierDocumentOption]: 17 / 12.0,
                [DTUseiOS6Attributes]: true,
                [DTDocumentPreserveTrailingSpaces]: true
                // [DTDefaultLineBreakMode]: kCTLineBreakByWordWrapping
            } as any;
            this.htmlText = NSMutableAttributedString.alloc().initWithHTMLDataOptionsDocumentAttributes(nsData, options, null);
            this.htmlText.enumerateAttributesInRangeOptionsUsingBlock(
                { location: 0, length: this.htmlText.length },
                NSAttributedStringEnumerationReverse,
                (attributes: NSDictionary<any, any>, range, stop) => {
                    if (!!attributes.valueForKey('DTGUID')) {
                        // We need to remove this attribute or links are not colored right
                        //
                        // @see https://github.com/Cocoanetics/DTCoreText/issues/792
                        this.htmlText.removeAttributeRange('CTForegroundColorFromContext', range);
                    }
                }
            );
            // console.log('updateHTMLString', this, this.html);
            // const nsString = NSString.stringWithString(htmlString);
            // // console.log('updateHTMLString1');
            // const nsData = nsString.dataUsingEncoding(NSUnicodeStringEncoding);
            // // console.log('creating NSAttributedString', htmlString, nsData.length, new Error().stack);
            // this.htmlText = NSAttributedString.alloc().initWithDataOptionsDocumentAttributesError(
            //     nsData,
            //     <any>{
            //         [NSDocumentTypeDocumentAttribute]: NSHTMLTextDocumentType
            //         // [NSCharacterEncodingDocumentAttribute]: NSUTF8StringEncoding
            //     },
            //     null
            // );
            // console.log('updateHTMLString', 'done');

            // this.needsHTMLUpdate = false;
            this._requestLayoutOnTextChanged();
        }
        if (this.nativeViewProtected) {
            this.nativeViewProtected.attributedText = this.htmlText;
        }
        // this.updatingHTML = false;
    }
    applyingNativeSetters = false;
    public onResumeNativeUpdates(): void {
        // Applying native setters...
        this.applyingNativeSetters = true;
        super.onResumeNativeUpdates();
        this.applyingNativeSetters = false;
    }
    [htmlProperty.setNative](value: string) {
        // this.htmlText = value;
        // console.log('htmlProperty', this, value !== this.html, !! this.htmlText);
        // if (this.needsHTMLUpdate || !this.style.fontInternal) {
        // this.needsHTMLUpdate = true;
        if (!this.style.fontInternal || !this.applyingNativeSetters) {
            this.updateHTMLString();
        }
        // }
    }
    [fontInternalProperty.getDefault](): UIFont {
        const nativeView = this.nativeViewProtected;
        return nativeView.font;
    }
    [fontInternalProperty.setNative](value: Font | UIFont) {
        // console.log('fontInternalProperty', this, !!this.html, new Error().stack);
        super[fontInternalProperty.setNative](value);
        // this.needsHTMLUpdate = true;
        // font setter always called after html
        if (this.html) {
            this.updateHTMLString();
        }
    }

    [paddingTopProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.top,
            unit: 'px'
        };
    }
    [paddingTopProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const top = layout.toDeviceIndependentPixels(this.effectivePaddingTop + this.effectiveBorderTopWidth);
        this.nativeViewProtected.textContainerInset = {
            top,
            left: inset.left,
            bottom: inset.bottom,
            right: inset.right
        };
    }

    [paddingRightProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.right,
            unit: 'px'
        };
    }
    [paddingRightProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const right = layout.toDeviceIndependentPixels(this.effectivePaddingRight + this.effectiveBorderRightWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left: inset.left,
            bottom: inset.bottom,
            right
        };
    }

    [paddingBottomProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.bottom,
            unit: 'px'
        };
    }
    [paddingBottomProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const bottom = layout.toDeviceIndependentPixels(this.effectivePaddingBottom + this.effectiveBorderBottomWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left: inset.left,
            bottom,
            right: inset.right
        };
    }
    [paddingLeftProperty.getDefault](): Length {
        return {
            value: this.nativeViewProtected.textContainerInset.left,
            unit: 'px'
        };
    }
    [paddingLeftProperty.setNative](value: Length) {
        const inset = this.nativeViewProtected.textContainerInset;
        const left = layout.toDeviceIndependentPixels(this.effectivePaddingLeft + this.effectiveBorderLeftWidth);
        this.nativeViewProtected.textContainerInset = {
            top: inset.top,
            left,
            bottom: inset.bottom,
            right: inset.right
        };
    }
    [maxLinesProperty.getDefault](): number | string {
        return 'none';
    }
    [maxLinesProperty.setNative](value: number | string) {
        if (value === 'none') {
            this.nativeViewProtected.textContainer.maximumNumberOfLines = 0;
        } else {
            this.nativeViewProtected.textContainer.maximumNumberOfLines = value as number;
        }
    }
    [lineBreakProperty.setNative](value: string) {
        const nativeView = this.nativeTextViewProtected;
        switch (value) {
            case 'end':
                nativeView.lineBreakMode = NSLineBreakMode.ByTruncatingTail;
                break;
            case 'start':
                nativeView.lineBreakMode = NSLineBreakMode.ByTruncatingHead;
                break;
            case 'middle':
                nativeView.lineBreakMode = NSLineBreakMode.ByTruncatingMiddle;
                break;
            case 'none':
                nativeView.lineBreakMode = NSLineBreakMode.ByWordWrapping;
                break;
        }
    }
    // [whiteSpaceProperty.setNative](value: WhiteSpace) {
    //     const nativeView = this.nativeTextViewProtected;
    //     switch (value) {
    //         case 'initial':
    //         case 'normal':
    //             nativeView.lineBreakMode = NSLineBreakMode.ByWordWrapping;
    //             break;
    //         case 'nowrap':
    //             nativeView.lineBreakMode = NSLineBreakMode.ByTruncatingTail;
    //             break;
    //     }
    // }
    // [autoFontSizeProperty.getDefault](): boolean {
    //     return this.nativeViewProtected.adjustsFontSizeToFitWidth;
    // }
    // [maxLinesProperty.setNative](value: number | string) {
    //     if (value === 'none') {
    //         this.nativeViewProtected.textContainer.maximumNumberOfLines = 0;
    //     } else {
    //         this.nativeViewProtected.textContainer.maximumNumberOfLines = value as number;
    //     }
    // }
}
