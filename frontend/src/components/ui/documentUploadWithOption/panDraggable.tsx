/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
/*
  FROKED from https://github.com/gomezhyuuga/react-pan-zoom

  This is the source code from the above library
*/
import * as React from "react";

export interface IDragData {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export interface IReactPanZoomStateType {
  dragging: boolean;
  mouseDown: boolean;
  comesFromDragging: boolean;
  dragData: IDragData;
  matrixData: number[];
}

export interface IReactPanZoomProps {
  height?: string;
  width?: string;
  className?: string;
  enablePan?: boolean;
  reset?: () => void;
  zoom?: number;
  pandx?: number;
  pandy?: number;
  onPan?: (x: number, y: number) => void;
  onReset?: (dx: number, dy: number, zoom: number) => void;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const ReactPanZoom: React.FC<IReactPanZoomProps> = ({
  height,
  width,
  className = "",
  enablePan = true,
  reset,
  zoom = 0,
  pandx = 0,
  pandy = 0,
  onPan = () => undefined,
  onReset = () => undefined,
  onClick,
  style,
  children,
}) => {
  const panWrapperRef = React.useRef<HTMLDivElement>(null);
  const panContainerRef = React.useRef<HTMLDivElement>(null);

  const getInitialState = React.useCallback(() => {
    const defaultDragData = {
      dx: pandx,
      dy: pandy,
      x: 0,
      y: 0,
    };
    return {
      comesFromDragging: false,
      dragData: defaultDragData,
      dragging: false,
      matrixData: [zoom, 0, 0, zoom, pandx, pandy],
      mouseDown: false,
    };
  }, [pandx, pandy, zoom]);

  const [state, setState] =
    React.useState<IReactPanZoomStateType>(getInitialState);

  React.useEffect(() => {
    if (state.matrixData[0] !== zoom) {
      const newMatrixData = [...state.matrixData];
      newMatrixData[0] = zoom || newMatrixData[0];
      newMatrixData[3] = zoom || newMatrixData[3];
      setState((prev) => ({ ...prev, matrixData: newMatrixData }));
    }
  }, [zoom, state.matrixData]);

  const resetPan = React.useCallback(() => {
    const matrixData = [0.4, 0, 0, 0.4, 0, 0];
    setState((prev) => ({ ...prev, matrixData }));
    onReset(0, 0, 1);
  }, [onReset]);

  React.useEffect(() => {
    if (reset) {
      resetPan();
    }
  }, [reset, resetPan]);

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      if (state.comesFromDragging) {
        return;
      }
      onClick?.(e);
    },
    [state.comesFromDragging, onClick]
  );

  const panStart = React.useCallback(
    (
      pageX: number,
      pageY: number,
      event: React.MouseEvent | React.TouchEvent
    ) => {
      if (!enablePan) {
        return;
      }

      const { matrixData } = state;
      const offsetX = matrixData[4];
      const offsetY = matrixData[5];
      const newDragData: IDragData = {
        dx: offsetX,
        dy: offsetY,
        x: pageX,
        y: pageY,
      };

      setState((prev) => ({
        ...prev,
        dragData: newDragData,
        mouseDown: true,
      }));

      if (panWrapperRef.current) {
        panWrapperRef.current.style.cursor = "move";
      }

      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
      event.preventDefault();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enablePan, state.matrixData]
  );

  const panEnd = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      comesFromDragging: prev.dragging,
      dragging: false,
      mouseDown: false,
    }));

    if (panWrapperRef.current) {
      panWrapperRef.current.style.cursor = "";
    }

    onPan(state.matrixData[4], state.matrixData[5]);
  }, [onPan, state.matrixData]);

  const updateMousePosition = React.useCallback(
    (pageX: number, pageY: number) => {
      if (!state.mouseDown) {
        return;
      }

      const matrixData = getNewMatrixData(pageX, pageY);
      setState((prev) => ({
        ...prev,
        dragging: true,
        matrixData,
      }));

      if (panContainerRef.current) {
        panContainerRef.current.style.transform = `matrix(${state.matrixData.toString()})`;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.mouseDown, state.matrixData]
  );

  const getNewMatrixData = React.useCallback(
    (x: number, y: number): number[] => {
      const { dragData, matrixData } = state;
      const deltaX = dragData.x - x;
      const deltaY = dragData.y - y;
      const newMatrixData = [...matrixData];
      newMatrixData[4] = dragData.dx - deltaX;
      newMatrixData[5] = dragData.dy - deltaY;
      return newMatrixData;
    },
    [state]
  );

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      panStart(e.pageX, e.pageY, e);
    },
    [panStart]
  );

  const handleMouseUp = React.useCallback(() => {
    panEnd();
  }, [panEnd]);

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      updateMousePosition(e.pageX, e.pageY);
    },
    [updateMousePosition]
  );

  const handleTouchStart = React.useCallback(
    (e: React.TouchEvent) => {
      const { pageX, pageY } = e.touches[0];
      panStart(pageX, pageY, e);
    },
    [panStart]
  );

  const handleTouchEnd = React.useCallback(() => {
    panEnd();
  }, [panEnd]);

  const handleTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      updateMousePosition(e.touches[0].pageX, e.touches[0].pageY);
    },
    [updateMousePosition]
  );

  return (
    <div
      className={`pan-container ${className}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      style={{
        height,
        userSelect: "none",
        width,
        ...style,
      }}
      ref={panWrapperRef}
    >
      <div
        ref={panContainerRef}
        style={{
          transform: `matrix(${state.matrixData.toString()})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ReactPanZoom;
