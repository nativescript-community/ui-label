declare class LabelLinkGestureRecognizer extends UITapGestureRecognizer {
    static alloc(): LabelLinkGestureRecognizer; // inherited from NSObject

    static new(): LabelLinkGestureRecognizer; // inherited from NSObject

    linkAttribute: string;

    tapDelegate: UILabelLinkHandlerTapDelegate;

    constructor(o: { delegate: UILabelLinkHandlerTapDelegate });

    handleTapWithTapGesture(tapGesture: UIGestureRecognizer): void;

    initWithDelegate(withDelegate: UILabelLinkHandlerTapDelegate): this;
}

declare class NSLabel extends UILabel {
    static alloc(): NSLabel; // inherited from NSObject

    static appearance(): NSLabel; // inherited from UIAppearance

    static appearanceForTraitCollection(trait: UITraitCollection): NSLabel; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): NSLabel; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
        trait: UITraitCollection,
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NSLabel; // inherited from UIAppearance

    static appearanceWhenContainedIn(ContainerClass: typeof NSObject): NSLabel; // inherited from UIAppearance

    static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]): NSLabel; // inherited from UIAppearance

    static new(): NSLabel; // inherited from NSObject

    borderThickness: UIEdgeInsets;

    padding: UIEdgeInsets;

    textContainerInset: UIEdgeInsets;

    zoomScale: number;

    commonInit(): void;
}

declare class NSLabelUtils extends NSObject {
    static alloc(): NSLabelUtils; // inherited from NSObject

    static insetWithRectUIEdgeInsets(rect: CGRect, uIEdgeInsets: UIEdgeInsets): CGRect;

    static new(): NSLabelUtils; // inherited from NSObject

    static setTextDecorationAndTransformOnViewTextTextDecorationLetterSpacingLineHeightColor(
        view: UIView,
        text: string,
        textDecoration: string,
        letterSpacing: number,
        lineHeight: number,
        color: UIColor
    ): void;
    static updateFontRatioRatio(view: UIView, ratio: number): void;
}

declare class NSTextView extends UITextView {
    static alloc(): NSTextView; // inherited from NSObject

    static appearance(): NSTextView; // inherited from UIAppearance

    static appearanceForTraitCollection(trait: UITraitCollection): NSTextView; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): NSTextView; // inherited from UIAppearance

    static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(
        trait: UITraitCollection,
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NSTextView; // inherited from UIAppearance

    static appearanceWhenContainedIn(ContainerClass: typeof NSObject): NSTextView; // inherited from UIAppearance

    static appearanceWhenContainedInInstancesOfClasses(
        containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]
    ): NSTextView; // inherited from UIAppearance

    static new(): NSTextView; // inherited from NSObject

    static textViewUsingTextLayoutManager(usingTextLayoutManager: boolean): NSTextView; // inherited from UITextView

    borderThickness: UIEdgeInsets;

    padding: UIEdgeInsets;

    commonInit(): void;
}

interface UILabelLinkHandlerTapDelegate {
    onLinkTapped(value: any): void;
}
// eslint-disable-next-line no-redeclare
declare const UILabelLinkHandlerTapDelegate: {
    prototype: UILabelLinkHandlerTapDelegate;
};

interface NSAttributedString {
    hasAttribute(attribute: string): boolean;
}
