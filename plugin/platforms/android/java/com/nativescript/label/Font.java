package com.nativescript.label;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Typeface;
import android.os.Build;
import android.text.SpannableStringBuilder;
import android.text.style.AbsoluteSizeSpan;
import android.text.style.BackgroundColorSpan;
import android.text.style.ForegroundColorSpan;
import android.text.style.TypefaceSpan;
import android.util.Log;

import org.xml.sax.InputSource;

import java.io.File;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.StringTokenizer;

import javax.xml.parsers.SAXParser;
import javax.xml.parsers.SAXParserFactory;

public class Font {
    static AssetManager appAssets;
    static HashMap<String, Typeface> typefaceCache = new HashMap();
    static HashMap<String, Typeface> typefaceCreatedCache = new HashMap();

    static final String TAG = "Font";

    public static Typeface loadFontFromFile(Context context, String fontFolder, String fontFamily) {
        if (typefaceCache.containsKey(fontFamily)) {
            return typefaceCache.get(fontFamily);
        }
        if (fontFamily.startsWith("res/")) {
            int fontID = context.getResources().getIdentifier(fontFamily.substring(4), "font",
                    context.getPackageName());
            Typeface result = androidx.core.content.res.ResourcesCompat.getFont(context, fontID);
            if (result != null) {
                typefaceCache.put(fontFamily, result);
            }
            return result;
        }

        if (appAssets == null) {
            appAssets = context.getAssets();
        }
        if (appAssets == null) {
            return null;
        }

        Typeface result = typefaceCache.get(fontFamily);
        // Check for undefined explicitly as null mean we tried to load the font, but
        // failed.
        File file = new File(fontFolder, fontFamily + ".ttf");
        // const basePath = fs.path.join(fs.knownFolders.currentApp().path, "fonts",
        // fontFamily);

        if (!file.exists()) {
            file = new File(fontFolder, fontFamily + ".otf");
            if (!file.exists()) {
                Log.w(TAG, "Could not find font file for " + fontFamily + " in folder " + fontFolder);
                return null;
            }

        }

        try {
            result = Typeface.createFromFile(file.getAbsolutePath());
        } catch (Exception e) {
            Log.w(TAG, "\"Error loading font asset: " + file.getAbsolutePath() + "," + e.getLocalizedMessage());
        }
        typefaceCache.put(fontFamily, result);

        return result;
    }

    public interface FontWeight {
        String THIN = "100";
        String EXTRA_LIGHT = "200";
        String LIGHT = "300";
        String NORMAL = "normal";
        String MEDIUM = "500";
        String SEMI_BOLD = "600";
        String BOLD = "bold";
        String EXTRA_BOLD = "800";
        String BLACK = "900";
    }

    public interface genericFontFamilies {
        String serif = "serif";
        String sansSerif = "sans-serif";
        String monospace = "monospace";
        String system = "system";
    }

    public static int getIntFontWeight(String fontWeight) {
        if (fontWeight == null) {
            return 400;
        }
        switch (fontWeight) {
            case FontWeight.NORMAL:
                return 400;
            case FontWeight.BOLD:
            case "semibold":
                return 500;
            case "thin":
                return 100;
            case "light":
                return 300;
            case "black":
                return 900;
            default:
                return Integer.parseInt(fontWeight, 10);
        }
    }

    public static String getFontWeightSuffix(String fontWeight) {
        if (fontWeight == null) {
            return "";
        }
        switch (fontWeight) {
            case FontWeight.THIN:
                return Build.VERSION.SDK_INT >= 16 ? "-thin" : "";
            case FontWeight.EXTRA_LIGHT:
            case FontWeight.LIGHT:
                return Build.VERSION.SDK_INT >= 16 ? "-light" : "";
            case FontWeight.NORMAL:
            case "400":
            case "":
                return "";
            case FontWeight.MEDIUM:
            case FontWeight.SEMI_BOLD:
                return Build.VERSION.SDK_INT >= 21 ? "-medium" : "";
            case FontWeight.BOLD:
            case "700":
            case FontWeight.EXTRA_BOLD:
            return Build.VERSION.SDK_INT >= 21 ? "-bold" : "";
            case FontWeight.BLACK:
                return Build.VERSION.SDK_INT >= 21 ? "-black" : "";
            default:
                throw new Error("Invalid font weight:" + fontWeight);
        }
    }

    public static ArrayList<String> parseFontFamily(String value) {
        ArrayList<String> result = new ArrayList();
        if (value == null) {
            return result;
        }
        if (!value.contains(",")) {
            result.add(value.replace("'", "").replace("\"", ""));
            return result;
        }

        // not removing the "['\"]+" and not trimming make the parseFontFamily much
        // faster!
        // should be done in span/text properties
        StringTokenizer st = new StringTokenizer(value, ",");
        while (st.hasMoreTokens()) {
            result.add(st.nextToken().replace("'", "").replace("\"", "").trim());
        }
        return result;
    }

    public static Typeface createTypeface(Context context, String fontFolder, String fontFamily, String fontWeight,
            boolean isBold, boolean isItalic) {
        final String cacheKey = fontFamily + fontWeight + isBold + isItalic;
        if (typefaceCreatedCache.containsKey(cacheKey)) {
            return typefaceCreatedCache.get(cacheKey);
        }
        int fontStyle = 0;
        if (isBold) {
            fontStyle |= Typeface.BOLD;
        }
        if (isItalic) {
            fontStyle |= Typeface.ITALIC;
        }
        // Log.d(TAG, "createTypeface: " + fontFamily + ",fontFolder " + fontFolder +",fontWeight " + fontWeight);
        int fontWeightInt = getIntFontWeight(fontWeight);

        // http://stackoverflow.com/questions/19691530/valid-values-for-androidfontfamily-and-what-they-map-to
        ArrayList<String> fonts = parseFontFamily(fontFamily);
        // Log.d(TAG, "createTypeface1: " + fonts.toString());
        Typeface result = null;
        for (int i = 0; i < fonts.size(); i++) {
            switch (fonts.get(i).toLowerCase()) {
                case genericFontFamilies.serif:
                    result = Typeface.create("serif" + getFontWeightSuffix(fontWeight), fontStyle);
                    break;

                case genericFontFamilies.sansSerif:
                case genericFontFamilies.system:
                    result = Typeface.create("sans-serif" + getFontWeightSuffix(fontWeight), fontStyle);
                    break;

                case genericFontFamilies.monospace:
                    result = Typeface.create("monospace" + getFontWeightSuffix(fontWeight), fontStyle);
                    break;

                default:
                    result = loadFontFromFile(context, fontFolder, fonts.get(i));

                    if (result != null && fontStyle != 0) {
//                        if (Build.VERSION.SDK_INT >= 28)
//                            result = Typeface.create(result, fontStyle, fontWeightInt, isItalic);
//                        } else {
                            result = Typeface.create(result, fontStyle); 
//                        }
                    }
                    break;
            }

            if (result != null) {
                // Found the font!
                break;
            }
        }

        if (result == null) {
            result = Typeface.create("sans-serif" + getFontWeightSuffix(fontWeight), fontStyle);
        }
        typefaceCreatedCache.put(cacheKey, result);
        return result;
    }

    public static SpannableStringBuilder stringBuilderFromHtmlString(Context context, String fontFolder,
            String htmlString) {
        if (htmlString == null) {
            return null;
        }
        // Spanned spannedString = HtmlCompat.fromHtml(htmlString,
        // HtmlCompat.FROM_HTML_MODE_COMPACT);

        CharSequence spannedString = fromHtml(htmlString, context, fontFolder,false);
        SpannableStringBuilder builder = new SpannableStringBuilder(spannedString);

        // TypefaceSpan[] spans = builder.getSpans(0, builder.length(), android.text.style.TypefaceSpan.class);
        // for (int index = 0; index < spans.length; index++) {
        //     TypefaceSpan span = spans[index];
        //     int start = builder.getSpanStart(span);
        //     int end = builder.getSpanEnd(span);
        //     String fontFamily = span.getFamily();
        //     String[] split = fontFamily.split("-");
        //     String style = null;
        //     if (split.length > 1) {
        //         style = split[1];
        //     }
        //     Typeface typeface = createTypeface(context, fontFolder, fontFamily,
        //     (style != null) && style.equals("bold") ? "bold" : "normal", (style != null) && style.equals("bold"), (style != null) && style.equals("italic"));

        //     if (typeface == null) {
        //         typeface = Typeface.create(fontFamily, Typeface.NORMAL);
        //     }
        //     if (typeface != null) {
        //         TypefaceSpan typefaceSpan = new CustomTypefaceSpan(fontFamily, typeface);
        //         builder.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        //     }
        // }

        return builder;
    }

    static char SpanSeparator = (char) 0x1F;
    static char PropertySeparator = (char) 0x1E;

    static ArrayList<ArrayList<String>> parseFormattedString(String formattedString) {
        ArrayList<ArrayList<String>> result = new ArrayList();

        final int len = formattedString.length();
        String buffer = "";
        ArrayList<String> spanProps = new ArrayList();
        for (int i = 0; i < len; i++) {
            char c = formattedString.charAt(i);
            if (c == PropertySeparator) {
                spanProps.add(buffer);
                buffer = "";
            } else if (c == SpanSeparator) {
                spanProps.add(buffer);
                result.add(spanProps);
                buffer = "";
                spanProps = new ArrayList();
            } else {
                buffer += c;
            }
        }
        spanProps.add(buffer);
        result.add(spanProps);

        return result;
    }

    public static void setSpanModifiers(Context context, String fontFolder, SpannableStringBuilder ssb,
            ArrayList<String> span, int start, int end) {
        boolean bold = span.get(2).equals("bold") || span.get(2).equals("700");
        boolean italic = span.get(3).equals("1");

        if (bold && italic) {
            ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD_ITALIC), start, end,
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        } else if (bold) {
            ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.BOLD), start, end,
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        } else if (italic) {
            ssb.setSpan(new android.text.style.StyleSpan(android.graphics.Typeface.ITALIC), start, end,
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        String fontFamily = span.get(0);
        if (!fontFamily.equals("0")) {
            Typeface typeface = createTypeface(context, fontFolder, fontFamily, span.get(2), bold, italic);
            // const font = new Font(fontFamily, 0, (italic) ? "italic" : "normal", (bold) ?
            // "bold" : "normal");
            // const typeface = font.getAndroidTypeface() ||
            // android.graphics.Typeface.create(fontFamily, 0);
            TypefaceSpan typefaceSpan = new CustomTypefaceSpan(fontFamily, typeface);
            ssb.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        String fontSize = span.get(1);
        if (!fontSize.equals("-1")) {
            ssb.setSpan(
                    new AbsoluteSizeSpan(Math
                            .round(Float.parseFloat(fontSize) * context.getResources().getDisplayMetrics().density)),
                    start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        String color = span.get(5);
        if (!color.equals("-1")) {
            ssb.setSpan(new ForegroundColorSpan(Integer.parseInt(color)), start, end,
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        String backgroundColor = span.get(6);

        if (!backgroundColor.equals("-1")) {
            ssb.setSpan(new BackgroundColorSpan(Integer.parseInt(backgroundColor)), start, end,
                    android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
        }

        String textDecoration = span.get(4);
        if (!textDecoration.equals("0")) {
            if (textDecoration.contains("underline")) {
                ssb.setSpan(new android.text.style.UnderlineSpan(), start, end,
                        android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }

            if (textDecoration.contains("line-through")) {
                ssb.setSpan(new android.text.style.StrikethroughSpan(), start, end,
                        android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }
//        long stopTime = System.nanoTime();
        // TODO: Implement letterSpacing for Span here.
        // const letterSpacing = formattedString.parent.style.letterSpacing;
        // if (letterSpacing > 0) {
        // ssb.setSpan(new android.text.style.ScaleXSpan((letterSpacing + 1) / 10),
        // start, end, android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE);
        // }
    }

    public static SpannableStringBuilder stringBuilderFromFormattedString(Context context, String fontFolder,
            String formattedString) {
        if (formattedString == null) {
            return null;
        }
        ArrayList<ArrayList<String>> parsedFormattedString = parseFormattedString(formattedString);
        SpannableStringBuilder ssb = new SpannableStringBuilder();
        for (int i = 0, spanStart = 0, spanLength = 0, length = parsedFormattedString.size(); i < length; i++) {
            ArrayList<String> span = parsedFormattedString.get(i);
            String text = span.get(7);
            spanLength = text.length();
            if (spanLength > 0) {
                ssb.insert(spanStart, text);
                setSpanModifiers(context, fontFolder, ssb, span, spanStart, spanStart + spanLength);
                spanStart += spanLength;
            }
        }

        return ssb;
    }
    static SAXParser saxParser = null;
   static  HtmlToSpannedConverter converter = null;
    public static CharSequence fromHtml(CharSequence html, Context context, String fontFolder, final boolean disableLinkStyle) {
//        long startTime = System.nanoTime();
//        XMLReader xmlReader;
        try {
            if (saxParser == null) {
                SAXParserFactory factory = SAXParserFactory.newInstance();
                 saxParser = factory.newSAXParser();
            }
            if (converter == null) {
                converter = new HtmlToSpannedConverter(context, fontFolder, null, null, disableLinkStyle);
            } else {
                converter.reset();
                converter.disableLinkStyle = disableLinkStyle;
            }
//            Log.d(TAG, "parse: " +html);
            final String toParse = "<doc>" + ((String) html).replaceAll("<br>", "<br></br>") + "</doc>";
            saxParser.parse(new InputSource(new StringReader(toParse)), converter);
//            Log.d(TAG, "fromHtml: " + ((System.nanoTime() - startTime)/1000000) + "ms");
            return converter.spannable();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return html;
    }

    public static CharSequence fromHtml(Context context, String fontFolder, CharSequence html) {
        return fromHtml(html, context, fontFolder, false);
    }
}
