package com.nativescript.label;

import android.content.Context;
import android.content.res.AssetManager;
import android.graphics.Typeface;
import android.os.Build;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.style.TypefaceSpan;
import android.util.Log;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;

import androidx.core.text.HtmlCompat;

public class Font {
    static AssetManager appAssets;
    static HashMap<String, Typeface> typefaceCache = new HashMap();

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
                Log.w(TAG, "Could not find font file for " + fontFamily);
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
            return "";
        case FontWeight.MEDIUM:
        case FontWeight.SEMI_BOLD:
            return Build.VERSION.SDK_INT >= 21 ? "-medium" : "";
        case FontWeight.BOLD:
        case "700":
        case FontWeight.EXTRA_BOLD:
            return "";
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

        String[] split = value.split(",");
        for (int i = 0; i < split.length; i++) {
            String str = split[i].trim().replaceAll("['\"]+", "");
            if (str != null) {
                result.add(str);
            }
        }

        return result;
    }

    public static Typeface createTypeface(Context context, String fontFolder, String fontFamily, String fontWeight,
            boolean isBold, boolean isItalic) {
        int fontStyle = 0;
        if (isBold) {
            fontStyle |= Typeface.BOLD;
        }
        if (isItalic) {
            fontStyle |= Typeface.ITALIC;
        }

        // http://stackoverflow.com/questions/19691530/valid-values-for-androidfontfamily-and-what-they-map-to
        ArrayList<String> fonts = parseFontFamily(fontFamily);
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
                    result = Typeface.create(result, fontStyle);
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

        return result;
    }

    public static SpannableStringBuilder stringBuilderFromHtmlString(Context context, String fontFolder,
            String htmlString) {
        if (htmlString == null) {
            return null;
        }
        Spanned spannedString = HtmlCompat.fromHtml(htmlString, HtmlCompat.FROM_HTML_MODE_COMPACT);
        SpannableStringBuilder builder = new SpannableStringBuilder(spannedString);

        TypefaceSpan[] spans = builder.getSpans(0, builder.length(), android.text.style.TypefaceSpan.class);
        for (int index = 0; index < spans.length; index++) {
            TypefaceSpan span = spans[index];
            int start = builder.getSpanStart(span);
            int end = builder.getSpanEnd(span);
            String fontFamily = span.getFamily();
            String[] split = fontFamily.split("-");
            String style = null;
            if (split.length > 1) {
                style = split[1];
            }
            // String style = fontFamily.split("-")[1] || builder.removeSpan(span);
            // const
            // font = new Font(fontFamily, 0, style == = 'italic' ? 'italic' : 'normal',
            // style == = 'bold' ? 'bold' : 'normal');
            Typeface typeface = createTypeface(context, fontFolder, fontFamily, style == "bold" ? "bold" : "normal",
                    style == "bold", style == "italic");

            if (typeface == null) {
                typeface = Typeface.create(fontFamily, Typeface.NORMAL);
            }
            if (typeface != null) {
                TypefaceSpan typefaceSpan = new CustomTypefaceSpan(fontFamily, typeface);
                builder.setSpan(typefaceSpan, start, end, android.text.Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            }
        }

        // const ssb = new android.text.SpannableStringBuilder();
        // for (let i = 0, spanStart = 0, spanLength = 0, length =
        // formattedString.spans.length; i < length; i++) {
        // const span = formattedString.spans.getItem(i);
        // const text = span.text;
        // const textTransform = (<TextBase>formattedString.parent).textTransform;
        // let spanText = (text === null || text === undefined) ? "" : text.toString();
        // if (textTransform && textTransform !== "none") {
        // spanText = getTransformedText(spanText, textTransform);
        // }

        // spanLength = spanText.length;
        // if (spanLength > 0) {
        // ssb.insert(spanStart, spanText);
        // setSpanModifiers(ssb, span, spanStart, spanStart + spanLength);
        // spanStart += spanLength;
        // }
        // }

        return builder;
    }
}
