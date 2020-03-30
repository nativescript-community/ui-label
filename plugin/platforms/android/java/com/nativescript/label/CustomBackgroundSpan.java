package com.nativescript.label;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.shapes.RoundRectShape;
import android.graphics.drawable.shapes.Shape;
import android.text.style.ReplacementSpan;

public class CustomBackgroundSpan extends ReplacementSpan {
    public static class RoundedRectDrawable extends ShapeDrawable {
        private final Paint fillpaint, strokepaint;
        public RoundedRectDrawable(int radius, int fillColor, int strokeColor, int strokeWidth) {
            super(new RoundRectShape(new float[] { radius, radius, radius, radius, radius, radius, radius, radius },
                    null, null));
            fillpaint = new Paint(this.getPaint());
            fillpaint.setColor(fillColor);
            strokepaint = new Paint(fillpaint);
            strokepaint.setStyle(Paint.Style.STROKE);
            strokepaint.setStrokeWidth(strokeWidth);
            strokepaint.setColor(strokeColor);
        }

        @Override
        protected void onDraw(Shape shape, Canvas canvas, Paint paint) {
            shape.draw(canvas, fillpaint);
            shape.draw(canvas, strokepaint);
        }
    }
    private RoundedRectDrawable mDrawable;

    int radius;
    int fillColor;
    int strokeColor;
    int strokeWidth;

    public CustomBackgroundSpan(int radius, int fillColor, int strokeColor, int strokeWidth) {
        this.mDrawable = new RoundedRectDrawable(radius, fillColor, strokeColor, strokeWidth);
        this.radius = radius;
        this.fillColor = fillColor;
        this.strokeColor = strokeColor;
        this.strokeWidth = strokeWidth;
    }

    public CustomBackgroundSpan(CustomBackgroundSpan toCopy) {
        this(toCopy.radius, toCopy.fillColor, toCopy.strokeColor, toCopy.strokeWidth);
    }

    @Override
    public int getSize(Paint paint, CharSequence text, int start, int end, Paint.FontMetricsInt fm) {
        return measureText(paint, text, start, end);

    }

    private int measureText(Paint paint, CharSequence text, int start, int end) {
        return Math.round(paint.measureText(text, start, end));
    }

    @Override
    public void draw(Canvas canvas, CharSequence text, int start, int end, float x, int top, int y, int bottom, Paint paint) {
        float dx = strokeWidth / 2;
        Rect rect = new Rect((int)(x + dx), (int)(top + dx), (int)(x + measureText(paint, text, start, end) - strokeWidth/2), (int)(bottom - strokeWidth/2));
        this.mDrawable.setBounds(rect);
        canvas.save();
        this.mDrawable.draw(canvas);
        canvas.restore();
        canvas.drawText(text, start, end, x, y, paint);
    }

}