import { useCallback, useEffect, useRef, useState } from 'react';
import { theme } from 'antd';

interface CompareSliderProps {
  leftSrc: string;
  rightSrc: string;
  leftLabel: string;
  rightLabel: string;
  alt?: string;
  width: number;
  height: number;
}

/**
 * 同一张界面截图在两种主题下的对照：拖动中间的分割线看差异。
 * 键盘可达（←/→ 各 2%，Home/End 到两端）。
 */
export function CompareSlider({
  leftSrc,
  rightSrc,
  leftLabel,
  rightLabel,
  alt = '',
  width,
  height,
}: CompareSliderProps) {
  const { token } = theme.useToken();
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, ratio)));
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => updateFromClientX(event.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, updateFromClientX]);

  return (
    <figure className="compare">
      <div
        ref={frameRef}
        className="compare-frame"
        style={{
          borderColor: token.colorBorderSecondary,
          aspectRatio: `${width} / ${height}`,
        }}
        onPointerDown={(event) => {
          setDragging(true);
          updateFromClientX(event.clientX);
        }}
      >
        <img className="compare-img" src={leftSrc} alt={`${alt} · ${leftLabel}`} width={width} height={height} />
        <img
          className="compare-img compare-img-top"
          src={rightSrc}
          alt={`${alt} · ${rightLabel}`}
          width={width}
          height={height}
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        />

        <span className="compare-badge compare-badge-left" style={{ background: token.colorBgContainer }}>
          {leftLabel}
        </span>
        <span className="compare-badge compare-badge-right" style={{ background: token.colorBgContainer }}>
          {rightLabel}
        </span>

        <div
          className="compare-handle"
          role="slider"
          tabIndex={0}
          aria-label={`${leftLabel} 与 ${rightLabel} 对照，拖动改变分界`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(position)}
          aria-valuetext={`左侧 ${Math.round(100 - position)}% ${leftLabel}`}
          style={{ left: `${position}%`, color: token.colorPrimary }}
          onPointerDown={(event) => {
            event.stopPropagation();
            setDragging(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              setPosition((value) => Math.max(0, value - 2));
            } else if (event.key === 'ArrowRight') {
              event.preventDefault();
              setPosition((value) => Math.min(100, value + 2));
            } else if (event.key === 'Home') {
              event.preventDefault();
              setPosition(0);
            } else if (event.key === 'End') {
              event.preventDefault();
              setPosition(100);
            }
          }}
        >
          <span className="compare-grip" style={{ color: token.colorPrimary }}>
            ‹ ›
          </span>
        </div>
      </div>
    </figure>
  );
}
