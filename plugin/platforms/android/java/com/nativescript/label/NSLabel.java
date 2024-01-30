package com.nativescript.label;

import java.lang.CharSequence;
import androidx.appcompat.widget.AppCompatTextView;
import com.nativescript.text.TextView;
import android.content.Context;
import android.graphics.Paint;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
import android.text.method.MovementMethod;
import android.text.style.URLSpan;
import android.text.TextUtils.TruncateAt;
import android.view.Gravity;
import android.view.LayoutInflater;
import androidx.core.widget.TextViewCompat;

public class NSLabel extends TextView {
    static int layoutId = -1;
    private int lineHeight = -1;

    public NSLabel(Context context) {
        super(context);
    }
    public NSLabel(Context context, android.util.AttributeSet attrs) {
        super(context, attrs);
    }

    public static boolean attributedStringHasURLSpan(android.text.Spanned attributeString) {
        return attributedStringHasSpan(attributeString, URLSpan.class);
    }

    public static NSLabel inflateLayout(Context context) {
        if (layoutId == -1) {
            layoutId = context.getResources().getIdentifier("ns_label", "layout", context.getPackageName());
        }
        LayoutInflater inflater = (LayoutInflater)context.getSystemService
      (Context.LAYOUT_INFLATER_SERVICE);
      return (NSLabel)inflater.inflate(layoutId, null);
    }

    @Override
    public void setMaxLines (int maxLines) {
        super.setMaxLines(maxLines);
    }

    @Override
    public void setTextColor (int color) {
        super.setTextColor(color);
    }
    public void setLabelText(String text) {
        super.setText(text);
    }
    public void setLabelText(CharSequence text) {
        super.setText(text);
    }

    @Override
    public void setTextIsSelectable (boolean value) {
        super.setTextIsSelectable(value);
    }

    public void setLineBreak (String value) {
        switch (value) {
            case "end":
                setEllipsize(TruncateAt.END);
                break;
            case "start":
                setEllipsize(TruncateAt.START);
                break;
            case "marquee":
                setEllipsize(TruncateAt.MARQUEE);
                break;
            case "middle":
                setEllipsize(TruncateAt.MIDDLE);
                break;
            case "none":
                setEllipsize(null);
                break;
        }
    }

    public void setWhiteSpace (String value) {
        switch (value) {
                case "initial":
                case "normal":
                    setSingleLine(false);
                    setEllipsize(null);
                    break;
                case "nowrap":
                    setSingleLine(true);
                    setEllipsize(TruncateAt.END);
                    break;
            }
    }

    @Override
    public void setShadowLayer (float radius, 
        float dx, 
        float dy, 
        int color) {
        super.setShadowLayer(radius, dx, dy, color);
    }

    protected int getHorizontalGravity(String textAlignment) {
        if (textAlignment == null) {
            return Gravity.START;
        }
        switch (textAlignment) {
            case "center":
                return Gravity.CENTER_HORIZONTAL;
            case "right":
                return Gravity.END;
            default:
                return Gravity.START;
        }
    }

    protected int getVerticalGravity(String textAlignment) {
        if (textAlignment == null) {
            return Gravity.TOP;
        }
        switch (textAlignment) {
            case "middle":
            case "center":
                return Gravity.CENTER_VERTICAL;
            case "bottom":
                return Gravity.BOTTOM;
            default:
                return Gravity.TOP;
        }
    }

    public void setVerticalTextAlignment (String value, String textAlignment) {
        setGravity(getHorizontalGravity(textAlignment) | getVerticalGravity(value));
    }

    public void setLabelTextAlignment (String value, String verticalTextAlignment) {
       if (Build.VERSION.SDK_INT >= 26) {
            if (value == "justify") {
                setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_INTER_WORD);
            } else {
                setJustificationMode(android.text.Layout.JUSTIFICATION_MODE_NONE);
                setGravity(getHorizontalGravity(value) | getVerticalGravity(verticalTextAlignment));
            }
        } else {
            setGravity(getHorizontalGravity(value) | getVerticalGravity(verticalTextAlignment));
        }
    }

    public void enableAutoSize(int minFontSize, int maxFontSize, int step) {
        TextViewCompat.setAutoSizeTextTypeUniformWithConfiguration(
            this,
            minFontSize, 
            maxFontSize,
            step,
            android.util.TypedValue.COMPLEX_UNIT_DIP
        );
    }

    public void disableAutoSize() {
        TextViewCompat.setAutoSizeTextTypeWithDefaults(
            this,
            TextViewCompat.AUTO_SIZE_TEXT_TYPE_NONE
        );
    }

    public void setLabelTextSize(int unit, float size, int minFontSize ,
        int maxFontSize,
        int step ) {

        boolean autoFontSizeEnabled = TextViewCompat.getAutoSizeTextType(this) == TextViewCompat.AUTO_SIZE_TEXT_TYPE_UNIFORM;

        // setTextSize is ignored if autoFontSize is enabled
        // so we need to disable autoFontSize just to set textSize
        if (autoFontSizeEnabled) {
            disableAutoSize();
        }
        setTextSize(unit, size);

        if (autoFontSizeEnabled) {
            enableAutoSize(minFontSize, maxFontSize, step);
        }
    }
    
    @Override
    public void setLineHeight(int value) {
        lineHeight = value;
        if (Build.VERSION.SDK_INT >= 28) {
            super.setLineHeight(value);
        } else {
            float fontHeight = getPaint().getFontMetrics(null);
            setLineSpacing(value - fontHeight, 1.0f);
        }
    }
    @Override
    public void setTypeface(Typeface value) {
        super.setTypeface(value);
        if (Build.VERSION.SDK_INT < 28 && lineHeight >= 0) {
            float fontHeight = getPaint().getFontMetrics(null);
            setLineSpacing(lineHeight - fontHeight, 1.0f);
        }
    }

    public void setTextDecoration(String value) {
        switch (value) {
            case "underline":
                setPaintFlags(Paint.UNDERLINE_TEXT_FLAG);
                break;
            case "line-through":
                setPaintFlags(Paint.STRIKE_THRU_TEXT_FLAG);
                break;
            case "underline line-through":
                setPaintFlags(
                    Paint.UNDERLINE_TEXT_FLAG | Paint.STRIKE_THRU_TEXT_FLAG 
                );
                break;
            default:
                setPaintFlags(0);
                break;
        }
    }

    public void setTextDecoration(int value) {
        setPaintFlags(value);
    }
    private MovementMethod defaultMovementMethod = null;
    public void setTappableState(boolean value) {
        if (value) {
            defaultMovementMethod = getMovementMethod();
            setMovementMethod(android.text.method.LinkMovementMethod.getInstance());
            setHighlightColor(Color.TRANSPARENT);
        } else {
            setMovementMethod(defaultMovementMethod);
        }
    }
 }