import { htmlProperty, LabelBase, lineBreakProperty, maxLinesProperty, textShadowProperty } from './label-common';
import { layout } from 'tns-core-modules/utils/utils';
import { fontInternalProperty, Length, paddingBottomProperty, paddingLeftProperty, paddingRightProperty, paddingTopProperty, View } from 'tns-core-modules/ui/page/page';
import { Font } from 'tns-core-modules/ui/styling/font';
import { WhiteSpace, whiteSpaceProperty } from 'tns-core-modules/ui/text-base/text-base';
import { TextShadow } from './label';

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

function lineBreakToLineBreakMode(value: string) {
    switch (value) {
        case 'end':
            return NSLineBreakMode.ByTruncatingTail;
        case 'start':
            return NSLineBreakMode.ByTruncatingHead;
        case 'middle':
            return NSLineBreakMode.ByTruncatingMiddle;
        default:
        case 'none':
            return NSLineBreakMode.ByWordWrapping;
    }
}
function whiteSpaceToLineBreakMode(value: WhiteSpace) {
    switch (value) {
        case 'initial':
        case 'normal':
            return NSLineBreakMode.ByWordWrapping;
        default:
        case 'nowrap':
            return NSLineBreakMode.ByTruncatingTail;
    }
}

class ObserverClass extends NSObject {
    _owner: WeakRef<Label>;
    // NOTE: Refactor this - use Typescript property instead of strings....
    observeValueForKeyPathOfObjectChangeContext(path: string, tv: UITextView) {
        if (path === 'contentSize') {
            const owner = this._owner && this._owner.get();
            if (owner) {
                const inset = owner.nativeViewProtected.textContainerInset;
                const top = layout.toDeviceIndependentPixels(owner.effectivePaddingTop + owner.effectiveBorderTopWidth);

                switch (owner.verticalAlignment) {
                    case 'stretch': // not supported
                    case 'top':
                        owner.nativeViewProtected.textContainerInset = {
                            top,
                            left: inset.left,
                            bottom: inset.bottom,
                            right: inset.right
                        };
                        break;

                    case 'middle': {
                        const height = tv.sizeThatFits(CGSizeMake(tv.bounds.size.width, 10000)).height;
                        let topCorrect = (tv.bounds.size.height - height * tv.zoomScale) / 2.0;
                        topCorrect = topCorrect < 0.0 ? 0.0 : topCorrect;
                        // tv.contentOffset = CGPointMake(0, -topCorrect);
                        owner.nativeViewProtected.textContainerInset = {
                            top: top + topCorrect,
                            left: inset.left,
                            bottom: inset.bottom,
                            right: inset.right
                        };
                        break;
                    }

                    case 'bottom': {
                        const height = tv.sizeThatFits(CGSizeMake(tv.bounds.size.width, 10000)).height;
                        let bottomCorrect = tv.bounds.size.height - height * tv.zoomScale;
                        bottomCorrect = bottomCorrect < 0.0 ? 0.0 : bottomCorrect;
                        // tv.contentOffset = CGPointMake(0, -bottomCorrect);
                        owner.nativeViewProtected.textContainerInset = {
                            top: top + bottomCorrect,
                            left: inset.left,
                            bottom: inset.bottom,
                            right: inset.right
                        };
                        break;
                    }
                }
            }
        }
    }
}

export class Label extends LabelBase {
    private _observer: NSObject;
    nativeViewProtected: UITextView;
    nativeTextViewProtected: UITextView;
    static DTCORETEXT_INIT = false;
    constructor() {
        super();
        if (!Label.DTCORETEXT_INIT) {
            Label.DTCORETEXT_INIT = true;
            DTCoreTextFontDescriptor.asyncPreloadFontLookupTable();
        }
    }

    public createNativeView() {
        console.log('createNativeView', this);
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
        this._observer = ObserverClass.alloc();
        this._observer['_owner'] = new WeakRef(this);
        this.nativeViewProtected.addObserverForKeyPathOptionsContext(this._observer, 'contentSize', NSKeyValueObservingOptions.New, null);
        console.log('initNativeView', this);
        this.nativeViewProtected.attributedText = this.htmlText;
        // this.htmlText = null;
        // this.needsHTMLUpdate = false;
        // this.updatingHTML = false;
        // if (this.htmlText && this.needsHTMLUpdate) {
        // this.updateHTMLString();
        // }
    }
    public disposeNativeView() {
        super.disposeNativeView();
        if (this._observer) {
            this.nativeViewProtected.removeObserverForKeyPath(this._observer, 'contentSize');
            this._observer = null;
        }
    }

    get ios(): UITextView {
        return this.nativeViewProtected;
    }
    private _fixedSize: FixedSize;

    setTextDecorationAndTransform() {
        const style = this.style;
        const dict = new Map<string, any>();
        switch (style.textDecoration) {
            case 'none':
                break;
            case 'underline':
                // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
                dict.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.Single);
                break;
            case 'line-through':
                // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
                dict.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.Single);
                break;
            case 'underline line-through':
                // TODO: Replace deprecated `StyleSingle` with `Single` after the next typings update
                dict.set(NSUnderlineStyleAttributeName, NSUnderlineStyle.Single);
                dict.set(NSStrikethroughStyleAttributeName, NSUnderlineStyle.Single);
                break;
            default:
                throw new Error(`Invalid text decoration value: ${style.textDecoration}. Valid values are: 'none', 'underline', 'line-through', 'underline line-through'.`);
        }

        if (style.letterSpacing !== 0) {
            dict.set(NSKernAttributeName, style.letterSpacing * this.nativeTextViewProtected.font.pointSize);
        }

        const isTextView = this.nativeTextViewProtected instanceof UITextView;
        console.log('lineHeight', style.lineHeight, style.whiteSpace);
        if (style.lineHeight || style.whiteSpace || style['lineBreak']) {
            const paragraphStyle = NSMutableParagraphStyle.alloc().init();
            paragraphStyle.minimumLineHeight = style.lineHeight;
            // make sure a possible previously set text alignment setting is not lost when line height is specified
            paragraphStyle.alignment = (this.nativeTextViewProtected as UITextField | UITextView | UILabel).textAlignment;

            // make sure a possible previously set line break mode is not lost when line height is specified

            console.log('lineBreakMode', this.nativeTextViewProtected.textContainer.lineBreakMode);
            if (style['lineBreak']) {
                paragraphStyle.lineBreakMode = lineBreakToLineBreakMode(style['lineBreak']);
            } else if (style.whiteSpace) {
                paragraphStyle.lineBreakMode = whiteSpaceToLineBreakMode(style.whiteSpace);
            }
            dict.set(NSParagraphStyleAttributeName, paragraphStyle);
        } else if (isTextView) {
            const paragraphStyle = NSMutableParagraphStyle.alloc().init();
            paragraphStyle.alignment = this.nativeTextViewProtected.textAlignment;
            dict.set(NSParagraphStyleAttributeName, paragraphStyle);
        }

        if (style.color && (dict.size > 0 || isTextView)) {
            dict.set(NSForegroundColorAttributeName, style.color.ios);
        }

        const text = this.text;
        const string = text === undefined || text === null ? '' : text.toString();
        const source = string;
        console.log('setTextDecorationAndTransform', dict.size, isTextView);
        if (dict.size > 0 || isTextView) {
            if (isTextView) {
                // UITextView's font seems to change inside.
                dict.set(NSFontAttributeName, this.nativeTextViewProtected.font);
            }

            const result = NSMutableAttributedString.alloc().initWithString(source);
            result.setAttributesRange(dict as any, { location: 0, length: source.length });
            if (this.nativeTextViewProtected instanceof UIButton) {
                this.nativeTextViewProtected.setAttributedTitleForState(result, UIControlState.Normal);
            } else {
                this.nativeTextViewProtected.attributedText = result;
            }
        } else {
            if (this.nativeTextViewProtected instanceof UIButton) {
                // Clear attributedText or title won't be affected.
                this.nativeTextViewProtected.setAttributedTitleForState(null, UIControlState.Normal);
                this.nativeTextViewProtected.setTitleForState(source, UIControlState.Normal);
            } else {
                // Clear attributedText or text won't be affected.
                this.nativeTextViewProtected.attributedText = undefined;
                this.nativeTextViewProtected.text = source;
            }
        }
    }

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
        console.log('lineBreakProperty', value);
        nativeView.textContainer.lineBreakMode = lineBreakToLineBreakMode(value);
    }
    [textShadowProperty.setNative](value: TextShadow) {
        this.nativeTextViewProtected.layer.shadowOpacity = 1;
        this.nativeTextViewProtected.layer.shadowRadius = value.blurRadius;
        this.nativeTextViewProtected.layer.shadowColor = value.color.ios.CGColor;
        this.nativeTextViewProtected.layer.shadowOffset = CGSizeMake(value.offsetX, value.offsetY);
        this.nativeTextViewProtected.layer.shouldRasterize = true;
        this.nativeTextViewProtected.layer.masksToBounds = false;
    }
    [whiteSpaceProperty.setNative](value: WhiteSpace) {
        const nativeView = this.nativeTextViewProtected;
        console.log('whiteSpaceProperty', value);

        nativeView.textContainer.lineBreakMode = whiteSpaceToLineBreakMode(value);
    }
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
