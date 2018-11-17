declare var DTDefaultTextAlignment: string;
declare var DTDefaultFontStyle: string;
declare var DTIgnoreLinkStyleOption: string;
declare var DTDefaultFontFamily: string;
declare var DTUseiOS6Attributes: string;
declare var DTDocumentPreserveTrailingSpaces: string;
declare var DTDefaultLineBreakMode: string;
declare var NSTextSizeMultiplierDocumentOption: string;
declare var kCTLineBreakByWordWrapping: string;
declare var kCTLeftTextAlignment: string;
declare var NSAttributedStringEnumerationReverse: number;


declare namespace DTCoreTextFontDescriptor {
    function asyncPreloadFontLookupTable()
}

declare interface NSAttributedString {
     initWithHTMLDataOptionsDocumentAttributes(data, options, attr);
}
declare interface NSMutableAttributedString {
     initWithHTMLDataOptionsDocumentAttributes(data, options, attr);
}