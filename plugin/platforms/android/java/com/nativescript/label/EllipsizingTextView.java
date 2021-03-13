package com.nativescript.label;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.os.Parcel;
import android.text.Layout;
import android.text.Selection;
import android.text.Spannable;
import android.text.SpannableStringBuilder;
import android.text.Spanned;
import android.text.StaticLayout;
import android.text.TextPaint;
import android.text.TextUtils;
import android.util.Log;
import android.util.TypedValue;
import android.view.MotionEvent;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.widget.AppCompatTextView;

public class EllipsizingTextView extends AppCompatTextView {
    final static String TAG = "EllipsizingTextView";

    private TextUtils.TruncateAt ellipsize = null;
    // private TextUtils.TruncateAt multiLineEllipsize = null;
    private boolean isEllipsized = false;
    private boolean needsEllipsing = false;
    private boolean needsResizing = false;
    private boolean singleline = false;
    private boolean readyToEllipsize = true;
    private CharSequence fullText = null;
    private int maxLines = 0;
    private float lineSpacingMultiplier = 1.0f;
    private float lineAdditionalVerticalPadding = 0.0f;
    private float minTextSize = 20;
    private float maxTextSize = 30;

    float lastEllipsizeWidth = -1;
    float lastEllipsizeHeight = -1;
    private boolean frozen = false;
    private int[] lockedCompoundPadding;

    private float strokeWidth = 0;
    private Integer strokeColor = null;
    // private Paint.Join strokeJoin = Paint.Join.MITER;
    private float strokeMiter = 10;
    // private float minimumFontSize = -1;
    // private float autoshrinkSetFontSize = -1;
    private boolean wordWrap = true;
    private boolean initialized = false;

    int lastMeasuredWidth = -1;
    int lastMeasuredHeight = -1;

    private final static String ELLIPSIZE_CHAR = "...";
    private boolean needsEllipsize = false;

    public EllipsizingTextView(Context context) {
        super(context);
        maxTextSize = this.getTextSize();
        if (maxTextSize < 35) {
            maxTextSize = 30;
        }
        super.setSingleLine(false);
        initialized = true;
    }

    @Override
    public void onDraw(Canvas canvas) {
        if (strokeColor != null && strokeWidth > 0) {
            freeze();
            int restoreColor = this.getCurrentTextColor();
            TextPaint paint = this.getPaint();
            paint.setStyle(Paint.Style.STROKE);
            // paint.setStrokeJoin(strokeJoin);
            paint.setStrokeMiter(strokeMiter);
            this.setTextColor(strokeColor);
            paint.setStrokeWidth(strokeWidth * 2); // because the stroke is centered and not outside
            super.onDraw(canvas);
            paint.setStyle(Paint.Style.FILL);
            this.setTextColor(restoreColor);
            unfreeze();
        }
        super.onDraw(canvas);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int w = View.MeasureSpec.getSize(widthMeasureSpec);
        // int wm = MeasureSpec.getMode(widthMeasureSpec);
        int h = View.MeasureSpec.getSize(heightMeasureSpec);
        int hm = View.MeasureSpec.getMode(heightMeasureSpec);
        if (hm == 0)
            h = 100000;
            // Log.d("JS", "EllipsizingTextView onMeasure" + " " +   hm + " " +  w + " " + needsEllipsize);

        if ((hm == View.MeasureSpec.AT_MOST || hm == View.MeasureSpec.UNSPECIFIED)
                && (fullText == null || fullText.length() == 0)) {
            heightMeasureSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.EXACTLY);
        } else if (w > 0) {
            // Log.d("JS", "EllipsizingTextView onMeasure" + " " +   needsResizing + " " +  (w != lastMeasuredWidth || h != lastMeasuredHeight) + " " + needsEllipsize+ " " + readyToEllipsize+ " " + needsEllipsing);
            if (needsResizing) {
                refitText(this.getText().toString(), w);
            }

            if (w != lastMeasuredWidth || h != lastMeasuredHeight) {
                updateEllipsize(w - getPaddingLeft() - getPaddingRight(), h - getPaddingTop() - getPaddingBottom());
            } else {
                if (needsEllipsize && readyToEllipsize == true && needsEllipsing == true) {
                    ellipseText(w - getPaddingLeft() - getPaddingRight(), h - getPaddingTop() - getPaddingBottom());
                }
            }
            lastMeasuredWidth = w;
            lastMeasuredHeight = h;

            final boolean autoSize = false;
            // Only allow label to exceed the size of parent when it's size behavior with
            // wordwrap disabled
            if (!wordWrap && autoSize) {

                widthMeasureSpec = MeasureSpec.makeMeasureSpec(w, MeasureSpec.UNSPECIFIED);
                heightMeasureSpec = MeasureSpec.makeMeasureSpec(h, MeasureSpec.UNSPECIFIED);
            }
        }

        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
    }

    // @Override
    // public boolean onTouchEvent(MotionEvent event) {
    //     TextView textView = (TextView) this;
    //     Object text = textView.getText();
    //     // For html texts, we will manually detect url clicks.
    //     if (text instanceof CharSequence) {
    //         CharSequence spanned = (CharSequence) text;
    //         Spannable buffer = Spannable.Factory.getInstance().newSpannable(spanned.subSequence(0, spanned.length()));

    //         int action = event.getAction();

    //         if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_DOWN) {
    //             int x = (int) event.getX();
    //             int y = (int) event.getY();

    //             x -= textView.getTotalPaddingLeft();
    //             y -= textView.getTotalPaddingTop();

    //             x += textView.getScrollX();
    //             y += textView.getScrollY();

    //             Layout layout = textView.getLayout();
    //             int line = layout.getLineForVertical(y);
    //             int off = layout.getOffsetForHorizontal(line, x);

    //             ClickableSpan[] link = buffer.getSpans(off, off, ClickableSpan.class);

    //             if (link.length != 0) {
    //                 ClickableSpan cSpan = link[0];
    //                 if (action == MotionEvent.ACTION_UP) {
    //                     // TODO: trigger click event
    //                     //
    //                 } else if (action == MotionEvent.ACTION_DOWN) {
    //                     Selection.setSelection(buffer, buffer.getSpanStart(cSpan), buffer.getSpanEnd(cSpan));
    //                 }
    //             }
    //         }

    //     }

    //     return super.onTouchEvent(event);
    // }

    // Keep these things locked while onDraw in processing
    public void freeze() {
        lockedCompoundPadding = new int[] { getCompoundPaddingLeft(), getCompoundPaddingRight(),
                getCompoundPaddingTop(), getCompoundPaddingBottom() };
        frozen = true;
    }

    public void unfreeze() {
        frozen = false;
    }

    @Override
    public void requestLayout() {
        if (!frozen) {
            super.requestLayout();
        }
    }

    @Override
    public void postInvalidate() {
        if (!frozen) {
            super.postInvalidate();
        }
    }

    @Override
    public void postInvalidate(int left, int top, int right, int bottom) {
        if (!frozen) {
            super.postInvalidate(left, top, right, bottom);
        }
    }

    @Override
    public void invalidate() {
        if (!frozen) {
            super.invalidate();
        }
    }

    @Override
    public void invalidate(Rect rect) {
        if (!frozen)
            super.invalidate(rect);
    }

    @Override
    public void invalidate(int l, int t, int r, int b) {
        if (!frozen) {
            super.invalidate(l, t, r, b);
        }
    }

    @Override
    public int getCompoundPaddingLeft() {
        return !frozen ? super.getCompoundPaddingLeft() : lockedCompoundPadding[0];
    }

    @Override
    public int getCompoundPaddingRight() {
        return !frozen ? super.getCompoundPaddingRight() : lockedCompoundPadding[1];
    }

    @Override
    public int getCompoundPaddingTop() {
        return !frozen ? super.getCompoundPaddingTop() : lockedCompoundPadding[2];
    }

    @Override
    public int getCompoundPaddingBottom() {
        return !frozen ? super.getCompoundPaddingBottom() : lockedCompoundPadding[3];
    }

    public float getMinTextSize() {
        return minTextSize;
    }

    public void setMinTextSize(float minTextSize) {
        this.minTextSize = minTextSize;
    }

    public float getMaxTextSize() {
        return maxTextSize;
    }

    public void setMaxTextSize(float minTextSize) {
        this.maxTextSize = minTextSize;
    }

    public boolean isEllipsized() {
        return isEllipsized;
    }

    public void setReadyToEllipsize(Boolean value) {
        readyToEllipsize = value;
        // if (readyToEllipsize == true)
        // updateEllipsize();
    }

    @Override
    public void setMaxLines(int maxLines) {
        // log("EllipsizingTextView setMaxLines");
        super.setMaxLines((maxLines == 0) ? Integer.MAX_VALUE : maxLines);
        if (maxLines == Integer.MAX_VALUE) {
            maxLines = 0;
        }
        this.maxLines = maxLines;
        updateEllipsize();
    }

    public void updateEllipsize(int width, int height) {
        // log("EllipsizingTextView updateEllipsize");
        if (needsEllipsize) {
            needsEllipsing = true;
            if (readyToEllipsize == true) {
                ellipseText(width, height);
            }
        }
    }

    public void updateEllipsize() {
        // log("EllipsizingTextView updateEllipsize " + needsEllipsize);
        if (needsEllipsize) {
            needsEllipsing = true;
            if (readyToEllipsize == true) {
                ellipseText(getMeasuredWidth(), getMeasuredHeight());
            }
        }
    }

    public int getMaxLines() {
        return maxLines;
    }

    @Override
    public void setLineSpacing(float add, float mult) {
        // log("EllipsizingTextView setLineSpacing");
        this.lineAdditionalVerticalPadding = add;
        this.lineSpacingMultiplier = mult;
        super.setLineSpacing(add, mult);
        updateEllipsize();
    }

    @Override
    public void setTypeface(Typeface tf, int style) {
        // log("EllipsizingTextView setTypeface");
        super.setTypeface(tf, style);
        updateEllipsize();
    }

    private void log(final String message) {
        Log.d(TAG, message);
    }

    @Override
    public void setTextSize(int unit, float size) {
        // log("EllipsizingTextView setTextSize");
        super.setTextSize(unit, size);
        updateEllipsize();
    }

    // protected void makeLinkClickable(SpannableStringBuilder strBuilder, final
    // URLSpan span) {
    // int start = strBuilder.getSpanStart(span);
    // int end = strBuilder.getSpanEnd(span);
    // int flags = strBuilder.getSpanFlags(span);
    // TiLinkSpan clickable = new TiLinkSpan(span.getURL());
    // strBuilder.setSpan(clickable, start, end, flags);
    // strBuilder.removeSpan(span);
    // }

    // private boolean linkifying = false;

    @Override
    public void setText(CharSequence text, BufferType type) {
        // first set the super text so that linkifyIfEnabled
        // can read the value
        // final boolean textChanged = text != this.getText();
        // log("EllipsizingTextView setText '" + text + "' " );
        super.setText(text, type);
        // if (!linkifying && autoLink != 16) {
        // linkifying = true;
        // TiUIHelper.linkifyIfEnabled(this, autoLink);
        // text = super.getText();
        // linkifying = false;
        // }
        // if (text instanceof Spannable) {
        // SpannableStringBuilder strBuilder = (SpannableStringBuilder) ((text
        // instanceof SpannableStringBuilder)
        // ? text
        // : new SpannableStringBuilder(text));
        // URLSpan[] span = strBuilder.getSpans(0, text.length(), URLSpan.class);
        // for (int i = span.length - 1; i >= 0; i--) {
        // makeLinkClickable(strBuilder, span[i]);
        // }
        // text = strBuilder;
        // super.setText(text, type);
        // }
        // if (textChanged) {
        fullText = text;
        updateShouldEllipsize();
        updateEllipsize();
        // }
    }

    private void updateShouldEllipsize() {
        // log("EllipsizingTextView updateShouldEllipsize");
        needsEllipsize = (ellipsize != null) && fullText != null && fullText.length() > 0;

    }

    @Override
    public void setSingleLine(boolean singleLine) {
        // log("EllipsizingTextView setSingleLine");
        if (this.singleline == singleLine)
            return;
        this.singleline = singleLine;
        if (this.maxLines == 1 && singleLine == false) {
            // we were at maxLines==1 and singleLine==true
            // it s actually the same thing now so let s not change anything
        } else {
            super.setSingleLine(singleLine);
        }
        updateEllipsize();
    }

    @Override
    public void setEllipsize(TextUtils.TruncateAt where) {
        // Log.d("JS", "EllipsizingTextView setEllipsize" + " " +   where);
        // log("EllipsizingTextView setEllipsize");
        super.setEllipsize(where);
        ellipsize = where;
        updateShouldEllipsize();
        updateEllipsize();
    }

    @Override
    protected void onTextChanged(final CharSequence text, final int start, final int before, final int after) {
        // log("EllipsizingTextView onTextChanged " + needsResizing);
        super.onTextChanged(text, start, before, after);
        if (needsResizing) {
            refitText(this.getText().toString(), this.getWidth());
        }
    }

    // public void setMultiLineEllipsize(TextUtils.TruncateAt where) {
    //     // log("EllipsizingTextView setMultiLineEllipsize");
    //     multiLineEllipsize = where;
    //     updateShouldEllipsize();
    //     updateEllipsize();
    // }

    // public TextUtils.TruncateAt getMultiLineEllipsize() {
    //     return multiLineEllipsize;
    // }

    private void refitText(String text, int textWidth) {
        // log("EllipsizingTextView refitText");
        if (textWidth > 0) {
            int availableWidth = textWidth - this.getPaddingLeft() - this.getPaddingRight();
            float trySize = maxTextSize;

            this.setTextSize(TypedValue.COMPLEX_UNIT_PX, trySize);
            while ((trySize > minTextSize) && (this.getPaint().measureText(text) > availableWidth)) {
                trySize -= 1;
                if (trySize <= minTextSize) {
                    trySize = minTextSize;
                    break;
                }
                this.setTextSize(TypedValue.COMPLEX_UNIT_PX, trySize);
            }
            this.setTextSize(TypedValue.COMPLEX_UNIT_PX, trySize);
        }
    }

    private CharSequence strimText(CharSequence text) {
        // log("EllipsizingTextView strimText");
        int strimEnd = text.toString().trim().length();
        if (strimEnd != text.length()) {
            return text.subSequence(0, strimEnd);
        }
        return text;
    }

    private CharSequence getEllipsedTextForOneLine(CharSequence text, TextUtils.TruncateAt where, int width) {
        // log("EllipsizingTextView getEllipsedTextForOneLine");
        CharSequence newText = strimText(text);
        int length = ELLIPSIZE_CHAR.length();
        if (where == TextUtils.TruncateAt.START || where == TextUtils.TruncateAt.END) {
            if (where == TextUtils.TruncateAt.START) {
                newText = TextUtils.concat(ELLIPSIZE_CHAR, newText);
            } else if (where == TextUtils.TruncateAt.END) {
                newText = TextUtils.concat(newText, ELLIPSIZE_CHAR);
            }
            newText = TextUtils.ellipsize(newText, getPaint(), width, where);
            if (newText.length() <= length)
                return newText;
            String textStr = newText.toString();
            if (where == TextUtils.TruncateAt.START && !textStr.startsWith(ELLIPSIZE_CHAR)) {
                newText = TextUtils.concat(ELLIPSIZE_CHAR, newText.subSequence(length, textStr.length()));
            } else if (where == TextUtils.TruncateAt.END && !textStr.endsWith(ELLIPSIZE_CHAR)) {
                newText = TextUtils.concat(newText.subSequence(0, textStr.length() - length), ELLIPSIZE_CHAR);
            }
        } else {
            CharSequence newTextLeft = TextUtils.ellipsize(newText, getPaint(), width / 2, TextUtils.TruncateAt.END);
            CharSequence newTextRight = TextUtils.ellipsize(newText, getPaint(), width / 2, TextUtils.TruncateAt.START);
            String textLeftStr = newTextLeft.toString();
            String textRightStr = newTextRight.toString();
            if (textLeftStr.length() == 0
                    || (textLeftStr.length() + textRightStr.length() == newText.toString().length()))
                return newText;
            if (!textLeftStr.endsWith(ELLIPSIZE_CHAR)) {
                newTextLeft = TextUtils.concat(ELLIPSIZE_CHAR, newTextLeft.subSequence(length, textLeftStr.length()));
            }
            if (textRightStr.startsWith(ELLIPSIZE_CHAR)) {
                newTextRight = (CharSequence) newTextRight.subSequence(length, newTextRight.length());
            }
            newText = TextUtils.concat(newTextLeft, newTextRight);
        }
        return newText;

    }

    // @SuppressLint("NewApi")
    private Object duplicateSpan(Object span) {
        Parcel p = Parcel.obtain();
        p.writeValue(span);
        p.setDataPosition(0);
        Object result = p.readValue(span.getClass().getClassLoader());
        p.recycle();
        return result;
    }

    private void ellipseText(int width, int height) {
        // Log.d("JS", "EllipsizingTextView ellipseText" + " " +   width + " " +  height + " " + needsEllipsize);
        if (!needsEllipsize || needsEllipsing == false || (width <= 0) || (height <= 0))
            return;
        // if (width == lastEllipsizeWidth && height == lastEllipsizeHeight)
        // {
        // needsEllipsing = false;
        // return;
        // }
        boolean ellipsized = false;
        CharSequence workingText = fullText;

        if (fullText instanceof Spanned) {
            SpannableStringBuilder htmlWorkingText = new SpannableStringBuilder(fullText);
            if (this.singleline == false) {
                SpannableStringBuilder newText = new SpannableStringBuilder();
                String str = htmlWorkingText.toString();
                String[] separated = str.split("\n");
                int start = 0;
                int newStart = 0;
                for (int i = 0; i < separated.length; i++) {
                    String linestr = separated[i];
                    int end = start + linestr.length();
                    if (linestr.length() > 0) {
                        SpannableStringBuilder lineSpanned = (SpannableStringBuilder) htmlWorkingText.subSequence(start,
                                end);
                        Object[] spans = lineSpanned.getSpans(0, lineSpanned.length(), Object.class);

                        // this is a trick to get the Spans for the last line to be used in
                        // getEllipsedTextForOneLine
                        // we append,setSpans, getlastline with spans, ellipse, replace last line with
                        // last line ellipsized
                        newText.append(lineSpanned.toString());
                        for (int j = 0; j < spans.length; j++) {
                            int start2 = htmlWorkingText.getSpanStart(spans[j]);
                            int end2 = htmlWorkingText.getSpanEnd(spans[j]);
                            int mystart = newStart + Math.max(0, start2 - start);
                            int spanlengthonline = Math.min(end2, start + linestr.length()) - Math.max(start2, start);
                            int myend = Math.min(mystart + spanlengthonline, newStart + lineSpanned.length());
                            int flags = htmlWorkingText.getSpanFlags(spans[j]);
                            if (myend > mystart) {
                                Object newSpan = duplicateSpan(spans[j]);
                                newText.setSpan(newSpan, mystart, myend, flags);
                            }
                        }

                        CharSequence lastLine = newText.subSequence(newStart, newStart + lineSpanned.length());
                        if (createWorkingLayout(lastLine, width).getLineCount() > 1)
                            lastLine = getEllipsedTextForOneLine(lastLine, ellipsize, width);

                        newText.replace(newStart, newStart + lineSpanned.length(), lastLine);
                    }
                    if (i < (separated.length - 1))
                        newText.append('\n');
                    start = end + 1;
                    newStart = newText.length();
                }
                workingText = newText;
            } else{
                Layout layout = createWorkingLayout(workingText, width);
                int linesCount = getLinesCount(layout, height);
                if (layout.getLineCount() > linesCount && ellipsize != null) {
                    if (linesCount >= 2) {
                        int start2 = layout.getLineStart(linesCount - 1);
                        int end1 = layout.getLineEnd(linesCount - 2);
                        int end2 = layout.getLineEnd(linesCount - 1);
                        SpannableStringBuilder newText = new SpannableStringBuilder();
                        newText.append(fullText.subSequence(0, end1));
                        // We have more lines of text than we are allowed to display.
                        newText.append(getEllipsedTextForOneLine(fullText.subSequence(start2, end2), ellipsize, width));
                        workingText = newText;
                    } else {
                        workingText = getEllipsedTextForOneLine(
                                fullText.subSequence(0, layout.getLineEnd(linesCount - 1)), ellipsize, width);
                    }
                }
            }
        } else {
            if (this.singleline == false) {
                String str = workingText.toString();
                String newText = new String();
                String[] separated = str.split("\n");
                for (int i = 0; i < separated.length; i++) {
                    String linestr = separated[i];
                    if (linestr.length() > 0) {
                        if (createWorkingLayout(linestr, width).getLineCount() > 1)
                            newText += getEllipsedTextForOneLine(linestr, ellipsize, width);
                        else
                            newText += linestr;
                    }
                    if (i < (separated.length - 1))
                        newText += '\n';
                }
                workingText = newText;
            } else {
                Layout layout = createWorkingLayout(workingText, width);
                int linesCount = getLinesCount(layout, height);
                if (layout.getLineCount() > linesCount && ellipsize != null) {
                    if (linesCount >= 2) {
                        int start2 = layout.getLineStart(linesCount - 1);
                        int end1 = layout.getLineEnd(linesCount - 2);
                        int end2 = layout.getLineEnd(linesCount - 1);
                        SpannableStringBuilder newText = new SpannableStringBuilder();
                        newText.append(fullText.subSequence(0, end1));
                        // We have more lines of text than we are allowed to display.
                        newText.append(getEllipsedTextForOneLine(fullText.subSequence(start2, end2), ellipsize, width));
                        workingText = newText;
                    } else {
                        workingText = getEllipsedTextForOneLine(
                                fullText.subSequence(0, layout.getLineEnd(linesCount - 1)), ellipsize, width);
                    }

                }
            }
        }

        if (!workingText.equals(getText())) {
            try {
                super.setText(workingText, TextView.BufferType.SPANNABLE);
            } finally {
                ellipsized = true;

            }
        }
        needsEllipsing = false;
        lastEllipsizeWidth = width;
        lastEllipsizeHeight = height;
        if (ellipsized != isEllipsized) {
            isEllipsized = ellipsized;
        }
    }

    /**
     * Get how many lines of text we are allowed to display.
     */
    private int getLinesCount(Layout layout, int height) {
        // log("EllipsizingTextView getLinesCount");
        int fullyVisibleLinesCount = getFullyVisibleLinesCount(layout, height);
        if (fullyVisibleLinesCount == -1) {
            return fullyVisibleLinesCount = 1;
        }
        return (maxLines == 0) ? fullyVisibleLinesCount : Math.min(maxLines, fullyVisibleLinesCount);
    }

    /**
     * Get how many lines of text we can display so their full height is visible.
     */
    private int getFullyVisibleLinesCount(Layout layout, int height) {
        // log("EllipsizingTextView getFullyVisibleLinesCount");
        int totalLines = layout.getLineCount();
        int index = totalLines - 1;
        int lineHeight = layout.getLineBottom(index);
        while (lineHeight > height) {
            index -= 1;
            lineHeight = layout.getLineBottom(index);
        }
        return index + 1;
    }

    private Layout createWorkingLayout(CharSequence workingText, int width) {
        // log("EllipsizingTextView createWorkingLayout");
        return new StaticLayout(workingText, getPaint(), width, Layout.Alignment.ALIGN_NORMAL, lineSpacingMultiplier,
                lineAdditionalVerticalPadding, false /* includepad */);
    }
}