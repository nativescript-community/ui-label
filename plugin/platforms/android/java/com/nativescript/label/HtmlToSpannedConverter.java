package com.nativescript.label;

import org.xml.sax.Attributes;
import org.xml.sax.Locator;
import org.xml.sax.SAXException;
import org.xml.sax.helpers.DefaultHandler;

import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.text.Html;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.ImageSpan;
import android.text.style.ParagraphStyle;
import android.text.style.QuoteSpan;
import android.text.style.RelativeSizeSpan;
import android.text.style.StrikethroughSpan;
import android.text.style.StyleSpan;
import android.text.style.SubscriptSpan;
import android.text.style.SuperscriptSpan;
import android.text.style.TextAppearanceSpan;
import android.text.style.TypefaceSpan;
import android.text.style.URLSpan;
import android.text.style.UnderlineSpan;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;

class HtmlToSpannedConverter extends DefaultHandler {
    private final String TAG = "HtmlToSpannedConverter";

//    private Attributes _currentAtts = null;
    public boolean disableLinkStyle = false;
    private SpannableStringBuilder mSpannableStringBuilder;

    private Html.ImageGetter mImageGetter;
    private float density;
    private String fontFolder;
    private Context context;

    public void reset() {
        mSpannableStringBuilder = new SpannableStringBuilder();
    }

    public HtmlToSpannedConverter(Context context, String fontFolder, Html.ImageGetter imageGetter,
                                  Html.TagHandler tagHandler, final boolean disableLinkStyle) {
        mSpannableStringBuilder = new SpannableStringBuilder();
        mImageGetter = imageGetter;
        this.fontFolder = fontFolder;
        this.context = context;
        this.disableLinkStyle = disableLinkStyle;
        density = context.getResources().getDisplayMetrics().density;
//        if (mImageGetter == null) {
//            mImageGetter = new Html.ImageGetter() {
//
//                @Override
//                public Drawable getDrawable(String source) {
//                    return null;
//                }
//            };
//        }
    }

    private final float[] HEADER_SIZES = {1.5f, 1.4f, 1.3f, 1.2f, 1.1f, 1f,};

    private void handleP(SpannableStringBuilder text) {
        int len = text.length();

        if (len >= 1 && text.charAt(len - 1) == '\n') {
            if (len >= 2 && text.charAt(len - 2) == '\n') {
                return;
            }

            text.append("\n");
            return;
        }

        if (len != 0) {
            text.append("\n\n");
        }
    }

    private void handleBr(SpannableStringBuilder text) {
        text.append("\n");
    }

    private Object getLast(Spanned text, Class kind) {
        /*
         * This knows that the last returned object from getSpans() will be the
         * most recently added.
         */
        Object[] objs = text.getSpans(0, text.length(), kind);

        if (objs.length == 0) {
            return null;
        } else {
            return objs[objs.length - 1];
        }
    }

    private void start(SpannableStringBuilder text, Object mark) {
        int len = text.length();
        text.setSpan(mark, len, len, Spannable.SPAN_MARK_MARK);
    }

    private void end(SpannableStringBuilder text, Class kind, Object repl) {
        int len = text.length();
        Object obj = getLast(text, kind);
        int where = text.getSpanStart(obj);
        text.removeSpan(obj);
        if (where != len) {
            if (Collection.class.isAssignableFrom(repl.getClass())) {
                Collection<Object> col = (Collection<Object>) repl;
                for (Object iterable_element : col) {
                    text.setSpan(iterable_element, where, len, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                }
            } else {
                text.setSpan(repl, where, len, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
    }

    private void startImg(SpannableStringBuilder text, Attributes attributes,
                          Html.ImageGetter img) {
        String src = attributes.getValue("src");
        Drawable d = null;

        if (img != null) {
            d = img.getDrawable(src);
            if (d != null) {
                int len = text.length();
                text.append("\uFFFC");

                text.setSpan(new ImageSpan(d, src), len, text.length(),
                        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            }

        }

        // if (d == null) {
        // d = Resources.getSystem().
        // getDrawable(com.android.internal.R.drawable.unknown_image);
        // d.setBounds(0, 0, d.getIntrinsicWidth(), d.getIntrinsicHeight());
        // }

    }

    private void startFont(SpannableStringBuilder text, Attributes attributes) {
        String color = attributes.getValue("color");
        String face = attributes.getValue("face");

        int len = text.length();
        text.setSpan(new FontSpan(color, face), len, len, Spannable.SPAN_MARK_MARK);
    }

    private void endFont(SpannableStringBuilder text) {
        int len = text.length();
        Object obj = getLast(text, FontSpan.class);
        int where = text.getSpanStart(obj);

        text.removeSpan(obj);

        if (where != len) {
            FontSpan f = (FontSpan) obj;

            if (!TextUtils.isEmpty(f.mColor)) {
                if (f.mColor.startsWith("@")) {
                    Resources res = Resources.getSystem();
                    String name = f.mColor.substring(1);
                    int colorRes = res.getIdentifier(name, "color", "android");
                    if (colorRes != 0) {
                        ColorStateList colors = res.getColorStateList(colorRes);
                        text.setSpan(new TextAppearanceSpan(null, 0, 0, colors,
                                        null), where, len,
                                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                    }
                } else {
                    int c = Color.parseColor(f.mColor);
                    if (c != -1) {
                        text.setSpan(new ForegroundColorSpan(c),
                                where, len, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                    }
                }
            }

            if (f.mFace != null) {
                text.setSpan(new TypefaceSpan(f.mFace), where, len,
                        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
    }

    private void startA(SpannableStringBuilder text, Attributes attributes) {
        String href = attributes.getValue("href");

        int len = text.length();
        text.setSpan(new Href(href), len, len, Spannable.SPAN_MARK_MARK);
    }

    private void endA(SpannableStringBuilder text) {
        int len = text.length();
        Object obj = getLast(text, Href.class);
        int where = text.getSpanStart(obj);

        text.removeSpan(obj);

        if (where != len) {
            Href h = (Href) obj;

            if (h.mHref != null) {
                if (disableLinkStyle) {
                    text.setSpan(new URLSpanNoUnderline(h.mHref), where, len,
                            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                } else {
                    text.setSpan(new URLSpan(h.mHref), where, len,
                            Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
                }

            }
        }
    }

    private void endHeader(SpannableStringBuilder text) {
        int len = text.length();
        Object obj = getLast(text, Header.class);

        int where = text.getSpanStart(obj);

        text.removeSpan(obj);

        // Back off not to change only the text, not the blank line.
        while (len > where && text.charAt(len - 1) == '\n') {
            len--;
        }

        if (where != len) {
            Header h = (Header) obj;

            text.setSpan(new RelativeSizeSpan(HEADER_SIZES[h.mLevel]), where,
                    len, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
            text.setSpan(new StyleSpan(Typeface.BOLD), where, len,
                    Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        }
    }

    private class Bold {
    }

    private class Italic {
    }

    private class Underline {
    }

    private class Big {
    }

    private class Small {
    }

    private class Monospace {
    }

    private class Blockquote {
    }

    private class Super {
    }

    private class Sub {
    }

    private class Span {
    }

    private class Div {
    }

    private class Strike {
    }

    private class FontSpan {
        public String mColor;
        public String mFace;

        public FontSpan(String color, String face) {
            mColor = color;
            mFace = face;
        }
    }

    private class Href {
        public String mHref;

        public Href(String href) {
            mHref = href;
        }
    }

    private class Header {
        private int mLevel;

        public Header(int level) {
            mLevel = level;
        }
    }

    // private void addText(String characters) {
    // StringBuilder sb = new StringBuilder();
    // /*
    // * Ignore whitespace that immediately follows other whitespace;
    // * newlines count as spaces.
    // */
    //
    // for (int i = 0; i < characters.length(); i++) {
    // char c = characters.charAt(i);
    //
    // if (c == ' ' || c == '\n') {
    // char pred;
    // int len = sb.length();
    //
    // if (len == 0) {
    // len = mSpannableStringBuilder.length();
    //
    // if (len == 0) {
    // pred = '\n';
    // } else {
    // pred = mSpannableStringBuilder.charAt(len - 1);
    // }
    // } else {
    // pred = sb.charAt(len - 1);
    // }
    //
    // if (pred != ' ' && pred != '\n') {
    // sb.append(' ');
    // }
    // } else {
    // sb.append(c);
    // }
    // }

    // mSpannableStringBuilder.append(characters);
    // }

    // hit when the node is first seen
    private LinkedList<Object> _currentStyles = new LinkedList<Object>();
    public void handleStartTag(String tag, Attributes attributes) {
//        _currentAtts = attributes;
        final String lowTag = tag.toLowerCase();
        switch (lowTag) {
            case "br":
                // We don't need to handle this. TagSoup will ensure that there's a
                // </br> for each <br>
                // so we can safely emite the linebreaks when we handle the close
                // tag.

                break;
            case "p":
                handleP(mSpannableStringBuilder);
                break;
            case "div":
                _currentStyles.add(getStyleSpan(attributes));
                handleP(mSpannableStringBuilder);
                start(mSpannableStringBuilder, new Div());
                break;
            case "strong":
            case "b":
                start(mSpannableStringBuilder, new Bold());
                break;
            case "cite":
            case "em":
            case "dfn":
            case "i":
                start(mSpannableStringBuilder, new Italic());
                break;
            case "big":
                start(mSpannableStringBuilder, new Big());
                break;
            case "small":
                start(mSpannableStringBuilder, new Small());
                break;
            case "font":
                startFont(mSpannableStringBuilder, attributes);
                break;
            case "blockquote":
                handleP(mSpannableStringBuilder);
                start(mSpannableStringBuilder, new Blockquote());
                break;
            case "tt":
                start(mSpannableStringBuilder, new Monospace());
                break;
            case "a":
                startA(mSpannableStringBuilder, attributes);
                break;
            case "u":
                start(mSpannableStringBuilder, new Underline());
                break;
            case "sup":
                start(mSpannableStringBuilder, new Super());
                break;
            case "sub":
                start(mSpannableStringBuilder, new Sub());
                break;
            case "strike":
                start(mSpannableStringBuilder, new Strike());
                break;
            case "span":
                _currentStyles.add(getStyleSpan(attributes));
                start(mSpannableStringBuilder, new Span());
                break;
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                handleP(mSpannableStringBuilder);
                start(mSpannableStringBuilder, new Header(tag.charAt(1) - '1'));
                break;
            case "img":
                startImg(mSpannableStringBuilder, attributes, mImageGetter);
                break;
        }
    }

    private Object getStyleSpan(Attributes attr) {
        String style = (attr != null) ? attr.getValue("style") : null;
        if (style != null) {
            String[] items = style.toLowerCase().trim().split(";");
            int fillColor = Color.TRANSPARENT;
            int strokeColor = Color.TRANSPARENT;
            String color = null;
            int strokeWidth = 1;
            int radius = 0;
            String fontWeight = null;
            String fontFamily = null;
            String fontStyle = null;
            float fontSize = 0;
            boolean needsBgdSpan = false;
            boolean needsFontSpan = false;
            for (String item : items) {
                String[] values = item.trim().split(":");
                String key = values[0];
                String value = values[1];
                switch (key) {

                    case "background-color":
                        fillColor = Color.parseColor(value);
                        needsBgdSpan = true;
                        break;
                    case "border-color":
                        strokeColor = Color.parseColor(value);
                        needsBgdSpan = true;
                        break;
                    case "border-width":
                        strokeWidth = Math.round(Float.parseFloat(value) * density);
                        needsBgdSpan = true;
                        break;
                    case "border-radius":
                        radius = Math.round(Float.parseFloat(value) * density);
                        needsBgdSpan = true;
                        break;
                    case "font-family":
                        fontFamily = value;
                        needsFontSpan = true;
                        break;
                    case "font-size":
                        fontSize = Float.parseFloat(value.replace("px", "").replace("pt", ""));
                        needsFontSpan = true;
                        break;
                    case "font-weight":
                        fontWeight = value;
                        needsFontSpan = true;
                        break;
                    case "font-style":
                        fontStyle = value;
                        needsFontSpan = true;
                        break;
                    case "color":
                        color = value;
                        needsFontSpan = true;
                        break;
                }
            }
            if (needsBgdSpan || needsFontSpan) {
                List<Object> result = new ArrayList<Object>();
                if (needsBgdSpan) {
                    result.add(new CustomBackgroundSpan(radius, fillColor, strokeColor,
                            strokeWidth));

                }
                if (needsFontSpan) {
                    boolean isBold = fontWeight != null && fontWeight.equals("bold") || fontWeight.equals("700");
                    if (fontFamily != null) {
                        result.add(new CustomTypefaceSpan(fontFamily, Font.createTypeface(this.context, this.fontFolder, fontFamily, fontWeight, isBold, false)));
                    } else {
                        if (fontWeight.equals("bold") || fontWeight.equals("700")) {
                            result.add(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD));
                        }
                    }
                    if (fontSize != 0) {
                        result.add(new AbsoluteSizeSpan(Math.round(fontSize * density)));
                    }
                    if (color != null) {
                        result.add(new ForegroundColorSpan(Color.parseColor(color)));
                    }
                    if (fontStyle != null) {
                        if (fontStyle.equals("italic")) {
                            result.add(new android.text.style.StyleSpan(android.graphics.Typeface.ITALIC));
                        }
                    }
                }
                return result;
            }
        }
        return null;
    }

    // hit when all of the node's children (if any) have been visited
    public void handleEndTag(String tag) {
        final String lowTag = tag.toLowerCase();
        switch (lowTag) {
            case "br":
                handleBr(mSpannableStringBuilder);
                break;
            case "p":
                handleP(mSpannableStringBuilder);
                break;
            case "div":
                handleP(mSpannableStringBuilder);
                end(mSpannableStringBuilder, Div.class, _currentStyles.pollLast());
                break;
            case "strong":
            case "b":
                end(mSpannableStringBuilder, Bold.class, new StyleSpan(
                        Typeface.BOLD));
                break;
            case "em":
            case "cite":
            case "dfn":
            case "i":
                end(mSpannableStringBuilder, Italic.class, new StyleSpan(
                        Typeface.ITALIC));
                break;
            case "big":
                end(mSpannableStringBuilder, Big.class, new RelativeSizeSpan(1.25f));
                break;
            case "small":
                end(mSpannableStringBuilder, Small.class,
                        new RelativeSizeSpan(0.8f));
                break;
            case "font":
                endFont(mSpannableStringBuilder);
                break;
            case "blockquote":
                handleP(mSpannableStringBuilder);
                end(mSpannableStringBuilder, Blockquote.class, new QuoteSpan());
                break;
            case "tt":
                end(mSpannableStringBuilder, Monospace.class, new TypefaceSpan(
                        "monospace"));
                break;
            case "a":
                endA(mSpannableStringBuilder);
                break;
            case "u":
                end(mSpannableStringBuilder, Underline.class, new UnderlineSpan());
                break;
            case "sup":
                end(mSpannableStringBuilder, Super.class, new SuperscriptSpan());
                break;
            case "sub":
                end(mSpannableStringBuilder, Sub.class, new SubscriptSpan());
                break;
            case "strike":
                end(mSpannableStringBuilder, Strike.class, new StrikethroughSpan());
                break;
            case "span":
                end(mSpannableStringBuilder, Span.class, _currentStyles.pollLast());
                break;
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
                handleP(mSpannableStringBuilder);
                endHeader(mSpannableStringBuilder);
                break;
        }
    }

    public Spanned spannable() {
        // Fix flags and range for paragraph-type markup.
        Object[] obj = mSpannableStringBuilder.getSpans(0,
                mSpannableStringBuilder.length(), ParagraphStyle.class);
        for (int i = 0; i < obj.length; i++) {
            int start = mSpannableStringBuilder.getSpanStart(obj[i]);
            int end = mSpannableStringBuilder.getSpanEnd(obj[i]);

            // If the last line of the range is blank, back off by one.
            if (end - 2 >= 0) {
                if (mSpannableStringBuilder.charAt(end - 1) == '\n'
                        && mSpannableStringBuilder.charAt(end - 2) == '\n') {
                    end--;
                }
            }

            if (end == start) {
                mSpannableStringBuilder.removeSpan(obj[i]);
            } else {
                mSpannableStringBuilder.setSpan(obj[i], start, end,
                        Spannable.SPAN_PARAGRAPH);
            }
        }

        return mSpannableStringBuilder;
    }

    @Override
    public void setDocumentLocator(Locator locator) {
    }

    @Override
    public void startDocument() throws SAXException {
    }

    @Override
    public void endDocument() throws SAXException {
    }

    @Override
    public void startPrefixMapping(String prefix, String uri)
            throws SAXException {
    }

    @Override
    public void endPrefixMapping(String prefix) throws SAXException {
    }

    @Override
    public void startElement(String uri, String localName, String qName,
                             Attributes attributes) throws SAXException {
        handleStartTag(localName, attributes);
    }

    @Override
    public void endElement(String uri, String localName, String qName)
            throws SAXException {
        handleEndTag(localName);
    }

    @Override
    public void characters(char ch[], int start, int length)
            throws SAXException {
        StringBuilder sb = new StringBuilder();
        /*
         * Ignore whitespace that immediately follows other whitespace; newlines
         * count as spaces.
         */
        for (int i = 0; i < length; i++) {
            char c = ch[i + start];
            if (c == ' ' || c == '\n') {
                char pred;
                int len = sb.length();
                if (len == 0) {
                    len = mSpannableStringBuilder.length();
                    if (len == 0) {
                        pred = '\n';
                    } else {
                        pred = mSpannableStringBuilder.charAt(len - 1);
                    }
                } else {
                    pred = sb.charAt(len - 1);
                }
                if (pred != ' ' && pred != '\n') {
                    sb.append(' ');
                }
            } else {
                sb.append(c);
            }
        }
        mSpannableStringBuilder.append(sb);
    }

    @Override
    public void ignorableWhitespace(char[] ch, int start, int length)
            throws SAXException {
    }

    @Override
    public void processingInstruction(String target, String data)
            throws SAXException {
    }

    @Override
    public void skippedEntity(String name) throws SAXException {
    }
}